import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Home, User, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, useStoreSettings } from '@/hooks/useSupabase';
import SearchOverlay from '@/components/SearchOverlay';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.uid);
  const { data: settings } = useStoreSettings();
  const profilePath = role === 'admin' ? '/admin' : '/profile';
  const messageLink = settings?.footer_whatsapp || settings?.footer_messenger || '';

  const isHome = location.pathname === '/' && !location.search;
  const isProfile = location.pathname === profilePath;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const SideItem = ({
    icon: Icon,
    label,
    onClick,
    to,
    badge,
    active,
    cartTarget,
  }: {
    icon: any;
    label: string;
    onClick?: () => void;
    to?: string;
    badge?: number;
    active?: boolean;
    cartTarget?: boolean;
  }) => {
    const showBadge = typeof badge === 'number' && badge > 0;
    const inner = (
      <div className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full">
        <div className="relative" {...(cartTarget ? { 'data-cart-target': '' } : {})}>
          <Icon
            size={19}
            strokeWidth={1.6}
            className={active ? 'text-foreground' : 'text-foreground/75'}
          />
          {showBadge && (
            <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-foreground text-background text-[9px] font-semibold rounded-full flex items-center justify-center leading-none">
              {badge! > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span
          className={`text-[8px] tracking-[0.2em] uppercase ${
            active ? 'text-foreground font-semibold' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      </div>
    );
    const cls = 'flex-1 flex active:scale-95 transition-transform';
    if (to) return <Link to={to} className={cls}>{inner}</Link>;
    return <button onClick={onClick} className={cls}>{inner}</button>;
  };

  return (
    <>
      

      <nav className="sm:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="relative">
          {/* Floating pill */}
          <div
            className="relative bg-background/40 backdrop-blur-2xl border border-white/30 rounded-[28px] h-[64px] flex items-stretch px-3 pb-[env(safe-area-inset-bottom)]"
            style={{
              boxShadow:
                '0 8px 24px -10px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <SideItem icon={Search} label="Search" onClick={() => setSearchOpen(true)} />
            <SideItem
              icon={MessageCircle}
              label="Message"
              onClick={() => messageLink && window.open(messageLink, '_blank')}
            />

            {/* Spacer for elevated home */}
            <div className="w-[64px] flex-shrink-0" aria-hidden />

            <SideItem icon={User} label="Profile" to={profilePath} active={isProfile} />
            <SideItem
              icon={ShoppingBag}
              label="Cart"
              onClick={() => setIsCartOpen(true)}
              badge={itemCount}
              cartTarget
            />
          </div>

          {/* Elevated center Home button */}
          <Link
            to="/"
            aria-label="Home"
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-[52px] h-[52px] rounded-full bg-foreground/70 backdrop-blur-md text-background flex items-center justify-center active:scale-95 transition-transform"
            style={{
              boxShadow:
                '0 6px 14px -4px rgba(0,0,0,0.25), 0 0 0 3px hsl(var(--background))',
            }}
          >
            <Home size={20} strokeWidth={1.8} className={isHome ? 'fill-background/15' : ''} />
          </Link>
        </div>
      </nav>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
        onSubmit={handleSearch}
      />
    </>
  );
};

export default MobileBottomNav;
