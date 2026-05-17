import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/hooks/useSupabase';

const FloatingActions = () => {
  const location = useLocation();
  const { setIsCartOpen, itemCount } = useCart();
  const { data: s } = useStoreSettings();

  if (location.pathname.startsWith('/admin')) return null;

  const messageLink = s?.footer_whatsapp || s?.footer_messenger || '';

  const handleMessage = () => {
    if (messageLink) {
      window.open(messageLink, '_blank');
    }
  };

  return (
    <div className="hidden sm:flex fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40 flex-col gap-3">
      {messageLink && (
        <button
          onClick={handleMessage}
          className="w-12 h-12 rounded-full border border-border bg-background shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Message us"
        >
          <MessageCircle size={20} className="text-foreground" />
        </button>
      )}
      <button
        data-cart-target
        onClick={() => setIsCartOpen(true)}
        className="relative w-12 h-12 rounded-full border border-border bg-background shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
        aria-label="Open cart"
      >
        <ShoppingBag size={20} className="text-foreground" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingActions;
