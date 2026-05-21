import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Heart, Menu, X, MessageCircle, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, useStoreSettings } from '@/hooks/useSupabase';
import MobileBottomNav from '@/components/MobileBottomNav';
import SearchOverlay from '@/components/SearchOverlay';
import AnnouncementBar from '@/components/AnnouncementBar';
import TopBar from '@/components/TopBar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsCartOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.uid);
  const { data: settings = {} } = useStoreSettings();
  const cachedLogo = typeof window !== 'undefined' ? localStorage.getItem('cached_site_logo') : null;
  const siteLogo = settings['site_logo'] || cachedLogo || '/logo.png';
  useEffect(() => {
    if (settings['site_logo']) localStorage.setItem('cached_site_logo', settings['site_logo']);
  }, [settings['site_logo']]);
  const profilePath = role === 'admin' ? '/admin' : '/profile';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: navCategories = [] } = useQuery({
    queryKey: ['header-categories-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .from('header_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return (data as Array<{ id: string; name: string; slug: string }>) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return (data as Array<{ id: string; parent_category: string; name: string; slug: string }>) || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeMobileCategory = isMobile
    ? navCategories.find(cat => openDropdown === cat.slug)
    : undefined;
  const activeMobileSubs = activeMobileCategory
    ? subcategories.filter(s => s.parent_category === activeMobileCategory.slug)
    : [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background ${scrolled ? 'shadow-sm' : ''}`}>
        {!scrolled && <AnnouncementBar />}
        {!scrolled && <TopBar />}
        {/* Top bar - hidden on scroll for both mobile and desktop */}
        {!scrolled && (
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* MOBILE: Shop-for + icons row */}
              <div className="flex sm:hidden items-center justify-between h-14">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center gap-2"
                  aria-label="Shop for"
                >
                  <Link to="/" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <img src={siteLogo} alt="Logo" className="h-10 w-10 rounded-full object-cover border border-border" loading="eager" />
                  </Link>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                      Shop for <ChevronDown size={14} className="opacity-70" />
                    </span>
                    <span className="text-[11px] text-muted-foreground">All</span>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <Link to={profilePath} className="p-1 hover:opacity-60 transition-opacity">
                    <User size={22} />
                  </Link>
                  <Link to="/wishlist" className="p-1 hover:opacity-60 transition-opacity relative">
                    <Heart size={22} />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                  <button data-cart-target onClick={() => setIsCartOpen(true)} className="p-1 hover:opacity-60 transition-opacity relative">
                    <ShoppingBag size={22} />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* MOBILE: Search + pincode */}
              <div className="sm:hidden flex items-center gap-3 pb-2">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="flex items-center w-full bg-background border border-border rounded-full overflow-hidden pl-4 pr-1 py-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="flex-1 bg-transparent text-foreground text-sm py-1.5 outline-none placeholder:text-muted-foreground"
                    />
                    <button type="submit" className="w-9 h-9 rounded-full bg-[hsl(var(--announce))] text-white flex items-center justify-center shrink-0">
                      <Search size={16} />
                    </button>
                  </div>
                </form>
              </div>

              {/* DESKTOP: original top bar */}
              <div className="hidden sm:flex items-center gap-4 sm:gap-6 h-20">
                <Link to="/" className="shrink-0 flex items-center relative" aria-label="Home">
                  <img src={siteLogo} alt="Logo" className="h-12 w-auto object-contain relative z-10" loading="eager" fetchPriority={"high" as any} decoding="async" />
                </Link>
                <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl mx-auto">
                  <div className="flex items-center w-full bg-primary text-primary-foreground rounded-sm overflow-hidden">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products"
                      className="flex-1 bg-transparent placeholder:text-primary-foreground/70 text-primary-foreground text-sm px-4 py-2.5 outline-none"
                    />
                    <button type="submit" className="px-4 py-2.5 hover:bg-foreground/10 transition-colors">
                      <Search size={16} />
                    </button>
                  </div>
                </form>
                <div className="flex items-center gap-3 ml-auto sm:ml-0">
                  <Link to={profilePath} className="p-1.5 hover:opacity-60 transition-opacity">
                    <User size={20} />
                  </Link>
                  <Link to="/wishlist" className="p-1.5 hover:opacity-60 transition-opacity relative">
                    <Heart size={20} />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                  <button data-cart-target onClick={() => setIsCartOpen(true)} className="p-1.5 hover:opacity-60 transition-opacity relative">
                    <ShoppingBag size={20} />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Popular Searches */}
              <div className="hidden sm:flex items-center justify-center gap-3 pb-3 text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">Popular Searches:</span>
                {['Rompers', 'Bodysuits', 'T-shirt', 'Tank Top'].map((term) => (
                  <Link
                    key={term}
                    to={`/?search=${encodeURIComponent(term)}`}
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {term}
                  </Link>
                ))}
              </div>

              {/* MOBILE: circular category row with offer badges */}
              {navCategories.length > 0 && (
                <div className="sm:hidden -mx-4 px-4 pb-3">
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    {navCategories.slice(0, 8).map((cat, i) => {
                      const offers = ['UPTO 60% OFF', 'UPTO 80% OFF', 'FLAT 50% OFF', 'FLAT 28% OFF', 'EXTRA 10% OFF'];
                      const colors = [
                        'from-pink-200 to-pink-300',
                        'from-blue-200 to-blue-300',
                        'from-amber-200 to-amber-300',
                        'from-emerald-200 to-emerald-300',
                        'from-violet-200 to-violet-300',
                        'from-rose-200 to-rose-300',
                        'from-sky-200 to-sky-300',
                        'from-orange-200 to-orange-300',
                      ];
                      return (
                        <Link
                          key={cat.id}
                          to={`/?category=${encodeURIComponent(cat.slug)}`}
                          className="flex flex-col items-center shrink-0 w-[64px]"
                        >
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[i % colors.length]} border border-border flex items-center justify-center text-foreground/80 text-base font-semibold`}>
                              {cat.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[hsl(var(--announce))] text-white text-[7px] font-bold px-1.5 py-[2px] rounded-sm">
                              {offers[i % offers.length]}
                            </span>
                          </div>
                          <span className="mt-2.5 text-[10px] text-foreground text-center leading-tight line-clamp-2">
                            {cat.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search overlay */}
        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          query={searchQuery}
          setQuery={setSearchQuery}
          onSubmit={handleSearch}
        />

        {/* Category nav */}
        <nav className="border-b border-border" onMouseLeave={() => !isMobile && setOpenDropdown(null)}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-6 sm:gap-12 h-6 sm:h-10 overflow-x-auto sm:overflow-visible">
              {navCategories.map(cat => {
                const subs = subcategories.filter(s => s.parent_category === cat.slug);
                const hasSubs = subs.length > 0;
                const isOpen = openDropdown === cat.slug;
                const catPath = `/?category=${encodeURIComponent(cat.slug)}`;
                return (
                  <div
                    key={cat.id}
                    className="relative shrink-0"
                    onMouseEnter={() => !isMobile && hasSubs && setOpenDropdown(cat.slug)}
                  >
                    {hasSubs ? (
                      <button
                        onClick={() => setOpenDropdown(isOpen ? null : cat.slug)}
                        className={`luxury-body text-[11px] hover:text-foreground transition-colors flex items-center gap-1 ${isOpen ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {cat.name}
                        <ChevronDown size={10} className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <Link to={catPath} className="luxury-body text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                        {cat.name}
                      </Link>
                    )}
                    {hasSubs && isOpen && !isMobile && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-background border border-border px-3 py-2 flex flex-col gap-1.5 z-50 animate-fade-in">
                        <Link
                          to={catPath}
                          onClick={() => setOpenDropdown(null)}
                          className="text-[11px] text-foreground font-medium hover:opacity-70 transition-opacity whitespace-nowrap text-center pb-1 border-b border-border"
                        >
                          All {cat.name}
                        </Link>
                        {subs.map(s => (
                          <Link
                            key={s.id}
                            to={`/?category=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(s.slug)}`}
                            onClick={() => setOpenDropdown(null)}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap text-center"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {activeMobileCategory && activeMobileSubs.length > 0 && (
              <div className="sm:hidden -mx-4 border-t border-border bg-background px-4 py-2 animate-fade-in">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Link
                    to={`/?category=${encodeURIComponent(activeMobileCategory.slug)}`}
                    onClick={() => setOpenDropdown(null)}
                    className="shrink-0 border border-border px-3 py-2 text-[10px] tracking-[0.15em] uppercase text-foreground"
                  >
                    All {activeMobileCategory.name}
                  </Link>
                  {activeMobileSubs.map(s => (
                    <Link
                      key={s.id}
                      to={`/?category=${encodeURIComponent(activeMobileCategory.slug)}&sub=${encodeURIComponent(s.slug)}`}
                      onClick={() => setOpenDropdown(null)}
                      className="shrink-0 bg-secondary px-3 py-2 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu - all categories */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block luxury-body text-[11px] py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                All
              </Link>
              {navCategories.map(cat => {
                const subs = subcategories.filter(s => s.parent_category === cat.slug);
                return (
                  <div key={cat.id} className="space-y-1">
                    <Link
                      to={`/?category=${encodeURIComponent(cat.slug)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block luxury-body text-[11px] py-2 text-foreground font-medium hover:opacity-70 transition-opacity"
                    >
                      {cat.name}
                    </Link>
                    {subs.length > 0 && (
                      <div className="pl-3 space-y-1 border-l border-border">
                        {subs.map(s => (
                          <Link
                            key={s.id}
                            to={`/?category=${encodeURIComponent(cat.slug)}&sub=${encodeURIComponent(s.slug)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block luxury-body text-[10px] py-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <MobileBottomNav />
    </>
  );
};

export default Header;
