import { ShoppingBag, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

const CheckoutLoadingOverlay = ({ onDone }: { onDone: () => void }) => {
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('done'), 900);
    const t2 = setTimeout(() => onDone(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-background border border-border shadow-2xl px-10 py-12 text-center max-w-sm w-[90%] animate-scale-in">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {phase === 'loading' ? (
            <>
              <div className="absolute inset-0 border-4 border-foreground/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-foreground rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag size={28} className="text-foreground" />
              </div>
            </>
          ) : (
            <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center animate-scale-in">
              <Check size={36} className="text-background" strokeWidth={3} />
            </div>
          )}
        </div>
        <h3 className="luxury-heading text-lg tracking-[0.15em] mb-2">
          {phase === 'loading' ? 'Preparing Checkout' : 'Ready!'}
        </h3>
        <p className="text-xs text-muted-foreground tracking-wider">
          {phase === 'loading' ? 'Just a moment...' : 'Taking you to checkout'}
        </p>
      </div>
    </div>
  );
};

export default CheckoutLoadingOverlay;
