import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, User, Home, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useSupabase';
import { useWishlist } from '@/contexts/WishlistContext';
import SearchOverlay from '@/components/SearchOverlay';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { data: role } = useUserRole(user?.uid);
  const { items: wishlistItems } = useWishlist();
  const profilePath = role === 'admin' ? '/admin' : '/profile';

  const isHome = location.pathname === '/' && !location.search;
  const isWishlist = location.pathname === '/wishlist';
  const isProfile = location.pathname === profilePath;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const Item = ({
    icon: Icon,
    label,
    onClick,
    to,
    active,
    badge,
  }: {
    icon: any;
    label: string;
    onClick?: () => void;
    to?: string;
    active?: boolean;
    badge?: number;
  }) => {
    const showBadge = typeof badge === 'number' && badge > 0;
    const inner = (
      <div className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
        <div className="relative">
          <Icon
            size={18}
            strokeWidth={1.6}
            className={active ? 'text-primary-foreground' : 'text-foreground/80'}
          />
          {showBadge && (
            <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 bg-destructive text-destructive-foreground text-[9px] font-semibold rounded-full flex items-center justify-center leading-none">
              {badge! > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span
          className={`text-[9px] ${
            active ? 'text-primary-foreground font-semibold' : 'text-foreground/70'
          }`}
        >
          {label}
        </span>
      </div>
    );
    const cls = `flex-1 flex active:scale-95 transition-all rounded-xl mx-0.5 ${
      active ? 'bg-primary' : ''
    }`;
    if (to) return <Link to={to} className={cls}>{inner}</Link>;
    return <button onClick={onClick} className={cls}>{inner}</button>;
  };

  return (
    <>
      <nav className="sm:hidden fixed bottom-2 left-4 right-4 z-40">
        <div
          className="bg-card border border-border rounded-[22px] h-[56px] flex items-stretch px-1.5 pb-[env(safe-area-inset-bottom)]"
          style={{ boxShadow: '0 8px 24px -10px rgba(0,0,0,0.15)' }}
        >
          <Item icon={Home} label="Home" to="/" active={isHome} />
          <Item icon={Search} label="Search" onClick={() => setSearchOpen(true)} />
          <Item icon={Heart} label="Wishlist" to="/wishlist" active={isWishlist} badge={wishlistItems.length} />
          <Item icon={User} label="Account" to={profilePath} active={isProfile} />
          <Item icon={LayoutGrid} label="Categories" to="/?view=categories" />
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
