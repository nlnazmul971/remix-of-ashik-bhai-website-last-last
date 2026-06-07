import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { productPath } from '@/lib/productUrl';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  reviewStats?: Record<string, { avg: number; count: number }>;
  hoverImageUrl?: string | null;
  isSoldOut?: boolean;
  priority?: boolean;
  badgeLabel?: string;
}

const ProductCard = ({ product, isSoldOut = false, priority = false, badgeLabel }: ProductCardProps) => {
  const { addItem } = useCart();
  const { addItem: addWishlist, isInWishlist, removeItem: removeWishlist } = (() => {
    try { return useWishlist(); } catch { return { addItem: (_: any) => {}, isInWishlist: (_: string) => false, removeItem: (_: string) => {} } as any; }
  })();

  const high = Math.max(product.price || 0, product.original_price || 0);
  const low = Math.min(product.price || 0, product.original_price || product.price || 0);
  const hasDiscount = !!product.original_price && high > low;
  const discountPct = hasDiscount ? Math.round(((high - low) / high) * 100) : 0;
  const wished = isInWishlist?.(product.id);

  const label = badgeLabel || ((product as any).is_new_arrival ? 'NEW' : (product as any).is_trending ? 'TRENDING' : 'NEW');

  return (
    <div className="group relative bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-sky-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative bg-gradient-to-br from-sky-50 via-white to-sky-50/40">
        {isSoldOut ? (
          <span className="absolute top-2.5 left-2.5 z-10 bg-foreground text-white text-[9px] sm:text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md uppercase">
            Sold Out
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 z-10 bg-sky-100 text-sky-700 text-[9px] sm:text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md uppercase">
            {label}
          </span>
        )}

        <button
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            try {
              if (wished) { removeWishlist(product.id); toast.success('Removed from wishlist'); }
              else { addWishlist(product); toast.success('Added to wishlist'); }
            } catch {}
          }}
          className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center transition ${wished ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
        >
          <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
        </button>

        <Link to={productPath(product)} className="block aspect-square overflow-hidden">
          <img
            src={getProductImage(product.image_url, 600)}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
      </div>

      <div className="p-2 sm:p-3 flex-1 flex flex-col">
        <Link to={productPath(product)}>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-sky-700 transition">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base sm:text-xl font-extrabold text-sky-600">৳{low.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-[11px] sm:text-xs text-gray-400 line-through">৳{high.toLocaleString()}</span>
              <span className="text-[10px] sm:text-xs font-extrabold text-green-600">{discountPct}% OFF</span>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            try {
              addItem(product as any, (product.sizes || ['M'])[0], (product.colors?.[0] as any)?.name || '', 1);
              toast.success('Added to cart');
            } catch { toast.error('Could not add'); }
          }}
          disabled={isSoldOut}
          className="mt-1.5 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs sm:text-sm font-bold uppercase tracking-wide py-1.5 sm:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={14} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
