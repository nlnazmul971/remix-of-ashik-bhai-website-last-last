import { useState, useMemo } from 'react';
import { useProducts, useOrders } from '@/hooks/useSupabase';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingBag, DollarSign, TrendingUp, XCircle, RotateCcw, CreditCard, Truck, TrendingDown, Facebook, Store, Globe } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = parseISO(o.created_at);
      return isWithinInterval(d, {
        start: startOfDay(parseISO(dateRange.from)),
        end: endOfDay(parseISO(dateRange.to)),
      });
    });
  }, [orders, dateRange]);

  // Revenue excludes Cancelled & Returned orders
  const activeOrders = filteredOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned' && o.status !== 'ReturnCancel');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCourierFee = activeOrders.reduce((sum, o) => sum + ((o as any).courier_fee || 0), 0);
  const totalAdvance = activeOrders.reduce((sum, o) => sum + ((o as any).advance_payment || 0), 0);
  
  // Delivery Revenue = only Delivered orders, minus courier fees (from order's delivery_charge)
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
  const deliveredTotal = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveredCourierFee = deliveredOrders.reduce((sum, o) => sum + ((o as any).delivery_charge || (o as any).courier_fee || 0), 0);
  const deliveredAdvance = deliveredOrders.reduce((sum, o) => sum + ((o as any).advance_payment || 0), 0);
  const deliveryRevenue = deliveredTotal - deliveredCourierFee;

  const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;
  const returnedOrders = filteredOrders.filter(o => o.status === 'Returned').length;
  const codOrders = filteredOrders.filter(o => o.payment_method === 'cod').length;
  const onlineOrders = filteredOrders.filter(o => o.payment_method !== 'cod').length;
  // Real available stock from product_size_stock (sum of: total - sold + cancelled + returned per size)
  const { data: allSizeStock = [] } = useQuery({
    queryKey: ['product-size-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_size_stock').select('product_id,total_stock,sold_count,cancelled_count,returned_count');
      if (error) throw error;
      return data || [];
    },
  });
  const availableByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    (allSizeStock as any[]).forEach(s => {
      const avail = (s.total_stock || 0) - (s.sold_count || 0) + (s.cancelled_count || 0) + (s.returned_count || 0);
      map[s.product_id] = (map[s.product_id] || 0) + avail;
    });
    return map;
  }, [allSizeStock]);
  const lowStockProducts = useMemo(() =>
    products
      .filter((p: any) => p.is_active !== false)
      .map((p: any) => ({ ...p, available: availableByProduct[p.id] ?? 0 }))
      .filter((p: any) => p.available > 0 && p.available < 5),
    [products, availableByProduct]
  );
  const lowStock = lowStockProducts.length;

  // Facebook order stats
  const fbOrders = filteredOrders.filter((o: any) => o.source === 'facebook');
  const fbOrderCount = fbOrders.length;
  const fbRevenue = fbOrders.reduce((sum, o) => sum + o.total, 0);

  // Offline order stats
  const offlineOrders = filteredOrders.filter((o: any) => o.source === 'offline');
  const offlineOrderCount = offlineOrders.length;
  const offlineRevenue = offlineOrders.reduce((sum, o) => sum + o.total, 0);

  // Website order stats (default source = 'website' or no source)
  const websiteOrders = filteredOrders.filter((o: any) => !o.source || o.source === 'website');
  const websiteOrderCount = websiteOrders.length;
  const websiteRevenue = websiteOrders.reduce((sum, o) => sum + o.total, 0);

  // Daily revenue chart data
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'Cancelled' || o.status === 'Returned' || o.status === 'ReturnCancel') return;
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + o.total;
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Daily cancelled orders
  const dailyCancelled = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'Cancelled').forEach(o => {
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredOrders]);

  // Daily returned orders
  const dailyReturned = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'Returned').forEach(o => {
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filteredOrders]);

  // Daily FB orders
  const dailyFb = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.filter((o: any) => o.source === 'facebook').forEach(o => {
      const day = format(parseISO(o.created_at), 'MMM dd');
      map[day] = (map[day] || 0) + o.total;
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Payment method pie data
  const paymentData = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const method = o.payment_method === 'cod' ? 'COD' : o.payment_method?.toUpperCase() || 'Other';
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Order status pie data
  const statusData = useMemo(() => {
    const statuses: Record<string, number> = {};
    filteredOrders.forEach(o => {
      statuses[o.status] = (statuses[o.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const PIE_COLORS = ['#5B5BD6', '#22C5A0', '#A78BFA', '#34D399', '#818CF8', '#10B981', '#C4B5FD', '#6EE7B7'];
  const STATUS_COLORS: Record<string, string> = {
    Pending: '#f59e0b',
    Processing: '#3b82f6',
    Shipped: '#8b5cf6',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
    Returned: '#f43f5e',
  };

  // Combined dual-stat cards
  const comboStats = [
    {
      key: 'orders',
      icon: ShoppingBag,
      accent: 'from-[#5B5BD6] to-[#818CF8]',
      tint: 'bg-[#5B5BD6]/10 text-[#5B5BD6]',
      a: { label: 'Total Orders', value: filteredOrders.length },
      b: { label: 'Revenue', value: `৳${totalRevenue.toLocaleString()}`, sub: totalAdvance > 0 ? `Adv: ৳${totalAdvance.toLocaleString()}` : undefined },
    },
    {
      key: 'website',
      icon: Globe,
      accent: 'from-[#0EA5E9] to-[#06B6D4]',
      tint: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
      a: { label: 'Website Orders', value: websiteOrderCount },
      b: { label: 'Website Revenue', value: `৳${websiteRevenue.toLocaleString()}` },
    },
    {
      key: 'fb',
      icon: Facebook,
      accent: 'from-[#1877F2] to-[#3b82f6]',
      tint: 'bg-[#1877F2]/10 text-[#1877F2]',
      a: { label: 'FB Orders', value: fbOrderCount },
      b: { label: 'FB Revenue', value: `৳${fbRevenue.toLocaleString()}` },
    },
    {
      key: 'offline',
      icon: Store,
      accent: 'from-[#22C5A0] to-[#34D399]',
      tint: 'bg-[#22C5A0]/10 text-[#22C5A0]',
      a: { label: 'Offline Orders', value: offlineOrderCount },
      b: { label: 'Offline Revenue', value: `৳${offlineRevenue.toLocaleString()}` },
    },
    {
      key: 'delivery',
      icon: TrendingDown,
      accent: 'from-[#A78BFA] to-[#C4B5FD]',
      tint: 'bg-[#A78BFA]/10 text-[#7C5CE6]',
      a: { label: 'Delivered', value: `৳${deliveredTotal.toLocaleString()}`, sub: `${deliveredOrders.length} orders` },
      b: { label: 'Net Revenue', value: `৳${deliveryRevenue.toLocaleString()}`, sub: `Courier: ৳${deliveredCourierFee.toLocaleString()}${deliveredAdvance > 0 ? ` | Adv: ৳${deliveredAdvance.toLocaleString()}` : ''}` },
    },
  ];

  // Single stat cards — minimal style with subtle color tint
  const stats = [
    { label: 'COD Orders', value: codOrders, icon: Truck, tint: 'bg-[#5B5BD6]/10 text-[#5B5BD6]' },
    { label: 'Online Payment', value: onlineOrders, icon: CreditCard, tint: 'bg-[#22C5A0]/10 text-[#22C5A0]' },
    { label: 'Pending', value: pendingOrders, icon: TrendingUp, tint: 'bg-amber-500/10 text-amber-600' },
    { label: 'Cancelled', value: cancelledOrders, icon: XCircle, tint: 'bg-rose-500/10 text-rose-500' },
    { label: 'Returned', value: returnedOrders, icon: RotateCcw, tint: 'bg-pink-500/10 text-pink-500' },
    { label: 'Products', value: products.length, icon: Package, tint: 'bg-[#22C5A0]/10 text-[#22C5A0]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Date range */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">Real-time business analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="bg-transparent text-xs font-medium outline-none cursor-pointer" />
            <span className="text-xs text-muted-foreground">→</span>
            <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="bg-transparent text-xs font-medium outline-none cursor-pointer" />
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDateRange({ from: format(subDays(new Date(), d), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') })} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-muted hover:bg-gradient-to-br hover:from-[#5B5BD6] hover:to-[#22C5A0] hover:text-white transition-all">
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Combined dual-stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {comboStats.map(c => (
          <div key={c.key} className="group relative overflow-hidden bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${c.accent} opacity-10 blur-2xl`} />
            <div className="relative flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${c.tint} flex items-center justify-center`}>
                <c.icon size={16} />
              </div>
            </div>
            <div className="relative flex flex-col gap-2 min-[1500px]:grid min-[1500px]:grid-cols-2 min-w-0">
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase font-semibold mb-1 whitespace-nowrap">{c.a.label}</p>
                <p className="text-lg xl:text-xl font-bold tracking-tight text-foreground whitespace-nowrap leading-tight">{c.a.value}</p>
                {(c.a as any).sub && <p className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">{(c.a as any).sub}</p>}
              </div>
              <div className="border-t min-[1500px]:border-t-0 min-[1500px]:border-l border-border pt-2 min-[1500px]:pt-0 min-[1500px]:pl-2 min-w-0">
                <p className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase font-semibold mb-1 whitespace-nowrap">{c.b.label}</p>
                <p className="text-lg xl:text-xl font-bold tracking-tight text-foreground whitespace-nowrap leading-tight">{c.b.value}</p>
                {(c.b as any).sub && <p className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">{(c.b as any).sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Single stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <div key={s.label} className="group relative overflow-hidden bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="relative flex items-center justify-between mb-3">
              <span className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase font-semibold">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg ${s.tint} flex items-center justify-center`}>
                <s.icon size={13} />
              </div>
            </div>
            <p className="relative text-lg font-bold tracking-tight text-foreground">{s.value}</p>
            {(s as any).sub && <p className="relative text-[10px] text-muted-foreground mt-1 leading-tight">{(s as any).sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts Grid - Revenue + Mini Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Overview - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-[#5B5BD6]/5 to-[#22C5A0]/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#5B5BD6]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#5B5BD6]">Revenue Overview</h3>
          </div>
          {dailyData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B5BD6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#5B5BD6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#5B5BD6" strokeWidth={2.5} fill="url(#revenueGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FB Orders Revenue - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-[#5B5BD6]/5 to-[#22C5A0]/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#5B5BD6]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#5B5BD6]">FB Orders Revenue</h3>
          </div>
          <p className="text-lg font-bold text-[#5B5BD6] mb-2">৳{fbRevenue.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">({fbOrderCount} orders)</span></p>
          {dailyFb.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No FB orders</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailyFb}>
                <defs>
                  <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B5BD6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#22C5A0" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`৳${value.toLocaleString()}`, 'FB Revenue']} />
                <Bar dataKey="revenue" fill="url(#fbGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cancelled Orders - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-[#5B5BD6]/5 to-[#22C5A0]/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#22C5A0]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#22C5A0]">Cancelled Orders</h3>
          </div>
          <p className="text-lg font-bold text-[#22C5A0] mb-2">{cancelledOrders} <span className="text-[10px] font-normal text-muted-foreground">cancelled</span></p>
          {dailyCancelled.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No cancellations 🎉</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailyCancelled}>
                <defs>
                  <linearGradient id="cancelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C5A0" stopOpacity={1} />
                    <stop offset="100%" stopColor="#5B5BD6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="url(#cancelGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Returned Orders - Compact */}
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-[#A78BFA]/5 to-[#5B5BD6]/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#A78BFA]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#7C5CE6]">Returned Orders</h3>
          </div>
          <p className="text-lg font-bold text-[#7C5CE6] mb-2">{returnedOrders} <span className="text-[10px] font-normal text-muted-foreground">returned</span></p>
          {dailyReturned.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No returns 🎉</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={dailyReturned}>
                <defs>
                  <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={25} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#7C5CE6" strokeWidth={2.5} fill="url(#returnGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-3">Payment Methods</h3>
          {paymentData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`payGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={`url(#payGrad${i % PIE_COLORS.length})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-border p-4 rounded-lg bg-gradient-to-br from-background to-secondary/20">
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-3">Order Status</h3>
          {statusData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <defs>
                  {statusData.map((entry, i) => (
                    <linearGradient key={i} id={`statusGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" cornerRadius={6} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={`url(#statusGrad${i})`} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock warning */}
      {lowStock > 0 && (
        <div className="relative overflow-hidden border border-destructive/20 bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">⚠️</div>
            <p className="text-sm text-destructive font-semibold">{lowStock} product(s) running low on stock</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-background/60 backdrop-blur rounded-lg px-3 py-2 border border-border/50">
                <p className="text-xs text-foreground truncate">{p.name}</p>
                <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{p.available}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Recent Orders</h2>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">Latest customer activity</p>
          </div>
          <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-lg">{orders.length} total</div>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="group flex items-center justify-between border border-border bg-background hover:border-[#5B5BD6]/40 hover:shadow-sm p-3 rounded-lg transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#5B5BD6]/10 to-[#22C5A0]/10 flex items-center justify-center text-[10px] font-bold text-[#5B5BD6] shrink-0">
                    #{order.id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold truncate">#{order.id.slice(0, 8)}</p>
                      {(order as any).source === 'facebook' && <span className="bg-[#5B5BD6]/10 text-[#5B5BD6] text-[8px] font-bold px-1.5 py-0.5 rounded">FB</span>}
                      {(order as any).source === 'offline' && <span className="bg-[#22C5A0]/10 text-[#22C5A0] text-[8px] font-bold px-1.5 py-0.5 rounded">Offline</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{order.customer_name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">৳{order.total.toLocaleString()}</p>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' : order.status === 'Returned' ? 'bg-pink-500/10 text-pink-500' : order.status === 'Delivered' ? 'bg-[#22C5A0]/10 text-[#22C5A0]' : 'bg-[#5B5BD6]/10 text-[#5B5BD6]'}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
