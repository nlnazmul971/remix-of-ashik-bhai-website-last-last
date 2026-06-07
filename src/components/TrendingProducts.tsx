import { Link } from 'react-router-dom';
import { productPath } from '@/lib/productUrl';
import { ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { useProducts, useStoreSettings } from '@/hooks/useSupabase';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const TrendingProducts = () => {
  const { data: dbProducts = [] } = useProducts();
  const { data: s = {} } = useStoreSettings();
  const enabled = s['trending_enabled'] !== 'false';
  const eyebrow = s['trending_eyebrow'] || 'Hot Picks';
  const title = s['trending_title'] || 'Trending Products';
  const viewAllLink = s['trending_view_all'] || '/?category=All';
  const limit = parseInt(s['trending_limit'] || '12', 10) || 12;
  let pickedIds: string[] = [];
  try { if (s['trending_product_ids']) pickedIds = JSON.parse(s['trending_product_ids']); } catch {}
  const source = dbProducts;
  const flagged = (source as any[]).filter(p => p.is_trending);
  const products = pickedIds.length > 0
    ? pickedIds.map(id => (source as any[]).find(p => p.id === id)).filter(Boolean)
    : (flagged.length > 0 ? flagged.slice(0, limit) : source.slice(0, limit));
  const { addItem } = useCart();

  if (!enabled || products.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-sky-50/40 to-background py-6 sm:py-10">
      <div className="max-w-full mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-6 px-1">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
              {eyebrow}
            </p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
              {title}
            </h2>
          </div>
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-800 transition"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-5 xl:gap-4">
          {products.map((p, idx) => {
            const hasDiscount = p.original_price && p.original_price > p.price;
            const discountPct = hasDiscount
              ? Math.round(((p.original_price! - p.price) / p.original_price!) * 100)
              : 0;
            const badgeLabel = idx % 2 === 0 ? 'TRENDING' : 'BESTSELLER';
            const badgeClass =
              idx % 2 === 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-800';
            return (
              <div
                key={p.id}
                className="group relative bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-sky-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative bg-gradient-to-br from-sky-50 via-white to-sky-50/40">
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 ${badgeClass} text-[9px] sm:text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md uppercase`}
                  >
                    {badgeLabel}
                  </span>

                  <button
                    aria-label="Wishlist"
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition"
                  >
                    <Heart size={14} />
                  </button>

                  <Link
                    to={productPath(p)}
                    className="block aspect-square overflow-hidden"
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                  </Link>
                </div>

                <div className="p-2 sm:p-3 flex-1 flex flex-col">
                  <Link to={productPath(p)}>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-sky-700 transition">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base sm:text-xl font-extrabold text-sky-600">
                      ৳{p.price}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                          ৳{p.original_price}
                        </span>
                        <span className="text-[10px] sm:text-xs font-extrabold text-green-600">
                          {discountPct}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      try {
                        addItem(
                          p as any,
                          (p.sizes || ['M'])[0],
                          (p.colors?.[0] as any)?.name || '',
                          1,
                        );
                        toast.success('Added to cart');
                      } catch {
                        toast.error('Could not add');
                      }
                    }}
                    className="mt-1.5 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs sm:text-sm font-bold uppercase tracking-wide py-1.5 sm:py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={14} />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
