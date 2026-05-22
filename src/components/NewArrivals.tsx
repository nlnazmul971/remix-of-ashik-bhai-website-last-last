import { Link } from 'react-router-dom';
import { ChevronRight, Star, ShoppingCart, Heart } from 'lucide-react';
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
    <section className="w-full bg-gradient-to-b from-sky-50/40 to-background py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-6 px-1">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
              Just In
            </p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/?category=All"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 transition"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {products.map((p, idx) => {
            const hasDiscount = p.original_price && p.original_price > p.price;
            const discountPct = hasDiscount
              ? Math.round(((p.original_price! - p.price) / p.original_price!) * 100)
              : 0;
            const badgeLabel = idx % 2 === 0 ? 'NEW' : 'BESTSELLER';
            const badgeClass =
              idx % 2 === 0
                ? 'bg-sky-100 text-sky-700'
                : 'bg-amber-100 text-amber-800';
            const rating = 4.5;
            return (
              <div
                key={p.id}
                className="group relative bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-teal-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Image area with soft tinted bg */}
                <div className="relative bg-gradient-to-br from-sky-50 via-white to-rose-50/40">
                  {/* Badge */}
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 ${badgeClass} text-[9px] sm:text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md uppercase`}
                  >
                    {badgeLabel}
                  </span>

                  {/* Wishlist */}
                  <button
                    aria-label="Wishlist"
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition"
                  >
                    <Heart size={14} />
                  </button>

                  <Link
                    to={`/product/${p.id}`}
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

                {/* Body */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  {/* Brand */}
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    {(p as any).brand || 'Brand'}
                  </p>

                  {/* Title */}
                  <Link to={`/product/${p.id}`}>
                    <h3 className="mt-0.5 text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4em] hover:text-teal-700 transition">
                      {p.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
                      <Star size={10} className="fill-green-600 text-green-600" />
                      <span className="text-[10px] font-bold text-green-700">
                        {rating}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">(120 reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base sm:text-xl font-extrabold text-teal-600">
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

                  {/* CTA */}
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
                    className="mt-3 w-full bg-[#ff6a3d] hover:bg-[#e85a2f] text-white text-xs sm:text-sm font-bold uppercase tracking-wide py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
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

export default NewArrivals;
