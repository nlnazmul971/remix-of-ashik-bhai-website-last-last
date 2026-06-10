import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, MessageSquare, Users, Settings, LogOut, Store, Plug, Home, Heart, Mail, Trash2, Tag, Facebook, BarChart3, RotateCcw, PackageOpen, PackageCheck, FileImage, Megaphone, Truck, Wallet, Search, ArrowRightLeft, BookOpen, Rocket, DatabaseBackup, ShieldCheck, Activity, ChevronRight } from 'lucide-react';
import adminLogo from '@/assets/admin-logo.png';
import { useStoreSettings } from '@/hooks/useSupabase';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

type SubItem = { title: string; key: string; titleSettingKey?: string };
type MenuItem = { title: string; key: string; icon: any; badge?: number; children?: SubItem[] };

// `titleSettingKey` points to the store_settings field each section editor already
// writes to — changing it there updates the sidebar (and the storefront) everywhere.
export const HOMEPAGE_SECTIONS: SubItem[] = [
  { title: 'Announcement Bar', key: 'announcement' },
  { title: 'Site Logo', key: 'logo' },
  { title: 'Hero Slider', key: 'hero-slider' },
  { title: 'Video Carousel', key: 'video' },
  { title: 'Baby & Kids Fashion', key: 'baby-kids', titleSettingKey: 'baby_kids_title' },
  { title: 'Promo Posters', key: 'promo-posters' },
  { title: 'New Arrivals', key: 'new-arrivals', titleSettingKey: 'new_arrivals_title' },
  { title: 'Explore Categories', key: 'explore-categories', titleSettingKey: 'explore_cats_title' },
  { title: 'Trending Products', key: 'trending', titleSettingKey: 'trending_title' },
  { title: 'Hero Posters (Bottom)', key: 'hero-posters-bottom' },
  { title: 'Category Banners', key: 'category-banners' },
  { title: 'Fancy Posters', key: 'fancy-posters' },
  { title: 'Categories Popup', key: 'categories-popup', titleSettingKey: 'categories_popup_title' },
];

export const SETTINGS_SECTIONS: SubItem[] = [
  { title: 'Change Password', key: 'password' },
  { title: 'Theme & Colors', key: 'theme' },
  { title: 'Footer Settings', key: 'footer' },
];

const buildMenuGroups = (role: 'admin' | 'moderator') => {
  const groups: { label: string; items: MenuItem[] }[] = [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
        { title: 'Homepage', key: 'homepage', icon: Home },
        { title: 'Custom Pages', key: 'custom-pages', icon: FileImage },
        { title: 'Popups', key: 'popups', icon: Megaphone },
      ],
    },
    {
      label: 'Catalog',
      items: [
        { title: 'Products', key: 'products', icon: Package },
        { title: 'Stock', key: 'stock', icon: BarChart3 },
        { title: 'Coupons', key: 'coupons', icon: Tag },
      ],
    },
    {
      label: 'Orders',
      items: [
        { title: 'Orders', key: 'orders', icon: ShoppingBag },
        { title: 'FB Orders', key: 'facebook-orders', icon: Facebook },
        { title: 'Offline Orders', key: 'offline-orders', icon: Store },
        { title: 'Returns', key: 'returns', icon: RotateCcw },
        { title: 'Delivered Items', key: 'delivered-items', icon: PackageCheck },
        { title: 'Packaging', key: 'packaging', icon: PackageOpen },
      ],
    },
    {
      label: 'Content',
      items: [
        { title: 'Blog', key: 'blog', icon: BookOpen },
        { title: 'Landing Pages', key: 'landing-pages', icon: Rocket },
        { title: 'Static Pages', key: 'static-pages', icon: FileImage },
      ],
    },
    {
      label: 'Engagement',
      items: [
        { title: 'Reviews', key: 'reviews', icon: MessageSquare },
        { title: 'Wishlist', key: 'wishlist', icon: Heart },
        { title: 'Newsletter', key: 'newsletter', icon: Mail },
      ],
    },
    {
      label: 'Governance',
      items: [
        { title: 'Activity Log', key: 'activity-log', icon: Activity },
        ...(role === 'admin'
          ? [{ title: 'Approvals', key: 'approvals', icon: ShieldCheck }]
          : [{ title: 'My Requests', key: 'approvals', icon: ShieldCheck }]),
      ],
    },
    {
      label: 'System',
      items: [
        { title: 'Users', key: 'users', icon: Users },
        { title: 'Delivery Charge', key: 'delivery-charge', icon: Truck },
        { title: 'Payment Methods', key: 'payment-methods', icon: Wallet },
        { title: 'API', key: 'api', icon: Plug },
        { title: 'SEO', key: 'seo', icon: Search },
        { title: 'Redirects', key: 'redirects', icon: ArrowRightLeft },
        { title: 'Backup & Restore', key: 'backup', icon: DatabaseBackup },
        { title: 'Trash', key: 'trash', icon: Trash2 },
        { title: 'Settings', key: 'settings', icon: Settings, children: SETTINGS_SECTIONS },
      ],
    },
  ];
  return groups;
};


