import { useState, useMemo } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, X, Search, Package, PackageCheck, Truck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const isReturnLike = (s: string) => s === 'Returned' || s === 'Cancelled' || s === 'ReturnCancel';

const statusMeta: Record<string, { label: string; tone: string }> = {
  Returned:     { label: 'Returned',      tone: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20' },
  Cancelled:    { label: 'Cancelled',     tone: 'bg-destructive/10 text-destructive border-destructive/20' },
  ReturnCancel: { label: 'Return Cancel', tone: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
};

const AdminReturnParcels = () => {
  const { data: orders = [] } = useOrders();
  const updateOrder = useUpdateOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filter, setFilter] = useState<'Returned' | 'Cancelled' | 'ReturnCancel' | 'All'>('All');
  const [receivedFilter, setReceivedFilter] = useState<'all' | 'received' | 'not_received'>('all');

  const allReturns = useMemo(() => orders.filter(o => isReturnLike(o.status)), [orders]);

  const visibleOrders = useMemo(() => {
    let f = allReturns;
    if (filter !== 'All') f = f.filter(o => o.status === filter);
    if (receivedFilter === 'received') f = f.filter(o => (o as any).return_received === true);
    if (receivedFilter === 'not_received') f = f.filter(o => !(o as any).return_received);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        ((o as any).tracking_code && (o as any).tracking_code.toLowerCase().includes(q))
      );
    }
    return f;
  }, [allReturns, filter, searchQuery, receivedFilter]);

  const counts = useMemo(() => {
    const returned = orders.filter(o => o.status === 'Returned');
    const cancelled = orders.filter(o => o.status === 'Cancelled');
    const returnCancel = orders.filter(o => o.status === 'ReturnCancel');
    return {
      returned: returned.length,
      cancelled: cancelled.length,
      returnCancel: returnCancel.length,
      received: allReturns.filter(o => (o as any).return_received).length,
      pending: allReturns.filter(o => !(o as any).return_received).length,
      returnLoss: returned.reduce((s, o) => s + o.total, 0),
      cancelLoss: cancelled.reduce((s, o) => s + o.total, 0),
      courierLoss: returnCancel.reduce((s, o) => s + ((o as any).courier_fee || 0), 0),
    };
  }, [orders, allReturns]);

  const toggleReceived = async (order: any) => {
    const newVal = !(order as any).return_received;
    try {
      await updateOrder.mutateAsync({ id: order.id, return_received: newVal } as any);
      toast.success(newVal ? 'পার্সেল হাতে পেয়েছেন ✅' : 'পার্সেল কুরিয়ারে মার্ক করা হয়েছে');
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, return_received: newVal });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRestoreOrder = async (order: any) => {
    try {
      await updateOrder.mutateAsync({ id: order.id, status: 'Pending', return_received: false } as any);
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        if (item.product_id && item.size) {
          const { data: existing } = await supabase.from('product_size_stock')
            .select('*').eq('product_id', item.product_id).eq('size', item.size).maybeSingle();
          if (existing) {
            const field = order.status === 'Returned' ? 'returned_count' : 'cancelled_count';
            const newVal = Math.max(0, (existing as any)[field] - (item.quantity || 1));
            await supabase.from('product_size_stock').update({ [field]: newVal } as any).eq('id', existing.id);
          }
          await supabase.from('stock_logs').insert({
            product_id: item.product_id, size: item.size,
            change_type: 'restored', quantity: item.quantity || 1,
            order_id: order.id, notes: `Order restored from ${order.status}`,
          });
        }
      }
      toast.success('অর্ডার Pending এ ফিরিয়ে আনা হয়েছে');
      setSelectedOrder(null);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light tracking-wide">Return & Cancel Parcels</h2>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide">Returned ও Cancelled অর্ডার ম্যানেজ করুন</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Returned" value={counts.returned} sub={`৳${counts.returnLoss.toLocaleString()} loss`} tone="pink" />
        <Kpi label="Cancelled" value={counts.cancelled} sub={`৳${counts.cancelLoss.toLocaleString()} loss`} tone="destructive" />
        <Kpi label="Return Cancel" value={counts.returnCancel} sub={`৳${counts.courierLoss.toLocaleString()} courier`} tone="orange" />
        <Kpi label="In Hand / Courier" value={counts.received} sub={`${counts.pending} এখনো কুরিয়ারে`} tone="emerald" />
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, order ID, tracking…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-transparent border border-border focus:border-primary outline-none transition-colors tracking-wide"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['All', 'Returned', 'Cancelled', 'ReturnCancel'] as const).map(f => {
            const c = f === 'All' ? allReturns.length : orders.filter(o => o.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                  filter === f ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'ReturnCancel' ? 'Return Cancel' : f} <span className="opacity-60">· {c}</span>
              </button>
            );
          })}
          <span className="w-px bg-border mx-1" />
          {([
            { key: 'all', label: 'সব' },
            { key: 'received', label: '✅ হাতে পেয়েছি' },
            { key: 'not_received', label: '🚚 কুরিয়ারে' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setReceivedFilter(f.key as any)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                receivedFilter === f.key ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {visibleOrders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <Package size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">কোনো return / cancel পার্সেল নেই 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleOrders.map(order => {
            const items = Array.isArray(order.items) ? order.items : [];
            const isReceived = (order as any).return_received;
            const meta = statusMeta[order.status] || statusMeta.Cancelled;

            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="group text-left border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full ${meta.tone}`}>{meta.label}</span>
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); toggleReceived(order); }}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full cursor-pointer transition-colors ${
                          isReceived
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {isReceived ? <><PackageCheck size={10} className="inline mr-1" />হাতে পেয়েছি</> : <><Truck size={10} className="inline mr-1" />কুরিয়ারে</>}
                      </span>
                    </div>
                    <p className="font-medium text-sm tracking-wide truncate">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.customer_phone}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1.5">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-light">৳{order.total.toLocaleString()}</p>
                    <ChevronRight size={14} className="text-muted-foreground ml-auto mt-1 group-hover:text-foreground transition-colors" />
                  </div>
                </div>

                {items.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-3 truncate">
                    {items.map((i: any) => `${i.name} (${i.size || '-'})`).join(' · ')}
                  </p>
                )}

                {(order as any).tracking_code && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-2 tracking-wider">
                    Tracking · {(order as any).tracking_code}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{visibleOrders.length} order{visibleOrders.length !== 1 ? 's' : ''}</p>

      {/* Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelectedOrder(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />
          <div
            className="relative ml-auto w-full max-w-md h-full bg-background border-l border-border overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Order</p>
                <h3 className="text-lg font-light tracking-wide font-mono mt-0.5">#{selectedOrder.id.slice(0, 8)}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-muted transition-colors"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full ${(statusMeta[selectedOrder.status] || statusMeta.Cancelled).tone}`}>
                  {(statusMeta[selectedOrder.status] || statusMeta.Cancelled).label}
                </span>
                <button
                  onClick={() => toggleReceived(selectedOrder)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                    (selectedOrder as any).return_received
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  }`}
                >
                  {(selectedOrder as any).return_received ? '✅ হাতে পেয়েছি' : '🚚 এখনো কুরিয়ারে'}
                </button>
              </div>

              {/* Customer */}
              <div className="space-y-2 text-sm">
                <Row label="Customer" value={selectedOrder.customer_name} />
                <Row label="Phone" value={selectedOrder.customer_phone} mono />
                <Row label="Address" value={`${selectedOrder.customer_address}, ${selectedOrder.customer_city}`} />
                {(selectedOrder as any).tracking_code && <Row label="Tracking" value={(selectedOrder as any).tracking_code} mono />}
                {(selectedOrder as any).courier_provider && <Row label="Courier" value={(selectedOrder as any).courier_provider} />}
                {(selectedOrder as any).admin_notes && <Row label="Notes" value={(selectedOrder as any).admin_notes} italic />}
              </div>

              {/* Items */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Items</p>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="truncate pr-2">
                        {item.name} <span className="text-muted-foreground">· {item.size || '-'} × {item.quantity}</span>
                      </span>
                      <span className="font-medium shrink-0">৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-3 mt-2 border-t border-border">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground self-center">Total</span>
                    <span className="text-lg font-light">৳{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border p-5">
              <button
                onClick={() => handleRestoreOrder(selectedOrder)}
                className="w-full py-3 text-xs uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Restore to Pending
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Kpi = ({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: 'pink' | 'destructive' | 'orange' | 'emerald' }) => {
  const toneClass =
    tone === 'destructive' ? 'text-destructive' :
    tone === 'orange' ? 'text-orange-600 dark:text-orange-400' :
    tone === 'pink' ? 'text-pink-600 dark:text-pink-400' :
    tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
    'text-foreground';
  return (
    <div className="border border-border p-4 bg-card">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-3xl font-light mt-2 ${toneClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1.5 tracking-wide">{sub}</p>}
    </div>
  );
};

const Row = ({ label, value, mono, italic }: { label: string; value: string; mono?: boolean; italic?: boolean }) => (
  <div className="flex gap-3">
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-20 shrink-0 mt-0.5">{label}</span>
    <span className={`text-sm flex-1 ${mono ? 'font-mono' : ''} ${italic ? 'italic text-muted-foreground' : ''}`}>{value}</span>
  </div>
);

export default AdminReturnParcels;
