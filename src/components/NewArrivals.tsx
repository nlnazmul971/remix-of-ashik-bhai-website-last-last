import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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

  const formatPrice = (n: number) => {
    const [intPart, decPart] = n.toFixed(2).split('.');
    return { intPart, decPart };
  };

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
            {products.map((p) => {
              const hasDiscount = p.original_price && p.original_price > p.price;
              const discountPct = hasDiscount
                ? Math.round(((p.original_price! - p.price) / p.original_price!) * 100)
                : 0;
              const { intPart, decPart } = formatPrice(p.price);
              return (
                <div
                  key={p.id}
                  className="relative bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
                >
                  {hasDiscount && (
                    <div className="absolute top-0 left-0 z-10 bg-[#1ea672] text-white text-[10px] sm:text-xs font-bold px-1.5 py-1 rounded-br-xl leading-tight text-center min-w-[34px]">
                      {discountPct}%<br />OFF
                    </div>
                  )}

                  <Link to={`/product/${p.id}`} className="block relative aspect-square bg-white overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-3 hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="px-2 pb-2 pt-1 flex-1 flex flex-col">
                    <Link to={`/product/${p.id}`} className="block">
                      <h3 className="text-[11px] sm:text-sm font-medium text-gray-800 leading-snug line-clamp-1">
                        {p.name}
                      </h3>
                    </Link>

                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[13px] sm:text-base font-bold text-gray-900">
                        ৳{intPart}
                        <sup className="text-[9px] sm:text-[10px] font-bold">{decPart}</sup>
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">৳{p.original_price}</span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        try {
                          addItem(p as any, (p.sizes || ['M'])[0], (p.colors?.[0] as any)?.name || '', 1);
                          toast.success('Added to cart');
                        } catch {
                          toast.error('Could not add');
                        }
                      }}
                      className="mt-2 w-full border border-[#ff6a3d] text-[#ff6a3d] text-[10px] sm:text-xs font-bold uppercase tracking-wide py-1.5 rounded-full hover:bg-[#ff6a3d] hover:text-white transition"
                    >
                      Add to Cart
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
