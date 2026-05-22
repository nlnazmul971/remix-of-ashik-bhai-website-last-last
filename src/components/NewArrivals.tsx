import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useProducts } from '@/hooks/useSupabase';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const NewArrivals = () => {
  const { data: dbProducts = [] } = useProducts();
  const source = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  // Take newest 6 (assumes source ordered newest-first; fallback slice)
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

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {products.map((p) => {
              const sku = (p as any).sku || p.id.slice(0, 8);
              const hasDiscount = p.original_price && p.original_price > p.price;
              return (
                <div
                  key={p.id}
                  className="bg-background rounded-xl border border-border/60 overflow-hidden flex flex-col"
                >
                  <Link to={`/product/${p.id}`} className="block relative aspect-[3/4] bg-muted overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-2 sm:p-3 flex-1 flex flex-col">
                    <Link to={`/product/${p.id}`} className="block">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5em]">
                        {p.name}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground">৳{p.price}</span>
                        {hasDiscount && (
                          <span className="text-[10px] text-muted-foreground line-through">৳{p.original_price}</span>
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
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition"
                        aria-label="Add to cart"
                      >
                        <ShoppingBag size={13} />
                      </button>
                    </div>
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
