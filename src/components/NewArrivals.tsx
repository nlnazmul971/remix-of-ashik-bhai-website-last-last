import { Link } from 'react-router-dom';
import { ChevronRight, Star, ShoppingCart } from 'lucide-react';
import { useProducts } from '@/hooks/useSupabase';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const NewArrivals = () => {
  const { data: dbProducts = [] } = useProducts();
  const source = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  const products = source.slice(0, 6);
  const { addItem } = useCart();

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-background py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-card rounded-2xl border border-border/60 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-border mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">New Arrival</h2>
            <Link
              to="/?category=All"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-[hsl(var(--announce))] transition"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {products.map((p, idx) => {
              const hasDiscount = p.original_price && p.original_price > p.price;
              const discountPct = hasDiscount
                ? Math.round(((p.original_price! - p.price) / p.original_price!) * 100)
                : 0;
              const badgeLabel = idx % 2 === 0 ? 'NEW' : 'BESTSELLER';
              const rating = 4.5;
              return (
                <div
                  key={p.id}
                  className="group relative bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-sky-100 text-sky-800 text-[9px] sm:text-[10px] font-bold tracking-wide px-2 py-0.5 rounded">
                    {badgeLabel}
                  </div>

                  {/* Image */}
                  <Link to={`/product/${p.id}`} className="block relative aspect-square bg-white overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Content */}
                  <div className="px-2.5 pb-2.5 pt-2 flex-1 flex flex-col">
                    {/* Brand */}
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-none">
                      {(p as any).brand || 'Brand'}
                    </p>

                    {/* Title */}
                    <Link to={`/product/${p.id}`} className="block mt-1">
                      <h3 className="text-[11px] sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4em]">
                        {p.name}
                      </h3>
                    </Link>

                    {/* Price row */}
                    <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm sm:text-lg font-extrabold text-teal-600">
                        ৳{p.price}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                            ৳{p.original_price}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-green-600">
                            {discountPct}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star
                            key={i}
                            size={10}
                            className={
                              i < Math.floor(rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-gray-400">({rating}/5)</span>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => {
                        try {
                          addItem(p as any, (p.sizes || ['M'])[0], (p.colors?.[0] as any)?.name || '', 1);
                          toast.success('Added to cart');
                        } catch {
                          toast.error('Could not add');
                        }
                      }}
                      className="mt-2 w-full bg-[#ff6a3d] hover:bg-[#e85a2f] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide py-1.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 group/btn"
                    >
                      <span>Add to Cart</span>
                      <ShoppingCart
                        size={12}
                        className="opacity-0 -ml-3 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-200"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
