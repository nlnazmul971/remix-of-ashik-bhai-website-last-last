import { Link } from 'react-router-dom';
import { Product, getProductImage } from '@/data/products';
import { productPath } from '@/lib/productUrl';

interface ProductCardProps {
  product: Product;
  reviewStats?: Record<string, { avg: number; count: number }>;
  hoverImageUrl?: string | null;
  isSoldOut?: boolean;
  priority?: boolean;
}

const ProductCard = ({ product, hoverImageUrl, isSoldOut = false, priority = false }: ProductCardProps) => {
  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const hoverImage = hoverImageUrl ?? null;

  return (
    <div className="group flex flex-col">
      <Link to={productPath(product)} className="block">
        <div className="relative overflow-hidden aspect-square bg-muted/30">
          <img
            src={getProductImage(product.image_url, 600)}
            srcSet={`${getProductImage(product.image_url, 400)} 400w, ${getProductImage(product.image_url, 600)} 600w, ${getProductImage(product.image_url, 800)} 800w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            width={600}
            height={600}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hoverImage ? 'group-hover:opacity-0' : ''}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : ('auto' as any)}
            decoding="async"
          />
          {hoverImage && (
            <img
              src={getProductImage(hoverImage, 600)}
              alt={`${product.name} alternate`}
              width={600}
              height={600}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Top-left badge */}
          {isSoldOut ? (
            <span className="absolute top-3 left-3 text-[10px] tracking-wider uppercase font-bold px-2.5 py-1 text-white bg-foreground rounded-full">
              Sold Out
            </span>
          ) : discountPercent ? (
            <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 text-white bg-foreground rounded-full">
              −{discountPercent}% OFF
            </span>
          ) : null}
        </div>
      </Link>

      {/* Info */}
      <div className="pt-3 pb-2">
        <Link to={productPath(product)}>
          <h3 className="text-[14px] sm:text-[15px] font-medium text-foreground leading-snug line-clamp-2 hover:text-muted-foreground transition">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-[15px] sm:text-[16px] font-bold text-foreground">
            ৳{product.price.toLocaleString()}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[13px] text-muted-foreground line-through">
              ৳{product.original_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
