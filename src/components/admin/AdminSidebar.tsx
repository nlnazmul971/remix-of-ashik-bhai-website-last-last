import { LayoutDashboard, Package, ShoppingBag, MessageSquare, Users, Settings, LogOut, Store, Plug, Home, Heart, Mail, Trash2, Tag, Facebook, BarChart3, RotateCcw, PackageOpen, PackageCheck, Layers, FileImage, Megaphone, Truck, Wallet, Search, ArrowRightLeft, BookOpen, Rocket, Globe, TrendingUp, DatabaseBackup, ShieldCheck, Activity } from 'lucide-react';
import adminLogo from '@/assets/admin-logo.png';
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

const buildMenuGroups = (role: 'admin' | 'moderator') => {
  const groups: { label: string; items: { title: string; key: string; icon: any; badge?: number }[] }[] = [
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
        { title: 'Settings', key: 'settings', icon: Settings },
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
                  const isActive = activeTab === item.key;
                  const badge = item.key === 'approvals' && role === 'admin' ? pendingApprovals : 0;
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
                      </SidebarMenuButton>
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
