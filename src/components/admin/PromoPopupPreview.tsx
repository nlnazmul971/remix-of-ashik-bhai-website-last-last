import { useState } from 'react';
import { X, Copy, Check, Sparkles, Tag } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  image: string;
  title: string;
  subtitle: string;
  code: string;
  details: string;
};

const PromoPopupPreview = ({ image, title, subtitle, code, details }: Props) => {
  const [view, setView] = useState<'teaser' | 'modal'>('teaser');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="border border-dashed border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground tracking-wider uppercase">Live Preview</p>
        <div className="flex gap-1 text-[10px]">
          <button
            onClick={() => setView('teaser')}
            className={`px-3 py-1 border ${view === 'teaser' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'}`}
          >
            Side Teaser
          </button>
          <button
            onClick={() => setView('modal')}
            className={`px-3 py-1 border ${view === 'modal' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'}`}
          >
            Detail Modal
          </button>
        </div>
      </div>

      <div className="relative bg-background border border-border min-h-[360px] flex items-center justify-center overflow-hidden">
        {view === 'teaser' ? (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="relative">
              <button
                aria-label="Close"
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-md"
              >
                <X size={12} />
              </button>
              <div
                className="block bg-background border border-border shadow-xl overflow-hidden"
                style={{ width: '110px' }}
              >
                <div className="relative w-full h-[140px] bg-muted">
                  {image ? (
                    <img src={image} alt={subtitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Sparkles className="text-primary" size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-foreground bg-background/90 px-2 py-1 text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {subtitle || 'Get 10% Off'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 bg-black/50">
            <div className="relative bg-background w-full max-w-sm overflow-hidden shadow-2xl">
              <button aria-label="Close" className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 border border-border rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
              {image && (
                <div className="w-full h-40 bg-muted overflow-hidden">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles size={16} />
                  <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">{title || 'Special Offer'}</span>
                  <Sparkles size={16} />
                </div>
                <h3 className="luxury-heading text-xl tracking-[0.1em]">{subtitle || 'Get 10% Off'}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{details || 'Use this coupon at checkout...'}</p>
                <div className="border-2 border-dashed border-foreground/30 p-3 bg-muted/30">
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">Your Coupon Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <Tag size={14} className="text-foreground" />
                    <span className="text-base font-mono font-bold tracking-[0.2em]">{code || 'WELCOME10'}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="mt-2 inline-flex items-center gap-2 text-[11px] px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Code</>}
                  </button>
                </div>
                <button className="luxury-button-primary w-full text-xs py-2.5">Shop Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoPopupPreview;
