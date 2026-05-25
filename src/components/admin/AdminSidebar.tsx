import { LayoutDashboard, Package, ShoppingBag, MessageSquare, Users, Settings, LogOut, Store, Plug, Home, Heart, Mail, Trash2, Tag, Facebook, BarChart3, RotateCcw, PackageOpen, PackageCheck, Layers, FileImage, Megaphone, Truck, Wallet, Search } from 'lucide-react';
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

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
      { title: 'Homepage', key: 'homepage', icon: Home },
      { title: 'Header & Sub-categories', key: 'subcategories', icon: Layers },
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
    label: 'Engagement',
    items: [
      { title: 'Reviews', key: 'reviews', icon: MessageSquare },
      { title: 'Wishlist', key: 'wishlist', icon: Heart },
      { title: 'Newsletter', key: 'newsletter', icon: Mail },
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
      { title: 'Trash', key: 'trash', icon: Trash2 },
      { title: 'Settings', key: 'settings', icon: Settings },
    ],
  },
];

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
};

const AdminSidebar = ({ activeTab, onTabChange, onSignOut }: Props) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
                        <span className="text-[13px] tracking-tight font-medium">{item.title}</span>
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
