import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import ImageUpload from './ImageUpload';
import PromoPopupPreview from './PromoPopupPreview';
import CheckoutPromoPopup from '../CheckoutPromoPopup';
import OrderConfirmedPopup from '../OrderConfirmedPopup';

const AdminPopups = () => {
  const { data: storeSettings } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();

  const [promo, setPromo] = useState({
    enabled: false, image: '', title: '', subtitle: '', code: '', details: '',
    delay: '5', autoClose: '0', startAt: '', endAt: '',
  });
  const [promoInit, setPromoInit] = useState(false);
  useEffect(() => {
    if (!storeSettings || promoInit) return;
    setPromo({
      enabled: storeSettings.promo_popup_enabled === 'true',
      image: storeSettings.promo_popup_image || '',
      title: storeSettings.promo_popup_title || 'Special Offer',
      subtitle: storeSettings.promo_popup_subtitle || 'Get 10% Off',
      code: storeSettings.promo_popup_coupon_code || 'WELCOME10',
      details: storeSettings.promo_popup_details || 'Use this coupon at checkout to get an exclusive discount on your first order.',
      delay: storeSettings.promo_popup_delay_seconds || '5',
      autoClose: storeSettings.promo_popup_auto_close_seconds || '0',
      startAt: storeSettings.promo_popup_start_at || '',
      endAt: storeSettings.promo_popup_end_at || '',
    });
    setPromoInit(true);
  }, [storeSettings, promoInit]);

  const [checkoutPopup, setCheckoutPopup] = useState({
    enabled: false, image: '', title: '', note: '', code: '', buttonLabel: '',
    startAt: '', endAt: '',
  });
  const [cpInit, setCpInit] = useState(false);
  useEffect(() => {
    if (!storeSettings || cpInit) return;
    setCheckoutPopup({
      enabled: storeSettings.checkout_popup_enabled === 'true',
      image: storeSettings.checkout_popup_image || '',
      title: storeSettings.checkout_popup_title || 'Order Confirm korun',
      note: storeSettings.checkout_popup_note || 'Priyo customer, apnar order ti confirm korar age ekbar product, size o quantity check kore nin. Cash on Delivery available. Order place korar por amader team apnar sathe jogajog korbe.',
      code: storeSettings.checkout_popup_coupon_code || '',
      buttonLabel: storeSettings.checkout_popup_button_label || 'Continue to Checkout',
      startAt: storeSettings.checkout_popup_start_at || '',
      endAt: storeSettings.checkout_popup_end_at || '',
    });
    setCpInit(true);
  }, [storeSettings, cpInit]);

  const [confirmed, setConfirmed] = useState({
    enabled: true, image: '', title: '', message: '', buttonLabel: '',
    startAt: '', endAt: '',
  });
  const [confirmedInit, setConfirmedInit] = useState(false);
  useEffect(() => {
    if (!storeSettings || confirmedInit) return;
    setConfirmed({
      enabled: storeSettings.order_confirmed_popup_enabled !== 'false',
      image: storeSettings.order_confirmed_popup_image || '',
      title: storeSettings.order_confirmed_popup_title || 'Order Confirmed!',
      message: storeSettings.order_confirmed_popup_message || 'Apnar order ti grohon kora hoyeche. Amader team apnar sathe shighroi jogajog korbe.',
      buttonLabel: storeSettings.order_confirmed_popup_button_label || 'OK',
      startAt: storeSettings.order_confirmed_popup_start_at || '',
      endAt: storeSettings.order_confirmed_popup_end_at || '',
    });
    setConfirmedInit(true);
  }, [storeSettings, confirmedInit]);

  const handleSaveConfirmed = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_enabled', value: confirmed.enabled ? 'true' : 'false' }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_image', value: confirmed.image }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_title', value: confirmed.title }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_message', value: confirmed.message }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_button_label', value: confirmed.buttonLabel }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_start_at', value: confirmed.startAt }),
        updateSetting.mutateAsync({ key: 'order_confirmed_popup_end_at', value: confirmed.endAt }),
      ]);
      toast.success('Order confirmed popup updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };


  const handleSavePromo = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'promo_popup_enabled', value: promo.enabled ? 'true' : 'false' }),
        updateSetting.mutateAsync({ key: 'promo_popup_image', value: promo.image }),
        updateSetting.mutateAsync({ key: 'promo_popup_title', value: promo.title }),
        updateSetting.mutateAsync({ key: 'promo_popup_subtitle', value: promo.subtitle }),
        updateSetting.mutateAsync({ key: 'promo_popup_coupon_code', value: promo.code }),
        updateSetting.mutateAsync({ key: 'promo_popup_details', value: promo.details }),
        updateSetting.mutateAsync({ key: 'promo_popup_delay_seconds', value: String(promo.delay) }),
        updateSetting.mutateAsync({ key: 'promo_popup_auto_close_seconds', value: String(promo.autoClose) }),
        updateSetting.mutateAsync({ key: 'promo_popup_start_at', value: promo.startAt }),
        updateSetting.mutateAsync({ key: 'promo_popup_end_at', value: promo.endAt }),
      ]);
      toast.success('Promo popup updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleSaveCheckoutPopup = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'checkout_popup_enabled', value: checkoutPopup.enabled ? 'true' : 'false' }),
        updateSetting.mutateAsync({ key: 'checkout_popup_image', value: checkoutPopup.image }),
        updateSetting.mutateAsync({ key: 'checkout_popup_title', value: checkoutPopup.title }),
        updateSetting.mutateAsync({ key: 'checkout_popup_note', value: checkoutPopup.note }),
        updateSetting.mutateAsync({ key: 'checkout_popup_coupon_code', value: checkoutPopup.code }),
        updateSetting.mutateAsync({ key: 'checkout_popup_button_label', value: checkoutPopup.buttonLabel }),
        updateSetting.mutateAsync({ key: 'checkout_popup_start_at', value: checkoutPopup.startAt }),
        updateSetting.mutateAsync({ key: 'checkout_popup_end_at', value: checkoutPopup.endAt }),
      ]);
      toast.success('Checkout popup updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  // Reusable schedule fields renderer
  const TimeFields = ({ values, onChange, showDelay = false }: {
    values: { delay?: string; autoClose?: string; startAt: string; endAt: string };
    onChange: (patch: any) => void;
    showDelay?: boolean;
  }) => (
    <div className="border-t border-border pt-4 mt-2 space-y-3">
      <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Timing & Schedule</p>
      {showDelay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Delay (seconds before popup shows)</label>
            <input type="number" min={0} value={values.delay ?? '0'} onChange={e => onChange({ delay: e.target.value })} className="luxury-input" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Auto-close after (seconds, 0 = never)</label>
            <input type="number" min={0} value={values.autoClose ?? '0'} onChange={e => onChange({ autoClose: e.target.value })} className="luxury-input" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Start at (optional)</label>
          <input type="datetime-local" value={values.startAt} onChange={e => onChange({ startAt: e.target.value })} className="luxury-input" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">End at (optional)</label>
          <input type="datetime-local" value={values.endAt} onChange={e => onChange({ endAt: e.target.value })} className="luxury-input" />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Start/End khali rakhle limit nai. Active na thakle popup automatically off thakbe.</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Promo Popup */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Promo Popup</h3>
            <p className="text-xs text-muted-foreground mt-1">Visitor website e dhukle 5s por side e popup ashbe. Click korle coupon details modal khulbe.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={promo.enabled}
              onChange={e => setPromo(p => ({ ...p, enabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Popup Image</label>
              <ImageUpload value={promo.image} onChange={url => setPromo(p => ({ ...p, image: url }))} folder="promo" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Title (small)</label>
              <input value={promo.title} onChange={e => setPromo(p => ({ ...p, title: e.target.value }))} className="luxury-input" placeholder="Special Offer" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Subtitle (big — shows on side)</label>
              <input value={promo.subtitle} onChange={e => setPromo(p => ({ ...p, subtitle: e.target.value }))} className="luxury-input" placeholder="Get 10% Off" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Coupon Code</label>
              <input value={promo.code} onChange={e => setPromo(p => ({ ...p, code: e.target.value }))} className="luxury-input font-mono" placeholder="WELCOME10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Details / Description</label>
              <textarea value={promo.details} onChange={e => setPromo(p => ({ ...p, details: e.target.value }))} className="luxury-input min-h-[80px]" placeholder="Use this coupon at checkout..." />
            </div>
          </div>
        </div>

        <PromoPopupPreview
          image={promo.image}
          title={promo.title}
          subtitle={promo.subtitle}
          code={promo.code}
          details={promo.details}
        />

        <TimeFields
          values={promo}
          onChange={(patch) => setPromo(p => ({ ...p, ...patch }))}
          showDelay
        />

        <div className="flex justify-end">
          <button onClick={handleSavePromo} disabled={updateSetting.isPending} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
            <Save size={14} /> Save Promo Popup
          </button>
        </div>
      </div>

      {/* Checkout Popup */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Checkout Popup</h3>
            <p className="text-xs text-muted-foreground mt-1">Cart drawer e Checkout button click korle ei popup ashbe — image, Bangla note ar optional coupon dekhabe.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={checkoutPopup.enabled}
              onChange={e => setCheckoutPopup(p => ({ ...p, enabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Popup Image</label>
              <ImageUpload value={checkoutPopup.image} onChange={url => setCheckoutPopup(p => ({ ...p, image: url }))} folder="checkout-popup" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Title (small heading)</label>
              <input value={checkoutPopup.title} onChange={e => setCheckoutPopup(p => ({ ...p, title: e.target.value }))} className="luxury-input" placeholder="Order Confirm korun" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Bangla Note</label>
              <textarea value={checkoutPopup.note} onChange={e => setCheckoutPopup(p => ({ ...p, note: e.target.value }))} className="luxury-input min-h-[120px]" placeholder="Priyo customer..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Coupon Code (optional — khali rakhle dekhabe na)</label>
              <input value={checkoutPopup.code} onChange={e => setCheckoutPopup(p => ({ ...p, code: e.target.value }))} className="luxury-input font-mono" placeholder="WELCOME10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Button Label</label>
              <input value={checkoutPopup.buttonLabel} onChange={e => setCheckoutPopup(p => ({ ...p, buttonLabel: e.target.value }))} className="luxury-input" placeholder="Continue to Checkout" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">Live Preview</label>
            <div className="bg-muted/30 border border-border p-4 flex items-start justify-center">
              <CheckoutPromoPopup
                embedded
                image={checkoutPopup.image}
                title={checkoutPopup.title}
                note={checkoutPopup.note}
                code={checkoutPopup.code}
                continueLabel={checkoutPopup.buttonLabel}
                onContinue={() => {}}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>

        <TimeFields
          values={checkoutPopup}
          onChange={(patch) => setCheckoutPopup(p => ({ ...p, ...patch }))}
        />

        <div className="flex justify-end">
          <button onClick={handleSaveCheckoutPopup} disabled={updateSetting.isPending} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
            <Save size={14} /> Save Checkout Popup
          </button>
        </div>
      </div>

      {/* Order Confirmed Popup */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Order Confirmed Popup</h3>
            <p className="text-xs text-muted-foreground mt-1">Order place korar por customer ke ekta chotto confirmation popup dekhabe.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed.enabled}
              onChange={e => setConfirmed(p => ({ ...p, enabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Popup Image (optional)</label>
              <ImageUpload value={confirmed.image} onChange={url => setConfirmed(p => ({ ...p, image: url }))} folder="order-confirmed" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Title</label>
              <input value={confirmed.title} onChange={e => setConfirmed(p => ({ ...p, title: e.target.value }))} className="luxury-input" placeholder="Order Confirmed!" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Message</label>
              <textarea value={confirmed.message} onChange={e => setConfirmed(p => ({ ...p, message: e.target.value }))} className="luxury-input min-h-[100px]" placeholder="Apnar order ti grohon kora hoyeche..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1">Button Label</label>
              <input value={confirmed.buttonLabel} onChange={e => setConfirmed(p => ({ ...p, buttonLabel: e.target.value }))} className="luxury-input" placeholder="OK" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-2">Live Preview</label>
            <div className="bg-muted/30 border border-border p-4 flex items-start justify-center">
              <OrderConfirmedPopup
                embedded
                image={confirmed.image}
                title={confirmed.title}
                message={confirmed.message}
                buttonLabel={confirmed.buttonLabel}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>

        <TimeFields
          values={confirmed}
          onChange={(patch) => setConfirmed(p => ({ ...p, ...patch }))}
        />

        <div className="flex justify-end">
          <button onClick={handleSaveConfirmed} disabled={updateSetting.isPending} className="luxury-button-primary inline-flex items-center gap-2 text-[10px]">
            <Save size={14} /> Save Order Confirmed Popup
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminPopups;
