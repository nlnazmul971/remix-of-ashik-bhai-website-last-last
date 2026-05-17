import { useState, useRef, useEffect } from 'react';
import { Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';
import { flyToCart } from '@/lib/flyToCart';

interface ProductCardProps {
  product: Product;
  reviewStats?: Record<string, { avg: number; count: number }>;
  hoverImageUrl?: string | null;
  isSoldOut?: boolean;
  priority?: boolean;
}

const ProductCard = ({ product, reviewStats = {}, hoverImageUrl, isSoldOut = false, priority = false }: ProductCardProps) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [showSizes, setShowSizes] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const hoverImage = hoverImageUrl ?? null;

  useEffect(() => {
    if (!showSizes) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowSizes(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSizes]);

  const handleOpenSizes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizes(true);
  };

  const handleSelectSize = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, size, product.colors[0].name);
    flyToCart(imageRef.current, getProductImage(product.image_url, 400));
    setShowSizes(false);
    toast.success(`${product.name} (${size}) added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  return (
    <div className="group animate-fade-in bg-background flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="block">
        <div
          ref={imageRef}
          className="relative overflow-hidden aspect-square bg-muted"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={getProductImage(product.image_url, 600)}
            srcSet={`${getProductImage(product.image_url, 400)} 400w, ${getProductImage(product.image_url, 600)} 600w, ${getProductImage(product.image_url, 800)} 800w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            width={600}
            height={600}
            className={`absolute inset-0 w-full h-full object-contain p-3 transition-all duration-500 ease-in-out ${
              isHovered && hoverImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto' as any}
            decoding="async"
          />
          {hoverImage && isHovered && (
            <img
              src={getProductImage(hoverImage, 600)}
              alt={`${product.name} alternate`}
              width={600}
              height={600}
              className="absolute inset-0 w-full h-full object-contain p-3 transition-all duration-500"
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Discount circle badge top-left */}
          {isSoldOut ? (
            <span className="absolute top-2 left-2 text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 text-destructive-foreground bg-destructive rounded">
              Sold Out
            </span>
          ) : discountPercent ? (
            <span className="absolute top-2 left-2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-destructive text-white flex items-center justify-center text-[12px] sm:text-[13px] font-bold shadow-md">
              {discountPercent}%
            </span>
          ) : null}

          {/* Wishlist top-right always visible */}
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition ${
              isInWishlist(product.id) ? 'text-destructive' : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            <Heart size={16} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
          </button>

          {/* Size selector popup */}
          {showSizes && (
            <div
              ref={popupRef}
              className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur-xl p-3 animate-scale-in z-10"
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 text-center">
                Select Size
              </p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={(e) => handleSelectSize(e, size)}
                    className="min-w-[36px] h-9 px-2 border border-border text-xs hover:bg-primary hover:text-primary-foreground transition-colors bg-background rounded"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="px-3 pt-3 pb-3 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-[13px] sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5em]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-1.5">
          {product.original_price && (
            <span className="text-[12px] text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
          )}
          <span className="text-[15px] font-bold text-destructive">৳{product.price.toLocaleString()}</span>
        </div>

        {reviewStats[product.id] && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={10}
                  className={star <= Math.round(reviewStats[product.id].avg) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/20'}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({reviewStats[product.id].avg.toFixed(1)})</span>
          </div>
        )}

        {/* Full-width green Add to cart */}
        <button
          onClick={isSoldOut ? handleWishlist : handleOpenSizes}
          disabled={isSoldOut && isInWishlist(product.id)}
          className={`mt-3 w-full py-2.5 rounded-md text-[13px] font-semibold tracking-wide text-white transition ${
            isSoldOut
              ? 'bg-foreground/60 hover:bg-foreground/70'
              : 'bg-[hsl(142,72%,29%)] hover:bg-[hsl(142,72%,24%)]'
          }`}
        >
          {isSoldOut ? (isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist') : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
