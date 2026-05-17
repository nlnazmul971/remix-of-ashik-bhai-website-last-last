import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Copy, Check, Sparkles, Tag } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';
import { isWithinSchedule, toNumber } from '@/lib/popupSchedule';
import { toast } from 'sonner';

const PromoPopup = () => {
  const location = useLocation();
  const { data: settings } = useStoreSettings();
  const isAdmin = location.pathname.startsWith('/admin');
  const [showTeaser, setShowTeaser] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  const enabled = settings?.promo_popup_enabled === 'true';
  const image = settings?.promo_popup_image || '';
  const title = settings?.promo_popup_title || 'Special Offer';
  const subtitle = settings?.promo_popup_subtitle || 'Get 10% Off';
  const code = settings?.promo_popup_coupon_code || 'WELCOME10';
  const details = settings?.promo_popup_details || 'Use this coupon at checkout to get an exclusive discount on your first order.';
  const delaySec = toNumber(settings?.promo_popup_delay_seconds, 5);
  const autoCloseSec = toNumber(settings?.promo_popup_auto_close_seconds, 0);
  const startAt = settings?.promo_popup_start_at || '';
  const endAt = settings?.promo_popup_end_at || '';
  const scheduleOk = isWithinSchedule(startAt, endAt);

  useEffect(() => {
    if (isAdmin) return;
    if (!enabled || closed || !scheduleOk) return;
    const t = setTimeout(() => setShowTeaser(true), Math.max(0, delaySec * 1000));
    const closeTimer = autoCloseSec > 0
      ? setTimeout(() => setClosed(true), Math.max(0, (delaySec + autoCloseSec) * 1000))
      : null;
    return () => {
      clearTimeout(t);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [enabled, closed, scheduleOk, delaySec, autoCloseSec, isAdmin]);

  const handleClose = () => {
    setShowTeaser(false);
    setShowModal(false);
    setClosed(true);
  };

  useEffect(() => {
    if (!enabled) {
      setShowTeaser(false);
      setShowModal(false);
      setClosed(false);
    }
  }, [enabled]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Coupon code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (!enabled || closed || !scheduleOk) return null;

  return (
    <>
      {/* Side floating teaser */}
      {showTeaser && !showModal && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] animate-slide-in-right" style={{ animation: 'slideInLeft 0.5s ease-out' }}>
          <div className="relative">
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-md hover:bg-muted"
            >
              <X size={12} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="block bg-background border border-border shadow-xl hover:shadow-2xl transition-all overflow-hidden group w-[50px] sm:w-[70px]"
            >
              <div className="relative w-full h-[110px] sm:h-[160px] bg-muted">
                {image ? (
                  <img src={image} alt={subtitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 flex items-center justify-center font-thin">
                  <span
                    className="text-foreground bg-background/90 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {subtitle}
                  </span>
                </div>
              </div>
            </button>
          </div>
          <style>{`
            @keyframes slideInLeft {
              from { transform: translateX(-100%) translateY(-50%); opacity: 0; }
              to { transform: translateX(0) translateY(-50%); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Detail modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
        >
          <div
            className="relative bg-background w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center hover:bg-muted"
            >
              <X size={16} />
            </button>

            {image && (
              <div className="w-full h-56 bg-muted overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 text-center space-y-4">
              <div className="text-primary">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">{title}</span>
              </div>
              <h3 className="luxury-heading text-2xl sm:text-3xl tracking-[0.1em]">{subtitle}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{details}</p>

              <div className="border-2 border-dashed border-foreground/30 p-4 bg-muted/30">
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2">Your Coupon Code</p>
                <div className="flex items-center justify-center gap-3">
                  <Tag size={16} className="text-foreground" />
                  <span className="text-lg sm:text-xl font-mono font-bold tracking-[0.2em]">{code}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="mt-3 inline-flex items-center gap-2 text-xs px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Code</>}
                </button>
              </div>

              <button
                onClick={handleClose}
                className="luxury-button-primary w-full text-xs py-3"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromoPopup;
