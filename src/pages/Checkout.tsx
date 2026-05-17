import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutPaymentSettings, useCreateOrder, useDeliveryZones, useProfile, useUpdateProfile, useValidateCoupon, useIncrementCouponUsage, useStoreSettings, CouponRow } from '@/hooks/useSupabase';
import OrderConfirmedPopup from '@/components/OrderConfirmedPopup';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderEmail } from '@/lib/api';
import { toast } from 'sonner';
import { Check, Copy, ChevronDown } from 'lucide-react';
import { isValidBDPhone, sanitizeInput, isValidEmail } from '@/lib/botProtection';
import { pushBeginCheckout, pushPurchase } from '@/lib/gtm';
import { isWithinSchedule } from '@/lib/popupSchedule';

type PaymentMethod = 'cod' | 'online';
type OnlineProvider = 'bkash' | 'nagad' | null;
type DeliveryZone = string;

const FALLBACK_DELIVERY_OPTIONS: { id: DeliveryZone; label: string; subtitle: string; price: number }[] = [
  { id: 'Inside Dhaka', label: 'Inside Dhaka', subtitle: 'Dhaka city area', price: 70 },
  {
    id: 'Sub - Urban Dhaka',
    label: 'Sub - Urban Dhaka',
    subtitle: 'Ashulia, Dhamrai, Keranigonj, Dohar, Hemayetpur, Keraniganj Model, Nowabganj, Savar, South Keraniganj',
    price: 90,
  },
  {
    id: 'Outside Dhaka',
    label: 'Outside Dhaka',
    subtitle: 'All districts outside Dhaka',
    price: 110,
  },
];

const FALLBACK_PAYMENT_SETTINGS: Record<'bkash' | 'nagad', { number: string; instructions: string; is_active: boolean }> = {
  bkash: {
    number: '01712-345678',
    instructions: 'Please send the exact amount and enter your sender number + transaction ID below.',
    is_active: true,
  },
  nagad: {
    number: '01812-345678',
    instructions: 'Please send the exact amount and enter your sender number + transaction ID below.',
    is_active: true,
  },
};

const BkashLogo = () => (
  <div className="flex items-center justify-center h-10 px-4 rounded bg-[#E2136E] text-white font-bold text-sm tracking-wide">
    bKash
  </div>
);

