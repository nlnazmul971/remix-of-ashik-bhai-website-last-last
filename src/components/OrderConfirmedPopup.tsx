import { CheckCircle2, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  image?: string;
  title?: string;
  message?: string;
  buttonLabel?: string;
  orderId?: string;
  onClose: () => void;
  embedded?: boolean;
};

const OrderConfirmedPopup = ({ image, title, message, buttonLabel, orderId, onClose, embedded }: Props) => {
  const [copied, setCopied] = useState(false);
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : '';
  const handleCopy = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      toast.success('Order ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy korte parlam na');
    }
  };
  const card = (
    <div className="relative bg-background w-full max-w-xs overflow-hidden shadow-2xl animate-scale-in border border-border">
      {!embedded && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-background/80 backdrop-blur border border-border rounded-full flex items-center justify-center hover:bg-muted"
        >
          <X size={14} />
        </button>
      )}

      {image ? (
        <div className="w-full h-32 bg-muted overflow-hidden">
          <img src={image} alt={title || 'Order confirmed'} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
          <CheckCircle2 size={40} className="text-primary" />
        </div>
      )}

      <div className="p-5 text-center space-y-3">
        <h3 className="text-sm tracking-[0.2em] uppercase font-semibold text-primary">
          {title || 'Order Confirmed'}
        </h3>
        {message && (
          <p
            className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line"
            style={{ fontFamily: 'SolaimanLipi, "Noto Sans Bengali", system-ui, sans-serif' }}
          >
            {message}
          </p>
        )}
        {orderId && (
          <p className="text-xs font-mono tracking-wider">
            Order ID <span className="font-bold">#{shortId}</span>
          </p>
        )}
        <button onClick={onClose} className="luxury-button-primary w-full text-[11px] py-2.5 mt-2">
          {buttonLabel || 'OK'}
        </button>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xs">{card}</div>
    </div>
  );
};

export default OrderConfirmedPopup;
