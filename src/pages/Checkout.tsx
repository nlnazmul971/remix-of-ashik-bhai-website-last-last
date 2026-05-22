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

  const { data: settings = {} } = { data: storeSettings || {} } as any;
  const siteLogo = (storeSettings as any)?.['site_logo'] || '/logo.png';
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Checkout" description="Complete your order — secure checkout with cash on delivery available." path="/checkout" noIndex />
      <CartDrawer />

      {/* Slim header with centered logo + cart */}
      <header className="border-b border-border bg-background">
        <div className="max-w-full mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="w-8" />
          <button type="button" onClick={() => navigate('/')} className="flex items-center justify-center" aria-label="Home">
            <img src={siteLogo} alt="Logo" className="h-12 w-auto object-contain" />
          </button>
          <button type="button" onClick={() => setIsCartOpen(true)} className="relative p-1 text-foreground/70 hover:text-foreground" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-foreground text-background text-[10px] rounded-full flex items-center justify-center">{itemCount}</span>
            )}
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <button onClick={() => navigate('/')} className="text-sm underline">Continue shopping</button>
        </main>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
          {/* LEFT — form column */}
          <div className="bg-background order-2 lg:order-1">
            <div className="max-w-[560px] ml-auto mr-0 w-full px-5 sm:px-10 py-8 sm:py-12">

              {/* Saved address chip (logged in) */}
              {user && profile?.address && (
                <label className="flex items-center gap-2 mb-6 text-sm cursor-pointer">
                  <input type="checkbox" checked={useSavedAddress} onChange={e => {
                    setUseSavedAddress(e.target.checked);
                    if (!e.target.checked) setForm(f => ({ ...f, name: '', phone: '', address: '', city: '' }));
                  }} className="accent-[#1773b0]" />
                  Use saved address — {profile.address}, {profile.city}
                </label>
              )}

              {/* Contact */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[20px] font-semibold text-foreground">Contact</h2>
                {!user && (
                  <button type="button" onClick={() => navigate('/profile')} className="text-sm text-[#1773b0] underline">Sign in</button>
                )}
              </div>
              <FloatingInput
                label="Email or mobile phone number"
                value={form.email}
                onChange={v => setForm({ ...form, email: v })}
                error={attempted && (!form.email.trim() || !isValidEmail(form.email))}
                required
              />
              <label className="flex items-center gap-2 mt-3 text-sm text-foreground/80 cursor-pointer">
                <input type="checkbox" className="accent-[#1773b0] w-4 h-4" />
                Email me with news and offers
              </label>

              {/* Delivery */}
              <h2 className="text-[20px] font-semibold text-foreground mt-8 mb-3">Delivery</h2>
              <div className="space-y-3">
                <FloatingInput label="Country/Region" value="Bangladesh" onChange={() => {}} disabled />
                <FloatingInput
                  label="Full name"
                  value={form.name}
                  onChange={v => setForm({ ...form, name: v })}
                  error={attempted && !form.name.trim()}
                  required
                />
                <FloatingInput
                  label="Address"
                  value={form.address}
                  onChange={v => setForm({ ...form, address: v })}
                  error={attempted && !form.address.trim()}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FloatingInput
                    label="City"
                    value={form.city}
                    onChange={v => setForm({ ...form, city: v })}
                    error={attempted && !form.city.trim()}
                    required
                  />
                  <FloatingInput label="Postal code (optional)" value="" onChange={() => {}} />
                </div>
                <FloatingInput
                  label="Phone"
                  value={form.phone}
                  onChange={v => setForm({ ...form, phone: v })}
                  error={attempted && (!form.phone.trim() || !isValidBDPhone(form.phone))}
                  required
                />
                <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                  <input type="checkbox" className="accent-[#1773b0] w-4 h-4" />
                  Save this information for next time
                </label>
              </div>

              {/* Shipping method */}
              <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">Shipping method</h2>
              <div className="border border-border rounded-md overflow-hidden">
                {deliveryOptions.map((d, i) => {
                  const selected = delivery === d.id;
                  return (
                    <label
                      key={d.id}
                      onClick={() => handleDeliveryChange(d.id)}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer transition-colors ${i > 0 ? 'border-t border-border' : ''} ${selected ? 'bg-[#eff5fb] ring-1 ring-[#1773b0] ring-inset' : 'hover:bg-secondary/40'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 ${selected ? 'border-[#1773b0]' : 'border-muted-foreground/50'}`}>
                          {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#1773b0]" />}
                        </span>
                        <span className="text-sm text-foreground truncate">{d.label}</span>
                      </div>
                      <span className="text-sm text-foreground whitespace-nowrap tabular-nums">৳{d.price.toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
              {attempted && !delivery && (
                <p className="text-destructive text-xs mt-2">Please select a delivery zone</p>
              )}

              {/* Payment */}
              <h2 className="text-[20px] font-semibold text-foreground mt-8 mb-1">Payment</h2>
              <p className="text-xs text-muted-foreground mb-3">All transactions are secure and encrypted.</p>
              <div className="border border-border rounded-md overflow-hidden">
                <label
                  onClick={() => { setPayment('cod'); setOnlineProvider(null); setForm(f => ({ ...f, senderNumber: '', transactionId: '' })); }}
                  className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${payment === 'cod' ? 'bg-[#eff5fb] ring-1 ring-[#1773b0] ring-inset' : 'hover:bg-secondary/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center ${payment === 'cod' ? 'border-[#1773b0]' : 'border-muted-foreground/50'}`}>
                      {payment === 'cod' && <span className="w-2.5 h-2.5 rounded-full bg-[#1773b0]" />}
                    </span>
                    <span className="text-sm text-foreground">Cash on Delivery (COD)</span>
                  </div>
                </label>
                {selectableProviders.length > 0 && (
                  <div className={`border-t border-border ${payment === 'online' ? 'bg-[#eff5fb]' : ''}`}>
                    <label
                      onClick={() => setPayment('online')}
                      className={`flex items-center justify-between px-4 py-3.5 cursor-pointer ${payment === 'online' ? 'ring-1 ring-[#1773b0] ring-inset' : 'hover:bg-secondary/40'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center ${payment === 'online' ? 'border-[#1773b0]' : 'border-muted-foreground/50'}`}>
                          {payment === 'online' && <span className="w-2.5 h-2.5 rounded-full bg-[#1773b0]" />}
                        </span>
                        <span className="text-sm text-foreground">Online Payment (bKash / Nagad)</span>
                      </div>
                    </label>
                    {payment === 'online' && (
                      <div className="px-4 pb-4 pt-1 space-y-3">
                        <div className="flex gap-3">
                          {selectableProviders.includes('bkash') && (
                            <button type="button" onClick={() => setOnlineProvider('bkash')} className={`flex-1 p-2 border-2 rounded ${onlineProvider === 'bkash' ? 'border-[#E2136E]' : 'border-border'}`}><BkashLogo /></button>
                          )}
                          {selectableProviders.includes('nagad') && (
                            <button type="button" onClick={() => setOnlineProvider('nagad')} className={`flex-1 p-2 border-2 rounded ${onlineProvider === 'nagad' ? 'border-[#F6921E]' : 'border-border'}`}><NagadLogo /></button>
                          )}
                        </div>
                        {onlineProvider && providerNumber && (
                          <div className="space-y-3">
                            {providerInstruction && <p className="text-xs text-muted-foreground">{providerInstruction}</p>}
                            <div className="flex items-center justify-between p-3 bg-background border border-border rounded">
                              <div><span className="text-xs text-muted-foreground">Number</span><p className="font-semibold">{providerNumber}</p></div>
                              <button type="button" onClick={() => handleCopy('number', providerNumber)} className="px-3 py-1.5 border border-border rounded text-xs flex items-center gap-1">{copied === 'number' ? <Check size={12} /> : <Copy size={12} />}Copy</button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-background border border-border rounded">
                              <div><span className="text-xs text-muted-foreground">Amount</span><p className="font-semibold">৳{grandTotal.toLocaleString()}</p></div>
                              <button type="button" onClick={() => handleCopy('amount', grandTotal.toString())} className="px-3 py-1.5 border border-border rounded text-xs flex items-center gap-1">{copied === 'amount' ? <Check size={12} /> : <Copy size={12} />}Copy</button>
                            </div>
                            <FloatingInput label="Sender number" value={form.senderNumber} onChange={v => setForm({ ...form, senderNumber: v })} required />
                            <FloatingInput label="Transaction ID" value={form.transactionId} onChange={v => setForm({ ...form, transactionId: v })} required />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Billing address */}
              <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">Billing address</h2>
              <div className="border border-border rounded-md overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-[#eff5fb] ring-1 ring-[#1773b0] ring-inset">
                  <span className="w-[18px] h-[18px] rounded-full border border-[#1773b0] flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1773b0]" />
                  </span>
                  <span className="text-sm">Same as shipping address</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3.5 cursor-not-allowed opacity-60 border-t border-border">
                  <span className="w-[18px] h-[18px] rounded-full border border-muted-foreground/50" />
                  <span className="text-sm">Use a different billing address</span>
                </label>
              </div>

              {/* Optional note (hidden compact) */}
              <textarea
                value={form.customerNote}
                onChange={e => setForm({ ...form, customerNote: e.target.value })}
                placeholder="Order note (optional)"
                className="w-full mt-4 px-4 py-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:border-[#1773b0] focus:ring-1 focus:ring-[#1773b0] resize-none"
                rows={2}
              />

              {/* Complete order */}
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full mt-6 py-4 rounded-md bg-[#1773b0] hover:bg-[#155f93] text-white text-[15px] font-medium transition-colors disabled:opacity-60"
              >
                {createOrder.isPending ? 'Placing Order...' : 'Complete order'}
              </button>

              {/* Policy links */}
              <div className="mt-8 pt-5 border-t border-border flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#1773b0]">
                <a href="/refund-policy" className="underline">Refund policy</a>
                <a href="/shipping-policy" className="underline">Shipping</a>
                <a href="/privacy-policy" className="underline">Privacy policy</a>
                <a href="/terms" className="underline">Terms of service</a>
                <a href="/contact" className="underline">Contact</a>
              </div>
            </div>
          </div>

          {/* RIGHT — order summary (gray panel) */}
          <aside className="bg-[#f5f5f5] order-1 lg:order-2 border-b lg:border-b-0 lg:border-l border-border">
            <div className="max-w-[560px] mr-auto ml-0 w-full px-5 sm:px-10 py-8 sm:py-12 lg:sticky lg:top-0">
              <div className="space-y-4 mb-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={item.product.image_url} alt={item.product.name} className="w-[60px] h-[60px] object-cover rounded border border-border" />
                      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 bg-foreground text-background text-[11px] rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug line-clamp-2">{item.product.name}</p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-muted-foreground mt-0.5">{[item.size, item.color].filter(Boolean).join(' / ')}</p>
                      )}
                    </div>
                    <span className="text-sm text-foreground whitespace-nowrap tabular-nums">৳{(item.product.price * item.quantity).toLocaleString()}.00</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 border border-border rounded-md bg-background mb-4">
                  <span className="text-sm font-medium">{appliedCoupon.code}</span>
                  <button type="button" onClick={handleRemoveCoupon} className="text-xs text-destructive">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2 mb-5">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Discount code"
                    className="flex-1 px-3 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:border-[#1773b0] focus:ring-1 focus:ring-[#1773b0]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validateCoupon.isPending || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-md bg-foreground/10 text-foreground text-sm font-medium hover:bg-foreground/20 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}

              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-foreground">Subtotal</span>
                  <span className="tabular-nums">৳{total.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground flex items-center gap-1">Shipping <span className="text-muted-foreground">ⓘ</span></span>
                  {delivery ? (
                    isFreeShipping ? <span className="tabular-nums">FREE</span> : <span className="tabular-nums">৳{deliveryFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Enter shipping address</span>
                  )}
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums">-৳{couponDiscount.toLocaleString()}.00</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline mt-5 pt-4 border-t border-border">
                <span className="text-[18px] font-semibold text-foreground">Total</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">BDT</span>
                  <span className="text-[22px] font-semibold text-foreground tabular-nums">৳{grandTotal.toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      )}

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

// Shopify-style floating-label input
const FloatingInput = ({
  label, value, onChange, required, disabled, error, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  type?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className={`peer w-full h-[52px] px-3 pt-5 pb-1.5 text-sm bg-background border rounded-md focus:outline-none transition-colors ${
          error ? 'border-destructive ring-1 ring-destructive'
          : focused ? 'border-[#1773b0] ring-1 ring-[#1773b0]'
          : 'border-border hover:border-foreground/40'
        } ${disabled ? 'bg-secondary/50 cursor-not-allowed' : ''}`}
      />
      <label
        className={`absolute left-3 pointer-events-none transition-all ${
          focused || filled
            ? 'top-1.5 text-[11px] text-muted-foreground'
            : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default Checkout;