const NagadLogo = () => (
  <div className="flex items-center justify-center h-10 px-4 rounded bg-[#F6921E] text-white font-bold text-sm tracking-wide">
    Nagad
  </div>
);

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const { data: zones = [] } = useDeliveryZones(false);
  const { data: paymentSettings = [] } = useCheckoutPaymentSettings();
  const { data: profile } = useProfile(user?.uid);

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', senderNumber: '', transactionId: '', customerNote: '' });
  const [attempted, setAttempted] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryZone>('');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [onlineProvider, setOnlineProvider] = useState<OnlineProvider>(null);
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showConfirmedPopup, setShowConfirmedPopup] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const { data: storeSettings } = useStoreSettings();
  const orderConfirmedEnabled = storeSettings?.order_confirmed_popup_enabled === 'true'
    && isWithinSchedule(storeSettings?.order_confirmed_popup_start_at, storeSettings?.order_confirmed_popup_end_at);
  const orderConfirmedTitle = storeSettings?.order_confirmed_popup_title || 'Order Confirmed!';
  const orderConfirmedMessage = storeSettings?.order_confirmed_popup_message || 'Apnar order ti grohon kora hoyeche. Amader team apnar sathe shighroi jogajog korbe.';
  const orderConfirmedImage = storeSettings?.order_confirmed_popup_image || '';
  const orderConfirmedButton = storeSettings?.order_confirmed_popup_button_label || 'OK';
  const validateCoupon = useValidateCoupon();
  const incrementCouponUsage = useIncrementCouponUsage();

  // Auto-fill from saved profile
  useEffect(() => {
    if (profile && useSavedAddress) {
      setForm(f => ({
        ...f,
        name: profile.display_name || f.name,
        phone: profile.phone || f.phone,
        address: profile.address || f.address,
        city: profile.city || f.city,
      }));
    }
    if (user?.email) {
      setForm(f => ({ ...f, email: f.email || user.email || '' }));
    }
  }, [profile, useSavedAddress, user]);


  // GTM: begin_checkout (auto-includes _fbp/_fbc/event_id/event_time)
  useEffect(() => {
    if (items.length === 0) return;
    pushBeginCheckout(items, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryOptions = useMemo(() => {
    const active = (zones || []).filter(z => z.is_active);
    if (active.length > 0) {
      return active.map(z => ({
        id: z.name,
        label: z.name,
        subtitle: z.description || '',
        price: z.fee,
      }));
    }
    return FALLBACK_DELIVERY_OPTIONS;
  }, [zones]);

  // Note: No auto-selection of delivery zone — user must explicitly pick one.
  useEffect(() => {
    if (delivery && !deliveryOptions.some(o => o.id === delivery)) {
      setDelivery('');
    }
  }, [deliveryOptions, delivery]);

  const deliveryFee = useMemo(() => {
    const selected = deliveryOptions.find(o => o.id === delivery);
    return selected?.price ?? 0;
  }, [delivery, deliveryOptions]);

  const isFreeShipping = appliedCoupon?.discount_type === 'free_shipping';
  const effectiveDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const grandTotal = Math.max(0, total + effectiveDeliveryFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    try {
      const coupon = await validateCoupon.mutateAsync({ code: couponCode, orderTotal: total });
      setAppliedCoupon(coupon);
      if (coupon.discount_type === 'free_shipping') {
        setCouponDiscount(0);
        toast.success(`Free shipping applied! ৳${deliveryFee} off delivery`);
      } else {
        const discount = coupon.discount_type === 'percentage'
          ? Math.round(total * coupon.discount_value / 100)
          : coupon.discount_value;
        setCouponDiscount(Math.min(discount, total));
        toast.success(`Coupon applied! ৳${Math.min(discount, total)} off`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const paymentMap = useMemo(() => {
    const map: Record<string, { number: string; instructions: string; is_active: boolean }> = {};
    for (const s of paymentSettings || []) {
      map[s.provider] = { number: s.number || '', instructions: s.instructions || '', is_active: s.is_active };
    }
    return map;
  }, [paymentSettings]);

  const getProviderSetting = useCallback(
    (provider: 'bkash' | 'nagad') => {
      return paymentMap[provider] ?? FALLBACK_PAYMENT_SETTINGS[provider];
    },
    [paymentMap]
  );

  const selectableProviders = useMemo((): Array<'bkash' | 'nagad'> => {
    const base: Array<'bkash' | 'nagad'> = ['bkash', 'nagad'];
    const active = base.filter(p => getProviderSetting(p).is_active);
    const list = active.length ? active : base;
    return list;
  }, [getProviderSetting]);

  useEffect(() => {
    if (payment !== 'online') return;
    const allowed = selectableProviders as unknown as Array<'bkash' | 'nagad'>;
    if (!onlineProvider || !allowed.includes(onlineProvider as any)) {
      setOnlineProvider(allowed[0] ?? 'bkash');
    }
  }, [payment, selectableProviders, onlineProvider]);

  const providerNumber = useMemo(() => {
    if (!onlineProvider) return null;
    return getProviderSetting(onlineProvider).number || null;
  }, [onlineProvider, getProviderSetting]);

  const providerInstruction = useMemo(() => {
    if (!onlineProvider) return '';
    return getProviderSetting(onlineProvider).instructions || '';
  }, [onlineProvider, getProviderSetting]);

  const handleCopy = useCallback(async (type: 'number' | 'amount', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      toast.success(type === 'number' ? 'Number copied' : 'Amount copied');
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      toast.error('Copy failed');
    }
  }, []);

  const handleDeliveryChange = (zone: DeliveryZone) => {
    setDelivery(zone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);



    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!isValidBDPhone(form.phone)) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }
    if (!delivery) {
      toast.error('Please select a delivery zone');
      return;
    }
    if (payment === 'online' && !onlineProvider) {
      toast.error('Please select a payment provider');
      return;
    }
    if (payment === 'online' && onlineProvider) {
      const s = getProviderSetting(onlineProvider);
      if (!s.is_active) {
        toast.error('Selected payment provider is currently unavailable');
        return;
      }
      if (!s.number) {
        toast.error('Payment number is not configured');
        return;
      }
    }
    if (payment === 'online' && !form.senderNumber) {
      toast.error('Please enter sender number');
      return;
    }
    if (payment === 'online' && !form.transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }
    try {
      const orderResult = await createOrder.mutateAsync({
        user_id: user?.uid || null,
        items: items.map(i => ({
          product_id: i.product.id,
          name: sanitizeInput(i.product.name, 200),
          quantity: i.quantity,
          price: i.product.price,
          size: i.size,
          color: i.color,
        })) as any,
        total: grandTotal,
        discount: couponDiscount,
        delivery_charge: effectiveDeliveryFee,
        customer_name: sanitizeInput(form.name, 100),
        customer_phone: form.phone.replace(/[^\d+\-\s]/g, '').slice(0, 20),
        customer_address: sanitizeInput(form.address, 500),
        customer_city: sanitizeInput(form.city, 100),
        delivery_method: delivery,
        payment_method: payment === 'online' ? onlineProvider! : 'cod',
        payment_sender_number: form.senderNumber ? form.senderNumber.replace(/[^\d+\-\s]/g, '').slice(0, 20) : null,
        transaction_id: form.transactionId ? sanitizeInput(form.transactionId, 50) : null,
        customer_note: form.customerNote ? sanitizeInput(form.customerNote, 500) : null,
        customer_email: form.email ? form.email.trim() : null,
      } as any);
      // Send order confirmation email (true fire & forget - no await)
      if (form.email) {
        sendOrderEmail({
          to: form.email,
          customerName: form.name,
          orderId: orderResult?.id || crypto.randomUUID(),
          items: items.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            size: i.size,
            color: i.color,
          })),
          subtotal: total,
          deliveryFee: effectiveDeliveryFee,
          discount: couponDiscount,
          total: grandTotal,
          deliveryMethod: delivery,
          paymentMethod: payment === 'online' ? onlineProvider : 'cod',
          address: form.address,
          city: form.city,
          phone: form.phone,
        }).catch(() => console.warn('Order confirmation email failed to send'));
      }
      // Save address to profile (fire & forget)
      if (user) {
        updateProfile.mutateAsync({
          userId: user.uid,
          display_name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
        }).catch(() => {});
      }
      // GTM: purchase (auto-includes _fbp/_fbc/event_id/event_time + user_data for sGTM CAPI)
      const _purchaseOrderId = orderResult?.id || ('ord_' + Date.now());
      pushPurchase({
        order_id: _purchaseOrderId,
        total: grandTotal,
        subtotal: total,
        delivery_charge: effectiveDeliveryFee,
        discount: couponDiscount,
        coupon: appliedCoupon?.code || '',
        items,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postal_code: '',
          country: 'BD',
        },
        payment_method: payment === 'online' ? (onlineProvider || 'online') : 'cod',
        delivery_method: delivery,
      });
      
      // Increment coupon usage
      if (appliedCoupon) {
        try { await incrementCouponUsage.mutateAsync(appliedCoupon.id); } catch {}
      }
      clearCart();
      try { localStorage.removeItem('spin_wheel_spun_v1'); } catch {}
      toast.success('Order placed successfully!');
      if (orderConfirmedEnabled) {
        setConfirmedOrderId(orderResult?.id || '');
        setShowConfirmedPopup(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Checkout" description="Complete your HIGHLIGHTS order — secure checkout with cash on delivery available." path="/checkout" noIndex />
      <Header />
      <CartDrawer />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <h1 className="luxury-heading text-3xl tracking-[0.15em] text-center mb-12">Checkout</h1>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground">Your cart is empty.</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            <div className="space-y-6">
              <h2 className="luxury-body text-[11px] text-foreground mb-4">Delivery Information</h2>
              
              {/* Saved address toggle */}
              {user && profile?.address && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 border border-border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={useSavedAddress}
                      onChange={e => {
                        setUseSavedAddress(e.target.checked);
                        if (!e.target.checked) {
                          setForm(f => ({ ...f, name: '', phone: '', address: '', city: '' }));
                        }
                      }}
                      className="accent-foreground"
                    />
                    Use saved address
                  </label>
                  {useSavedAddress && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {profile.address}, {profile.city}
                    </span>
                  )}
                </div>
              )}

              <div>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name *" className={`luxury-input ${attempted && !form.name.trim() ? 'border-destructive' : ''}`} />
                {attempted && !form.name.trim() && <p className="text-destructive text-xs mt-1">নাম লিখুন (Full Name দিন)</p>}
              </div>
              <div>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" className={`luxury-input ${attempted && (!form.email.trim() || !isValidEmail(form.email)) ? 'border-destructive' : ''}`} />
                {attempted && !form.email.trim() && <p className="text-destructive text-xs mt-1">ইমেইল লিখুন (example@gmail.com)</p>}
                {attempted && form.email.trim() && !isValidEmail(form.email) && <p className="text-destructive text-xs mt-1">সঠিক ইমেইল দিন (example@gmail.com ফরম্যাটে)</p>}
              </div>
              <div>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number *" className={`luxury-input ${attempted && (!form.phone.trim() || !isValidBDPhone(form.phone)) ? 'border-destructive' : ''}`} />
                {attempted && !form.phone.trim() && <p className="text-destructive text-xs mt-1">ফোন নম্বর লিখুন (01XXXXXXXXX)</p>}
                {attempted && form.phone.trim() && !isValidBDPhone(form.phone) && <p className="text-destructive text-xs mt-1">সঠিক বাংলাদেশি ফোন নম্বর দিন (01XXXXXXXXX ফরম্যাটে)</p>}
              </div>
              <div>
                <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address (House, Road, Area) *" className={`luxury-input min-h-[100px] resize-y ${attempted && !form.address.trim() ? 'border-destructive' : ''}`} rows={4} />
                {attempted && !form.address.trim() && <p className="text-destructive text-xs mt-1">সম্পূর্ণ ঠিকানা লিখুন (বাড়ি, রোড, এলাকা)</p>}
              </div>
              <div>
                <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City *" className={`luxury-input ${attempted && !form.city.trim() ? 'border-destructive' : ''}`} />
                {attempted && !form.city.trim() && <p className="text-destructive text-xs mt-1">শহরের নাম লিখুন (যেমন: Dhaka)</p>}
              </div>
              <textarea value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })} placeholder="Order Note (optional)" className="luxury-input min-h-[60px] resize-y" rows={2} />

              {/* Delivery Zone — separate section, no auto-selection */}
              <div className="border border-border p-5 mt-8">
                <h2 className="luxury-body text-[11px] text-foreground mb-1">Delivery Charge</h2>
                <p className="text-[11px] text-muted-foreground mb-4">আপনার এলাকা সিলেক্ট করুন</p>
                <div className="space-y-2">
                  {deliveryOptions.map(d => (
                    <label
                      key={d.id}
                      className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${delivery === d.id ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}
                      onClick={() => handleDeliveryChange(d.id)}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          delivery === d.id ? 'border-foreground' : 'border-muted-foreground'
                        }`}
                      >
                        {delivery === d.id && <div className="w-2 h-2 rounded-full bg-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{d.label}</p>
                        {d.subtitle ? (
                          <p className="text-xs mt-0.5 text-muted-foreground">{d.subtitle}</p>
                        ) : null}
                      </div>
                      <span className="text-sm flex-shrink-0">৳{d.price}</span>
                      <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => handleDeliveryChange(d.id)} className="hidden" />
                    </label>
                  ))}
                </div>
                {attempted && !delivery && (
                  <p className="text-destructive text-xs mt-2">Delivery zone সিলেক্ট করুন</p>
                )}
              </div>

              {/* Payment Method — separate section */}
              <div className="border border-border p-5 mt-6">
                <h2 className="luxury-body text-[11px] text-foreground mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  {(
                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${payment === 'cod' ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === 'cod' ? 'border-foreground' : 'border-muted-foreground'}`}>
                          {payment === 'cod' && <div className="w-2 h-2 rounded-full bg-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm">Cash on Delivery</p>
                          <p className="text-xs text-muted-foreground">Pay when you receive</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={payment === 'cod'}
                        onChange={() => {
                          setPayment('cod');
                          setOnlineProvider(null);
                          setForm(f => ({ ...f, senderNumber: '', transactionId: '' }));
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Online Payment */}
                  <div className={`border transition-colors ${payment === 'online' ? 'border-foreground' : 'border-border hover:border-muted-foreground'}`}>
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payment === 'online' ? 'border-foreground' : 'border-muted-foreground'}`}>
                          {payment === 'online' && <div className="w-2 h-2 rounded-full bg-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm">Online Payment</p>
                          <p className="text-xs text-muted-foreground">Pay via bKash or Nagad</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${payment === 'online' ? 'rotate-180' : ''}`} />
                      <input type="radio" name="payment" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} className="hidden" />
                    </label>

                    {payment === 'online' && (
                      <div className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {selectableProviders.includes('bkash') && (
                            <button
                              type="button"
                              onClick={() => setOnlineProvider('bkash')}
                              className={`p-3 border-2 transition-colors ${onlineProvider === 'bkash' ? 'border-[#E2136E]' : 'border-border hover:border-muted-foreground'}`}
                            >
                              <BkashLogo />
                            </button>
                          )}

                          {selectableProviders.includes('nagad') && (
                            <button
                              type="button"
                              onClick={() => setOnlineProvider('nagad')}
                              className={`p-3 border-2 transition-colors ${onlineProvider === 'nagad' ? 'border-[#F6921E]' : 'border-border hover:border-muted-foreground'}`}
                            >
                              <NagadLogo />
                            </button>
                          )}
                        </div>

                        {onlineProvider && providerNumber && (
                          <div className="p-4 bg-secondary/30 border border-border space-y-4">
                            <p className="text-sm font-medium">Send payment to {onlineProvider === 'bkash' ? 'bKash' : 'Nagad'}:</p>

                            {providerInstruction ? (
                              <p className="text-xs text-muted-foreground leading-relaxed">{providerInstruction}</p>
                            ) : null}

                            <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded">
                              <div>
                                <span className="text-xs text-muted-foreground">Number</span>
                                <p className="font-semibold tracking-wider">{providerNumber}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('number', providerNumber)}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {copied === 'number' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="text-sm">Copy</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded">
                              <div>
                                <span className="text-xs text-muted-foreground">Amount</span>
                                <p className="font-semibold">৳{grandTotal.toLocaleString()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('amount', grandTotal.toString())}
                                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                {copied === 'amount' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="text-sm">Copy</span>
                              </button>
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">
                                Sender Number <span className="text-destructive">*</span>
                              </label>
                              <input
                                required
                                value={form.senderNumber}
                                onChange={e => setForm({ ...form, senderNumber: e.target.value })}
                                placeholder={`Enter your ${onlineProvider === 'bkash' ? 'bKash' : 'Nagad'} number`}
                                className="luxury-input"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">
                                Transaction ID <span className="text-destructive">*</span>
                              </label>
                              <input
                                required
                                value={form.transactionId}
                                onChange={e => setForm({ ...form, transactionId: e.target.value })}
                                placeholder={`Enter your ${onlineProvider === 'bkash' ? 'bKash' : 'Nagad'} transaction ID`}
                                className="luxury-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-40 h-fit">
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Your order</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-5">HIGHLIGHTS</p>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                      <div className="flex gap-3 min-w-0">
                        <span className="text-muted-foreground shrink-0 tabular-nums">{item.quantity} &nbsp;x</span>
                        <div className="min-w-0">
                          <p className="text-foreground leading-snug">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.size} / {item.color}</p>
                        </div>
                      </div>
                      <span className="text-foreground whitespace-nowrap tabular-nums">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/60 transition-colors mt-5"
                >
                  <span className="text-lg leading-none">+</span>
                  <span>Add more items</span>
                </button>

                <div className="border-t border-dashed border-border my-5" />

                {/* Coupon Section */}
                <h3 className="text-base font-bold text-foreground mb-3">Vouchers for your order</h3>
                <div className="mb-5">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 border border-foreground/20 rounded-lg text-sm bg-secondary/40">
                      <div>
                        <span className="font-medium text-foreground">{appliedCoupon.code}</span>
                        {appliedCoupon.name && <span className="text-muted-foreground ml-1">({appliedCoupon.name})</span>}
                        <span className="text-foreground ml-2 tabular-nums">-৳{couponDiscount.toLocaleString()}</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-xs font-medium text-destructive hover:opacity-80">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon Code"
                        className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background text-sm uppercase tracking-wide focus:outline-none focus:border-foreground transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validateCoupon.isPending}
                        className="px-5 py-2.5 rounded-lg border border-foreground text-foreground text-sm font-semibold hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
                      >
                        {validateCoupon.isPending ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-border my-5" />

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums text-foreground">৳{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    {isFreeShipping ? (
                      <span className="tabular-nums"><span className="line-through mr-1">৳{deliveryFee}</span><span className="text-foreground font-medium">FREE</span></span>
                    ) : (
                      <span className="tabular-nums text-foreground">৳{deliveryFee}</span>
                    )}
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Coupon discount</span>
                      <span className="tabular-nums text-foreground">-৳{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {isFreeShipping && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Free shipping ({appliedCoupon?.code})</span>
                      <span className="tabular-nums text-foreground">-৳{deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mt-6">
                  <div>
                    <div className="text-2xl font-bold text-foreground">Total</div>
                    <div className="text-[11px] text-muted-foreground">(incl. fees and tax)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground tabular-nums">৳{grandTotal.toLocaleString()}</div>
                    {couponDiscount > 0 && (
                      <div className="text-sm text-muted-foreground line-through tabular-nums">৳{(total + deliveryFee).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="w-full mt-6 rounded-full bg-background text-foreground border border-foreground font-semibold text-base py-4 tracking-wide shadow-sm hover:bg-foreground hover:text-background active:bg-foreground active:text-background active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  {createOrder.isPending ? 'Placing Order...' : 'Place order'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
      <Footer />
      {showConfirmedPopup && (
        <OrderConfirmedPopup
          image={orderConfirmedImage}
          title={orderConfirmedTitle}
          message={orderConfirmedMessage}
          buttonLabel={orderConfirmedButton}
          orderId={confirmedOrderId}
          onClose={() => { setShowConfirmedPopup(false); navigate('/'); }}
        />
      )}
    </div>
  );
};

export default Checkout;

