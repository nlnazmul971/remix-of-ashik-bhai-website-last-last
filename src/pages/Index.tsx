import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Grid2x2, Grid3x3, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import VideoCarousel from '@/components/VideoCarousel';
import BabyKidsFashion from '@/components/BabyKidsFashion';
import ExploreCategories from '@/components/ExploreCategories';
import PromoPosters from '@/components/PromoPosters';
import NewArrivals from '@/components/NewArrivals';
import TrendingProducts from '@/components/TrendingProducts';
import ProductCard from '@/components/ProductCard';
import PrettyProductCard from '@/components/PrettyProductCard';
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
import { MOCK_PRODUCTS, MOCK_POSTERS, MOCK_CATEGORY_BANNERS } from '@/data/mockData';

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
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name-asc'>('featured');
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;
  const activeCategory = searchParams.get('category') || '';
  const activeSub = searchParams.get('sub') || '';
  const searchQuery = searchParams.get('search') || '';
  const { data: dbProducts = [], isLoading } = useProducts(
    activeCategory || undefined,
    searchQuery || undefined,
    activeSub || undefined
  );
  const { data: dbAllProducts = [] } = useProducts();
  // MOCK fallback — remove `MOCK_PRODUCTS` filtering once DB has data
  const allProducts = dbAllProducts.length > 0 ? dbAllProducts : MOCK_PRODUCTS;
  const products = dbProducts.length > 0
    ? dbProducts
    : MOCK_PRODUCTS.filter(p => {
        if (activeCategory && activeCategory !== 'All' && activeCategory !== 'New Dropped' && p.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
        if (activeCategory === 'New Dropped' && !p.is_new_drop) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
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

  // Apply size + price filters + sort client-side
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
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
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name-asc': sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'newest': sorted.sort((a, b) => {
        const ad = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        const bd = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        return bd - ad;
      }); break;
    }
    return sorted;
  }, [products, selectedSizes, selectedPriceIdx, sortBy]);

  // Reset to page 1 when filters / category / search / sort changes
  useEffect(() => { setPage(1); }, [activeCategory, activeSub, searchQuery, selectedSizes, selectedPriceIdx, sortBy]);

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

  // Dynamic posters from settings (MOCK fallback when empty)
  const rawPosters = settings['homepage_posters'];
  const parsedPosters = rawPosters ? JSON.parse(rawPosters) : [];
  const posters = parsedPosters.length > 0 ? parsedPosters : MOCK_POSTERS;

  // Category banners (3 horizontal banners section) — MOCK fallback when empty
  const rawCategoryBanners = settings['homepage_category_banners'];
  const parsedBanners: { image: string; label: string; link: string; productIds?: string[]; subItems?: { image: string; label: string; link: string }[] }[] = rawCategoryBanners ? JSON.parse(rawCategoryBanners) : [];
  const categoryBanners = parsedBanners.length > 0 ? parsedBanners : MOCK_CATEGORY_BANNERS;

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
      {!showProducts && <VideoCarousel />}
      {!showProducts && <BabyKidsFashion />}
      {!showProducts && <PromoPosters />}
      {!showProducts && <NewArrivals />}
      {!showProducts && <ExploreCategories />}
      {!showProducts && <TrendingProducts />}

      <main className={`max-w-full mx-auto px-4 sm:px-6 lg:px-8 ${showProducts ? 'pt-20 sm:pt-32' : 'pt-2 sm:pt-6'}`}>
        {(searchQuery || (activeCategory && activeCategory !== 'All') || activeSub) && (
          <div className="text-center mb-6 sm:mb-8">
            <h2
              key={searchQuery || activeCategory || 'all'}
              className="luxury-heading tracking-[0.15em] animate-fade-in text-xl sm:text-2xl"
            >
              {searchQuery
                ? `Search: "${searchQuery}"`
                : activeSub
                ? activeSub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : activeCategory}
            </h2>
            <div className="w-12 h-px bg-foreground mx-auto mt-2 sm:mt-4 animate-fade-in" />
          </div>
        )}
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

          const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
          const safePage = Math.min(page, totalPages);
          const pagedProducts = showProducts
            ? filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
            : homeProducts;
          const plpGridClass = gridCols === 3
            ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6';

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
            <div className={showProducts ? plpGridClass : `grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 lg:grid-cols-4`}>
              {pagedProducts.map((product, idx) => <ProductCard key={product.id} product={product} reviewStats={reviewStats} hoverImageUrl={hoverImageMap[product.id]} isSoldOut={soldOutMap[product.id] || false} priority={idx < 4} />)}
            </div>
          );

          if (!showProducts) {
            return null;
          }

          // Breadcrumb label
          const crumbLabel = searchQuery
            ? `Search: "${searchQuery}"`
            : activeSub
            ? activeSub.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : activeCategory && activeCategory !== 'All'
            ? activeCategory
            : 'All Products';

          return (
            <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block">
                <h3 className="text-[12px] tracking-[0.2em] uppercase mb-6 pb-3 border-b">Filters{activeFilterCount > 0 && <span className="ml-2 text-muted-foreground">({activeFilterCount})</span>}</h3>
                {filterPanel}
              </aside>

              <div>
                {/* Breadcrumb */}
                <nav className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mb-4 tracking-wider uppercase">
                  <Link to="/" className="hover:text-foreground transition">Home</Link>
                  <ChevronRight size={12} />
                  <span className="text-foreground">{crumbLabel}</span>
                </nav>

                {/* PLP toolbar */}
                <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-xs uppercase tracking-wider rounded-none">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="name-asc">Name: A–Z</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs sm:text-sm text-muted-foreground tracking-wider">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </span>
                  </div>

                  {/* Density switcher (desktop only) */}
                  <div className="hidden lg:flex items-center border border-border">
                    <button
                      onClick={() => setGridCols(3)}
                      aria-label="3 columns"
                      className={`p-2 transition ${gridCols === 3 ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                    >
                      <Grid2x2 size={14} />
                    </button>
                    <button
                      onClick={() => setGridCols(4)}
                      aria-label="4 columns"
                      className={`p-2 transition ${gridCols === 4 ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                    >
                      <Grid3x3 size={14} />
                    </button>
                  </div>
                </div>

                {productsGrid}

                {/* Pagination */}
                {filteredProducts.length > PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-2 mt-10 sm:mt-14">
                    <button
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={safePage === 1}
                      className="px-4 py-2 text-[11px] tracking-[0.2em] uppercase border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                      .map((n, i, arr) => (
                        <span key={n} className="flex items-center">
                          {i > 0 && arr[i - 1] !== n - 1 && <span className="px-2 text-muted-foreground">…</span>}
                          <button
                            onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`min-w-9 h-9 px-3 text-xs border transition ${
                              n === safePage
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            {n}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={safePage === totalPages}
                      className="px-4 py-2 text-[11px] tracking-[0.2em] uppercase border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Category Banners (3 horizontal banners) — each with 2 rows of products */}
        {!showProducts && categoryBanners.length > 0 && (
          <section className="mt-4 sm:mt-8 space-y-6 sm:space-y-8">
            {categoryBanners.slice(0, 3).map((b: any, i) => {
              // If admin picked specific products, use them; else auto-pull from link category
              let catProducts: typeof allProducts = [];
              if (b.productIds && b.productIds.length > 0) {
                const idSet = new Set(b.productIds);
                catProducts = allProducts.filter(p => idSet.has(p.id)).slice(0, 8);
              } else {
                let catName = '';
                try {
                  const url = new URL(b.link || '/', 'http://x');
                  catName = url.searchParams.get('category') || '';
                } catch { /* noop */ }
                catProducts = catName
                  ? allProducts.filter(p => p.category?.toLowerCase() === catName.toLowerCase()).slice(0, 8)
                  : [];
              }

              return (
                <div key={i} className="space-y-2 sm:space-y-3">
                  <Link
                    to={b.link || '/'}
                    className="relative block overflow-hidden group aspect-[16/6] sm:aspect-[16/5] rounded-lg"
                  >
                    <img
                      src={b.image}
                      alt={b.label}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
                      <h3 className="text-foreground text-xl sm:text-3xl lg:text-4xl tracking-[0.2em] uppercase font-bold drop-shadow-sm text-center px-4">
                        {b.label}
                      </h3>
                      <span className="inline-flex items-center gap-2 px-5 py-2 sm:px-7 sm:py-2.5 bg-[hsl(var(--announce))] text-background text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold rounded-sm shadow-md group-hover:scale-105 transition">
                        Shop Now
                      </span>
                    </div>
                  </Link>

                  {b.subItems && b.subItems.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 sm:gap-6">
                      {b.subItems.map((s, si) => (
                        <Link key={si} to={s.link || '/'} className="group flex flex-col items-center text-center">
                          <div className="w-full aspect-square rounded-xl border border-border bg-card overflow-hidden p-2 sm:p-3 transition-transform group-hover:scale-[1.03]">
                            <img src={s.image} alt={s.label} className="w-full h-full object-contain" loading="lazy" />
                          </div>
                          <h4 className="mt-1 sm:mt-2 text-[11px] sm:text-sm font-semibold uppercase tracking-wide text-foreground leading-tight">
                            {s.label}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  )}

                  {catProducts.length > 0 && (
                    <>
                      <div className="flex items-center justify-between pt-1">
                        <h4 className="text-sm sm:text-base font-semibold tracking-wide uppercase">{b.label}</h4>
                        <Link to={b.link || '/'} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          View all <ChevronRight size={14} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {catProducts.slice(0, 5).map((product) => (
                          <PrettyProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        )}


        {/* Fancy Posters */}
        {!showProducts && (
          <section className="mt-6 sm:mt-10">
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

      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
