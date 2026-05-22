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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background shadow-sm -translate-y-full sm:translate-y-0' : 'bg-transparent'}`}>
        {!scrolled && <AnnouncementBar />}
        {!scrolled && <TopBar />}
        {/* Top bar - hidden on scroll for both mobile and desktop */}
        {!scrolled && (
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 sm:gap-6 h-14 sm:h-20 relative">
                {/* Mobile menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden w-9 h-9 mt-4 rounded-full bg-background/40 backdrop-blur-md ring-1 ring-foreground/20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)] flex items-center justify-center text-foreground hover:bg-background/60 transition-all"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X size={18} strokeWidth={2.25} /> : <Menu size={18} strokeWidth={2.25} />}
                </button>

                {/* Logo - centered on mobile */}
                <Link to="/" className="site-logo-link shrink-0 flex items-center justify-center mt-4 sm:mt-0 absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 sm:w-auto" aria-label="Home">
                  <img
                    src={siteLogo}
                    alt="Logo"
                    className="site-logo-img block max-w-none h-auto sm:h-20 sm:w-auto object-contain relative z-10"
                    loading="eager"
                    fetchPriority={"high" as any}
                    decoding="async"
                  />
                </Link>
                <style>{`
                  @media (max-width: 639px) {
                    .site-logo-link { width: min(240px, calc(100vw - 108px)) !important; min-width: min(240px, calc(100vw - 108px)) !important; }
                    .site-logo-img { width: min(240px, calc(100vw - 108px)) !important; min-width: min(240px, calc(100vw - 108px)) !important; max-width: none !important; height: auto !important; }
                  }
                `}</style>

                {/* Search bar - desktop center */}
                <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-2xl mx-auto">
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

                {/* Right icons */}
                <div className="flex items-center gap-1 sm:gap-3 ml-auto sm:ml-0">
                  <Link to={profilePath} className="hidden sm:block p-1.5 hover:opacity-60 transition-opacity">
                    <User size={20} />
                  </Link>
                  <Link to="/wishlist" className="hidden sm:block p-1.5 hover:opacity-60 transition-opacity relative">
                    <Heart size={20} />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                  <button
                    data-cart-target
                    onClick={() => setIsCartOpen(true)}
                    className="sm:p-1.5 w-9 h-9 mt-4 sm:mt-0 sm:w-auto sm:h-auto rounded-full sm:rounded-none bg-background/40 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none ring-1 sm:ring-0 ring-foreground/20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)] sm:shadow-none flex items-center justify-center text-foreground hover:bg-background/60 sm:hover:bg-transparent transition-all relative"
                    aria-label="Cart"
                  >
                    <ShoppingBag size={18} strokeWidth={2.25} className="sm:hidden" />
                    <ShoppingBag size={20} className="hidden sm:block" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full flex items-center justify-center ring-2 ring-background sm:ring-0">
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
        <nav onMouseLeave={() => !isMobile && setOpenDropdown(null)}>
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
