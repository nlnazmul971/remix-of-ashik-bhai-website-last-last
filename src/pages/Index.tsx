import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SEO from '@/components/SEO';
import { Checkbox } from '@/components/ui/checkbox';
import { categories } from '@/data/products';
import { useProducts, useStoreSettings, useAllReviewStats, useAllProductImages, useAllSizeStock } from '@/hooks/useSupabase';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Under TK 999', min: 0, max: 999 },
  { label: 'TK 999 - TK 1,499', min: 999, max: 1499 },
  { label: 'TK 1,499 - TK 1,999', min: 1499, max: 1999 },
  { label: 'TK 1,999 - TK 2,999', min: 1999, max: 2999 },
  { label: 'TK 2,999+', min: 2999, max: Infinity },
];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number[]>([]);
  const activeCategory = searchParams.get('category') || '';
  const activeSub = searchParams.get('sub') || '';
  const searchQuery = searchParams.get('search') || '';
  const { data: products = [], isLoading } = useProducts(
    activeCategory || undefined,
    searchQuery || undefined,
    activeSub || undefined
  );
  const { data: allProducts = [] } = useProducts();
  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories-filter', activeCategory],
    queryFn: async () => {
      if (!activeCategory || activeCategory === 'All') return [];
      const { data } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .eq('parent_category', activeCategory)
        .order('sort_order');
      return (data as Array<{ id: string; name: string; slug: string; parent_category: string }>) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const { data: settings = {} } = useStoreSettings();
  const { data: reviewStats = {} } = useAllReviewStats();
  const { data: allProductImages = [] } = useAllProductImages();
  const { data: allSizeStock = [] } = useAllSizeStock();
  const { viewedIds } = useRecentlyViewed();

  // Build sold-out map: product_id -> boolean (all sizes have 0 available)
  const soldOutMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const grouped: Record<string, { available: number }[]> = {};
    for (const s of allSizeStock) {
      if (!grouped[s.product_id]) grouped[s.product_id] = [];
      grouped[s.product_id].push({ available: s.total_stock - s.sold_count + s.cancelled_count + s.returned_count });
    }
    for (const [pid, stocks] of Object.entries(grouped)) {
      const totalAvailable = stocks.reduce((sum, s) => sum + s.available, 0);
      map[pid] = totalAvailable <= 0;
    }
    return map;
  }, [allSizeStock]);

  const showProducts = activeCategory || searchQuery || activeSub;

  // Apply size + price filters client-side
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedSizes.length > 0) {
        const sizes = (p.sizes || []).map(s => s.toUpperCase());
        if (!selectedSizes.some(s => sizes.includes(s))) return false;
      }
      if (selectedPriceIdx.length > 0) {
        const ok = selectedPriceIdx.some(i => {
          const r = PRICE_RANGES[i];
          return p.price >= r.min && p.price <= r.max;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [products, selectedSizes, selectedPriceIdx]);

  const activeFilterCount = selectedSizes.length + selectedPriceIdx.length;
  const toggleSize = (s: string) =>
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const togglePrice = (i: number) =>
    setSelectedPriceIdx(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const clearFilters = () => { setSelectedSizes([]); setSelectedPriceIdx([]); };

  const recentProducts = viewedIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 4);

  // Build hover image map: product_id -> second image url
  const hoverImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    // Group by product_id, sorted by sort_order, pick second image
    const grouped: Record<string, { sort_order: number; image_url: string }[]> = {};
    for (const img of allProductImages) {
      if (!grouped[img.product_id]) grouped[img.product_id] = [];
      grouped[img.product_id].push(img);
    }
    for (const [pid, imgs] of Object.entries(grouped)) {
      const sorted = imgs.sort((a, b) => a.sort_order - b.sort_order);
      if (sorted.length > 0) map[pid] = sorted[0].image_url;
    }
    return map;
  }, [allProductImages]);

  // Dynamic posters from settings
  const rawPosters = settings['homepage_posters'];
  const posters = rawPosters ? JSON.parse(rawPosters) : [];

  // Category banners (3 horizontal banners section)
  const rawCategoryBanners = settings['homepage_category_banners'];
  const categoryBanners: { image: string; label: string; link: string }[] = rawCategoryBanners ? JSON.parse(rawCategoryBanners) : [];

  // NEW DROPS — products marked as "New Drop" in admin
  const newDrops = useMemo(
    () => allProducts.filter(p => (p as any).is_new_drop).slice(0, 8),
    [allProducts]
  );

  // Limit homepage grid to 12 products (3 rows x 4 cols on desktop) when no filter active
  const HOME_GRID_LIMIT = 12;
  const homeProducts = !showProducts ? filteredProducts.slice(0, HOME_GRID_LIMIT) : filteredProducts;
  const hasMoreHome = !showProducts && filteredProducts.length > HOME_GRID_LIMIT;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="HIGHLIGHTS"
        description="HIGHLIGHTS (highlightsbd) — Bangladeshi unisex clothing brand. Shop shirts, t-shirts, pants & everyday wear with cash on delivery across Bangladesh."
        path="/"
      />
      <Header />
      <CartDrawer />
      {!showProducts && <Hero />}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${showProducts ? 'pt-28 sm:pt-40' : 'pt-10 sm:pt-32'}`}>
        <div className="text-center mb-2 sm:mb-8">
          <h2
            key={searchQuery || activeCategory || 'all'}
            className={`luxury-heading tracking-[0.15em] animate-fade-in ${
              searchQuery || (activeCategory && activeCategory !== 'All')
                ? 'text-3xl sm:text-4xl'
                : 'text-2xl sm:text-4xl'
            }`}
          >
            {searchQuery
              ? `Search: "${searchQuery}"`
              : activeSub
              ? activeSub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : activeCategory && activeCategory !== 'All'
              ? activeCategory
              : 'Our Collection'}
          </h2>
          <div className="w-12 h-px bg-foreground mx-auto mt-2 sm:mt-4 animate-fade-in" />
        </div>
        {(() => {
          const filterPanel = (
            <div className="space-y-8">
              {subcategories.length > 0 && (
                <div>
                  <h4 className="text-[11px] tracking-[0.2em] uppercase mb-3 pb-2 border-b">Subcategory</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSearchParams({ category: activeCategory })}
                      className={`block w-full text-left text-sm transition ${!activeSub ? 'font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      All
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSearchParams({ category: activeCategory, sub: sub.slug })}
                        className={`block w-full text-left text-sm transition ${activeSub === sub.slug ? 'font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-[11px] tracking-[0.2em] uppercase mb-3 pb-2 border-b">Size</h4>
                <div className="space-y-3">
                  {SIZE_OPTIONS.map(s => (
                    <label key={s} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={selectedSizes.includes(s)} onCheckedChange={() => toggleSize(s)} />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] tracking-[0.2em] uppercase mb-3 pb-2 border-b">Price (TK)</h4>
                <div className="space-y-3">
                  {PRICE_RANGES.map((r, i) => (
                    <label key={r.label} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={selectedPriceIdx.includes(i)} onCheckedChange={() => togglePrice(i)} />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full py-3 text-[11px] tracking-[0.2em] uppercase border border-border hover:bg-muted transition"
                >
                  Clear All
                </button>
              )}
            </div>
          );

          const productsGrid = isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/5] bg-muted" />
                  <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No products found.</p>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 ${showProducts ? '' : 'lg:grid-cols-4'}`}>
              {homeProducts.map((product, idx) => <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} isSoldOut={soldOutMap[product.id] || false} priority={idx < 4} />)}
            </div>
          );

          if (!showProducts) {
            return (
              <>
                {productsGrid}
                {hasMoreHome && (
                  <div className="flex justify-center mt-10 sm:mt-14">
                    <Link
                      to="/?category=All"
                      className="inline-flex items-center gap-2 px-8 py-3 border border-foreground text-[11px] tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition"
                    >
                      View All Products
                    </Link>
                  </div>
                )}
              </>
            );
          }

          return (
            <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block">
                <h3 className="text-[12px] tracking-[0.2em] uppercase mb-6 pb-3 border-b">Filters{activeFilterCount > 0 && <span className="ml-2 text-muted-foreground">({activeFilterCount})</span>}</h3>
                {filterPanel}
              </aside>

              <div>
                {/* Mobile/tablet filter trigger */}
                <div className="flex justify-start mb-4 sm:mb-6 lg:hidden">
                  <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 border border-border text-[11px] tracking-[0.15em] uppercase hover:bg-muted transition">
                        <SlidersHorizontal size={14} />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background text-[10px]">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] sm:w-[380px] flex flex-col p-0">
                      <SheetHeader className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle className="tracking-[0.2em] text-sm uppercase text-left">Filters</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        {filterPanel}
                      </div>
                      <div className="border-t p-4">
                        <button
                          onClick={() => setFilterOpen(false)}
                          className="w-full py-3 bg-foreground text-background text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition"
                        >
                          View Results ({filteredProducts.length})
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {productsGrid}
              </div>
            </div>
          );
        })()}

        {/* Category Banners (3 horizontal banners) */}
        {!showProducts && categoryBanners.length > 0 && (
          <section className="mt-16 sm:mt-24 space-y-4 sm:space-y-6">
            {categoryBanners.slice(0, 3).map((b, i) => (
              <Link
                key={i}
                to={b.link || '/'}
                className="relative block overflow-hidden group aspect-[16/6] sm:aspect-[16/5]"
              >
                <img
                  src={b.image}
                  alt={b.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/20 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center px-6 sm:px-12">
                  <h3 className="text-background text-sm sm:text-lg tracking-[0.4em] uppercase font-light drop-shadow-md">
                    {b.label}
                  </h3>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* NEW DROPS section */}
        {!showProducts && newDrops.length > 0 && (
          <section className="mt-20 sm:mt-28">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="luxury-heading text-2xl sm:text-3xl tracking-[0.2em]">NEW DROPS</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-3 sm:mt-4" />
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-3 tracking-wider uppercase">Just landed — fresh arrivals</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {newDrops.map((product, idx) => (
                <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} isSoldOut={soldOutMap[product.id] || false} priority={idx < 2} />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Link
                to="/?category=New Dropped"
                className="inline-flex items-center gap-2 px-8 py-3 border border-foreground text-[11px] tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition"
              >
                View All New Drops
              </Link>
            </div>
          </section>
        )}

        {/* Fancy Posters */}
        {!showProducts && (
          <section className="mt-20 sm:mt-28">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {posters.map((poster: any, i: number) => (
                <Link key={i} to={poster.link || '/'} className="relative group overflow-hidden cursor-pointer block">
                  <img src={poster.image} alt={poster.title} className="w-full h-auto block transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="luxury-body text-[10px] text-background/70 mb-2">{poster.subtitle}</p>
                    <h3 className="luxury-heading text-2xl sm:text-3xl text-background tracking-[0.1em]">{poster.title}</h3>
                    <div className="w-8 h-px bg-background/50 mt-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentProducts.length > 0 && (
          <section className="mt-20">
            <div className="text-center mb-10">
              <h2 className="luxury-heading text-2xl sm:text-3xl tracking-[0.15em]">Recently Viewed</h2>
              <div className="w-12 h-px bg-foreground mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentProducts.map(product => product && <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} isSoldOut={soldOutMap[product.id] || false} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
