import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

type Props = {
  product: any;
  badgeLabel?: string;
  badgeClass?: string;
};

const PrettyProductCard = ({ product: p, badgeLabel, badgeClass }: Props) => {
  const { addItem } = useCart();
  const hasDiscount = p.original_price && p.original_price > p.price;
  const discountPct = hasDiscount
    ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-none ring-1 ring-gray-100 hover:ring-sky-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative bg-white">
        {badgeLabel && (
          <span
            className={`absolute top-0 left-0 z-10 ${badgeClass || 'bg-sky-100 text-sky-700'} text-[9px] sm:text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-none uppercase`}
          >
            {badgeLabel}
          </span>
        )}

        <button
          aria-label="Wishlist"
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition"
        >
          <Heart size={14} />
        </button>

        <Link to={`/product/${p.id}`} className="block aspect-square overflow-hidden">
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
      </div>


      <div className="p-2 sm:p-3 flex-1 flex flex-col">
        <Link to={`/product/${p.id}`}>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-sky-700 transition">
            {p.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base sm:text-xl font-extrabold text-sky-600">৳{p.price}</span>
          {hasDiscount && (
            <>
              <span className="text-[11px] sm:text-xs text-gray-400 line-through">৳{p.original_price}</span>
              <span className="text-[10px] sm:text-xs font-extrabold text-green-600">{discountPct}% OFF</span>
            </>
          )}
        </div>

        <button
          onClick={() => {
            try {
              addItem(p, (p.sizes || ['M'])[0], (p.colors?.[0]?.name) || '', 1);
              toast.success('Added to cart');
            } catch {
              toast.error('Could not add');
            }
          }}
          className="mt-1.5 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wide py-1 sm:py-1.5 rounded-md shadow-sm hover:shadow-md transition flex items-center justify-center gap-1.5"
        >
          <ShoppingCart size={14} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default PrettyProductCard;
