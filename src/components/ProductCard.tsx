import { useState, useRef, useEffect } from 'react';
import { Heart, Maximize2, Scale, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';
import { flyToCart } from '@/lib/flyToCart';
import { productPath } from '@/lib/productUrl';


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
  const stock = (product as any).stock as number | undefined;

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

  const stopAndGo = (e: React.MouseEvent) => {
    // wishlist target — keep default link nav blocked
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="group animate-fade-in bg-white rounded-none border border-border/60 flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="block">
        <div
          ref={imageRef}
          className="relative overflow-hidden aspect-square bg-white"
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
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out ${
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
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Discount square badge top-left */}
          {isSoldOut ? (
            <span className="absolute top-0 left-0 text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 text-destructive-foreground bg-destructive rounded-none">
              Sold Out
            </span>
          ) : discountPercent ? (
            <span className="absolute top-0 left-0 min-w-[42px] h-[26px] px-2 rounded-none bg-destructive text-destructive-foreground flex items-center justify-center text-[12px] font-semibold">
              {discountPercent}%
            </span>
          ) : null}

          {/* Right icon stack */}
          <div className="absolute top-0 right-0 flex flex-col gap-2">
            <button
              onClick={handleWishlist}
              aria-label="Wishlist"
              className={`w-8 h-8 rounded-full bg-white border border-border/70 flex items-center justify-center transition ${
                isInWishlist(product.id) ? 'text-destructive' : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Heart size={14} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
            <span
              aria-hidden
              className="w-8 h-8 rounded-full bg-white border border-border/70 flex items-center justify-center text-foreground/60"
            >
              <Maximize2 size={13} />
            </span>
            <span
              aria-hidden
              className="w-8 h-8 rounded-full bg-white border border-border/70 flex items-center justify-center text-foreground/60"
            >
              <Scale size={13} />
            </span>
          </div>

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
      <div className="p-3 flex flex-col flex-1">
        {!isSoldOut && typeof stock === 'number' && stock > 0 && (
          <p className="text-[12px] font-semibold text-accent-foreground mb-1">
            {stock} in stock
          </p>
        )}

        <Link to={`/product/${product.id}`}>
          <h3 className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.6em]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-1.5">
          {product.original_price && (
            <span className="text-[12px] text-muted-foreground line-through">{product.original_price.toLocaleString()}.00৳</span>
          )}
          <span className="text-[15px] font-bold" style={{ color: 'hsl(var(--price-sale))' }}>{product.price.toLocaleString()}.00৳</span>
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

        {/* Full-width Add to cart - accent mint */}
        <button
          onClick={isSoldOut ? handleWishlist : handleOpenSizes}
          disabled={isSoldOut && isInWishlist(product.id)}
          className={`mt-3 w-full py-2.5 rounded-none text-[14px] font-semibold transition ${
            isSoldOut
              ? 'bg-foreground/60 hover:bg-foreground/70 text-background'
              : 'bg-accent text-accent-foreground hover:bg-accent/80 border border-accent-foreground/10'
          }`}
        >
          {isSoldOut ? (isInWishlist(product.id) ? 'In Wishlist' : 'Add to Wishlist') : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