type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  role?: 'admin' | 'moderator';
  pendingApprovals?: number;
};

const AdminSidebar = ({ activeTab, onTabChange, onSignOut, role = 'admin', pendingApprovals = 0 }: Props) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const menuGroups = buildMenuGroups(role);
  const [parentKey, childKey] = activeTab.split(':');
  const { data: settings = {} } = useStoreSettings();
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});
  const resolveTitle = (sub: SubItem) =>
    (sub.titleSettingKey && (settings as any)[sub.titleSettingKey]) || sub.title;
  const isExpanded = (item: MenuItem) =>
    !!item.children && !collapsed && (openParents[item.key] ?? (parentKey === item.key));
  const handleParentClick = (item: MenuItem) => {
    if (item.children) {
      const currentlyOpen = openParents[item.key] ?? (parentKey === item.key);
      setOpenParents(p => ({ ...p, [item.key]: !currentlyOpen }));
      if (!currentlyOpen) onTabChange(item.key);
    } else {
      onTabChange(item.key);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-lg bg-foreground flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img src={adminLogo} alt="Admin" className="h-7 w-7 object-contain invert" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] font-semibold tracking-tight text-foreground">Admin Panel</p>
              {role === 'moderator' && (
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Moderator</p>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.14em] uppercase text-foreground/60 px-2 h-6">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-px">
                {group.items.map((item) => {
                  const isActive = parentKey === item.key;
                  const badge = item.key === 'approvals' && role === 'admin' ? pendingApprovals : 0;
                  const expanded = isActive && !collapsed && !!item.children;
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.key)}
                        isActive={isActive}
                        tooltip={item.title}
                        className={`group h-8 rounded-md px-2 transition-colors ${
                          isActive
                            ? 'bg-muted text-foreground font-semibold hover:bg-muted'
                            : 'text-foreground/85 hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-foreground' : 'text-foreground/75 group-hover:text-foreground'}`} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[13px] tracking-tight font-medium flex-1">{item.title}</span>
                        {badge > 0 && !collapsed && (
                          <span className="ml-auto min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                            {badge}
                          </span>
                        )}
                        {item.children && !collapsed && (
                          <ChevronRight className={`h-3.5 w-3.5 text-foreground/60 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        )}
                      </SidebarMenuButton>

                      {expanded && (
                        <div className="mt-1 mb-1.5 pl-2 flex flex-col gap-0.5">
                          {item.children!.map((sub) => {
                            const subActive = childKey === sub.key;
                            const label = resolveTitle(sub);
                            return (
                              <button
                                key={sub.key}
                                onClick={() => onTabChange(`${item.key}:${sub.key}`)}
                                className={`text-left text-[12.5px] leading-tight rounded-md px-2 py-1.5 transition-all ${
                                  subActive
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-foreground/70 hover:bg-muted/70 hover:text-foreground'
                                }`}
                              >
                                <span className="truncate block">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSignOut}
              tooltip="Sign Out"
              className="group h-8 rounded-md px-2 text-foreground/85 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="text-[13px] tracking-tight font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
