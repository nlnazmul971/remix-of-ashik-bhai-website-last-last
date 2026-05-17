import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useProducts } from '@/hooks/useSupabase';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const TrendingProducts = () => {
  const { data: dbProducts = [] } = useProducts();
  const source = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  const products = source.slice(0, 12);
  const { addToCart } = useCart() as any;

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-background py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-border mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Trending Products</h2>
            <Link
              to="/?category=All"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-[hsl(var(--announce))] transition"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-1 px-1 pb-2 snap-x snap-mandatory scrollbar-hide">
            {products.map((p) => {
              const sku = (p as any).sku || p.id.slice(0, 8);
              const hasDiscount = p.original_price && p.original_price > p.price;
              return (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[160px] sm:w-auto snap-start bg-background rounded-xl border border-border/60 overflow-hidden flex flex-col"
                >
                  <Link to={`/product/${p.id}`} className="block relative aspect-square bg-muted overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                      {sku}
                    </span>
                  </Link>

                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                    <Link to={`/product/${p.id}`} className="block">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5em]">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-[10px] text-muted-foreground mt-1">{sku}</p>

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
                            addToCart?.({
                              id: p.id,
                              name: p.name,
                              price: p.price,
                              image: p.image_url,
                              size: (p.sizes || ['M'])[0],
                              color: (p.colors?.[0] as any)?.name || '',
                              quantity: 1,
                            });
                            toast.success('Added to cart');
                          } catch {
                            toast.error('Could not add');
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition"
                        aria-label="Add to cart"
                      >
                        <ShoppingBag size={14} />
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

export default TrendingProducts;
