import { X, Copy, Check, Tag, Sparkles, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  image?: string;
  title?: string;
  note?: string;
  code?: string;
  continueLabel?: string;
  onContinue: () => void;
  onClose: () => void;
  embedded?: boolean; // for admin preview (no fixed/backdrop)
};

const CheckoutPromoPopup = ({ image, title, note, code, continueLabel, onContinue, onClose, embedded }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Coupon copy hoyeche!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy korte parlam na');
    }
  };

  const card = (
    <div className="relative bg-background w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
      {!embedded && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X size={16} />
        </button>
      )}

      {image ? (
        <div className="w-full h-52 bg-muted overflow-hidden">
          <img src={image} alt={title || 'Checkout offer'} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
          <ShoppingBag size={48} className="text-foreground/40" />
        </div>
      )}

      <div className="p-6 text-center space-y-4">
        <div className="text-primary">
          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold">
            {title || 'Checkout Confirmation'}
          </span>
        </div>

        {note && (
          <p
            className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line"
            style={{ fontFamily: 'SolaimanLipi, "Noto Sans Bengali", system-ui, sans-serif' }}
          >
            {note}
          </p>
        )}

        {code && code.trim() !== '' && (
          <div className="border-2 border-dashed border-foreground/30 p-4 bg-muted/30">
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2">Coupon Code</p>
            <div className="flex items-center justify-center gap-3">
              <Tag size={16} />
              <span className="text-lg sm:text-xl font-mono font-bold tracking-[0.2em]">{code}</span>
            </div>
            <button
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-2 text-xs px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Code</>}
            </button>
            <p className="text-[10px] text-muted-foreground mt-2 tracking-wider">
              Checkout page e coupon field e bosiye apply korun
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button onClick={onContinue} className="luxury-button-primary w-full text-xs py-3">
            {continueLabel || 'Continue to Checkout'}
          </button>
          {!embedded && (
            <button
              onClick={onClose}
              className="text-[11px] text-muted-foreground hover:text-foreground tracking-wider uppercase py-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md">{card}</div>
    </div>
  );
};

export default CheckoutPromoPopup;
