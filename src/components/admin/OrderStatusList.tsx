import { Fragment, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateOrder } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled', 'ReturnCancel'];
const sourceOptions = ['website', 'facebook', 'offline'];

interface Props {
  orders: any[];
  title: string;
  onRefetch?: () => void;
}

const OrderStatusList = ({ orders, title, onRefetch }: Props) => {
  const updateOrder = useUpdateOrder();
  const [filter, setFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrder.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
      onRefetch?.();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই অর্ডারটি ট্র্যাশে পাঠাতে চান?')) return;
    try {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
      toast.success('Moved to trash');
      onRefetch?.();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSourceChange = async (id: string, source: string) => {
    try {
      await updateOrder.mutateAsync({ id, source });
      toast.success(`Source changed to ${source}`);
      onRefetch?.();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="border border-border bg-card">
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-medium tracking-wide">{title}</h3>
        <span className="text-xs text-muted-foreground">({orders.length})</span>
        <div className="ml-auto flex gap-1 flex-wrap">
          {['All', ...statusOptions].map(s => {
            const c = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${filter === s ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {s} <span className="ml-1 opacity-70">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No orders</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order: any) => {
                const items = Array.isArray(order.items) ? order.items : [];
                const isOpen = expanded === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_city}</p>
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell">{order.customer_phone}</td>
                      <td className="p-3 font-medium">৳{order.total.toLocaleString()}</td>
                      <td className="p-3">
                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="text-xs border border-border bg-background px-2 py-1 focus:outline-none">
                          {statusOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <select value={order.source || 'website'} onChange={e => handleSourceChange(order.id, e.target.value)}
                          className="text-xs border border-border bg-background px-2 py-1 focus:outline-none capitalize">
                          {sourceOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setExpanded(isOpen ? null : order.id)} className="p-1.5 hover:bg-accent transition-colors" title="View items">
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button onClick={() => handleDelete(order.id)} className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors" title="Move to trash">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/10">
                        <td colSpan={7} className="p-4">
                          <div className="text-xs space-y-1">
                            <p className="text-muted-foreground"><strong className="text-foreground">Address:</strong> {order.customer_address}</p>
                            {order.customer_note && <p className="text-muted-foreground"><strong className="text-foreground">Note:</strong> {order.customer_note}</p>}
                            <div className="mt-2">
                              <strong>Items:</strong>
                              <ul className="mt-1 space-y-0.5">
                                {items.map((it: any, i: number) => (
                                  <li key={i} className="text-muted-foreground">• {it.name} — {it.size}/{it.color} × {it.quantity} = ৳{(it.price * it.quantity).toLocaleString()}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderStatusList;
