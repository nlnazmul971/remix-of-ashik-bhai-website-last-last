import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useSupabase';
import { Package, Plus, Minus, Search, History, Save, RefreshCw, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type SizeStock = {
  id: string;
  product_id: string;
  size: string;
  total_stock: number;
  sold_count: number;
  cancelled_count: number;
  returned_count: number;
};

type StockLog = {
  id: string;
  product_id: string;
  size: string;
  change_type: string;
  quantity: number;
  order_id: string | null;
  notes: string | null;
  created_at: string;
};

const useProductSizeStock = () => {
  return useQuery({
    queryKey: ['product-size-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_size_stock').select('*').order('size');
      if (error) throw error;
      return (data || []) as SizeStock[];
    },
  });
};

const useStockLogs = (productId?: string) => {
  return useQuery({
    queryKey: ['stock-logs', productId],
    queryFn: async () => {
      let q = supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (productId) q = q.eq('product_id', productId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as StockLog[];
    },
  });
};

const getAvailable = (s: SizeStock) =>
  s.total_stock - s.sold_count + s.cancelled_count + s.returned_count;

const pillTone = (n: number) =>
  n <= 0
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : n < 5
    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';

const AdminStockManagement = () => {
  const { data: products = [] } = useProducts();
  const { data: allStock = [], refetch: refetchStock } = useProductSizeStock();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  const stockByProduct = useMemo(() => {
    const map: Record<string, SizeStock[]> = {};
    allStock.forEach(s => {
      if (!map[s.product_id]) map[s.product_id] = [];
      map[s.product_id].push(s);
    });
    return map;
  }, [allStock]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter((p: any) => p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s));
  }, [products, search]);

  // KPI summary
  const summary = useMemo(() => {
    let totalSkus = 0, lowStock = 0, outOfStock = 0, totalStock = 0;
    products.forEach((p: any) => {
      const stocks = stockByProduct[p.id] || [];
      const total = stocks.reduce((sum, s) => sum + getAvailable(s), 0);
      totalSkus += stocks.length;
      totalStock += total;
      if (total <= 0) outOfStock += 1;
      else if (total < 10) lowStock += 1;
    });
    return { totalSkus, lowStock, outOfStock, totalStock, totalProducts: products.length };
  }, [products, stockByProduct]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide">Stock Management</h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">Manage product inventory size-wise</p>
        </div>
        <button
          onClick={() => setLogsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest border border-border hover:bg-muted transition-colors"
        >
          <History size={14} /> Activity Logs
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={<Package size={16} />} label="Products" value={summary.totalProducts} />
        <KpiCard icon={<CheckCircle2 size={16} />} label="Total SKUs" value={summary.totalSkus} tone="emerald" />
        <KpiCard icon={<Package size={16} />} label="Total Stock" value={summary.totalStock} tone="emerald" />
        <KpiCard icon={<AlertTriangle size={16} />} label="Low Stock" value={summary.lowStock} tone="amber" />
        <KpiCard icon={<XCircle size={16} />} label="Out of Stock" value={summary.outOfStock} tone="destructive" />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full pl-11 pr-4 py-3 text-sm bg-transparent border border-border focus:border-primary outline-none transition-colors tracking-wide"
        />
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProducts.map((p: any) => {
          const stocks = stockByProduct[p.id] || [];
          const total = stocks.reduce((sum, s) => sum + getAvailable(s), 0);
          const isOut = total <= 0 && stocks.length > 0;
          const isLow = total > 0 && total < 10;

          return (
            <button
              key={p.id}
              onClick={() => setEditingProduct(p)}
              className={`group text-left border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 ${
                isOut ? 'border-destructive/30 bg-destructive/[0.02]' : isLow ? 'border-amber-500/30' : 'border-border'
              }`}
            >
              <div className="flex gap-4">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-16 h-20 object-cover" />
                ) : (
                  <div className="w-16 h-20 bg-muted flex items-center justify-center">
                    <Package size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate tracking-wide">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">SKU · {p.sku || '—'}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-2xl font-light ${isOut ? 'text-destructive' : isLow ? 'text-amber-600' : 'text-foreground'}`}>
                      {total}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">in stock</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {stocks.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic tracking-wide">No stock configured — click to set up</span>
                ) : (
                  stocks.map(s => {
                    const avail = getAvailable(s);
                    return (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase border rounded-full ${pillTone(avail)}`}
                      >
                        <span className="opacity-60">{s.size}</span>
                        <span>·</span>
                        <span>{avail}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </button>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
            No products found
          </div>
        )}
      </div>

      {/* Edit drawer */}
      {editingProduct && (
        <StockEditDrawer
          product={editingProduct}
          stocks={stockByProduct[editingProduct.id] || []}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { refetchStock(); setEditingProduct(null); }}
        />
      )}

      {/* Logs drawer */}
      {logsOpen && <LogsDrawer products={products as any} onClose={() => setLogsOpen(false)} />}
    </div>
  );
};

const KpiCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: 'emerald' | 'amber' | 'destructive' }) => {
  const toneClass =
    tone === 'destructive' ? 'text-destructive' :
    tone === 'amber' ? 'text-amber-600 dark:text-amber-400' :
    tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
    'text-foreground';
  return (
    <div className="border border-border p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-3xl font-light mt-2 ${toneClass}`}>{value}</p>
    </div>
  );
};

const StockEditDrawer = ({ product, stocks, onClose, onSaved }: { product: any; stocks: SizeStock[]; onClose: () => void; onSaved: () => void; }) => {
  const initial: Record<string, number> = {};
  (product.sizes || []).forEach((size: string) => {
    const ex = stocks.find(s => s.size === size);
    initial[size] = ex?.total_stock || 0;
  });
  const [edit, setEdit] = useState<Record<string, number>>(initial);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    setSaving(true);
    try {
      for (const [size, qty] of Object.entries(edit)) {
        const existing = stocks.find(s => s.size === size);
        if (existing) {
          if (existing.total_stock === qty) continue;
          await supabase.from('product_size_stock').update({ total_stock: qty } as any).eq('id', existing.id);
          await supabase.from('stock_logs').insert({
            product_id: product.id, size, change_type: 'manual',
            quantity: qty - existing.total_stock,
            notes: `Stock set to ${qty}`,
          });
        } else {
          await supabase.from('product_size_stock').insert({ product_id: product.id, size, total_stock: qty });
          await supabase.from('stock_logs').insert({
            product_id: product.id, size, change_type: 'manual',
            quantity: qty, notes: `Initial stock ${qty}`,
          });
        }
      }
      toast.success('Stock updated');
      qc.invalidateQueries({ queryKey: ['stock-logs'] });
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />
      <div
        className="relative ml-auto w-full max-w-md h-full bg-background border-l border-border overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Manage Stock</p>
            <h3 className="text-lg font-light tracking-wide mt-0.5 truncate max-w-[280px]">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-4 items-center pb-4 border-b border-border">
            {product.image_url && <img src={product.image_url} alt="" className="w-16 h-20 object-cover" />}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>SKU · {product.sku || '—'}</p>
              <p>{(product.sizes || []).length} sizes</p>
            </div>
          </div>

          <div className="space-y-3">
            {(product.sizes || []).map((size: string) => {
              const existing = stocks.find(s => s.size === size);
              const planned = edit[size] ?? existing?.total_stock ?? 0;
              const avail = existing
                ? planned - existing.sold_count + existing.cancelled_count + existing.returned_count
                : planned;

              return (
                <div key={size} className="border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium tracking-wider">{size}</span>
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border rounded-full ${pillTone(avail)}`}>
                      {avail} available
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEdit(p => ({ ...p, [size]: Math.max(0, (p[size] ?? existing?.total_stock ?? 0) - 1) }))}
                      className="w-10 h-10 border border-border hover:bg-muted flex items-center justify-center transition-colors"
                    ><Minus size={14} /></button>
                    <input
                      type="number" min={0}
                      value={planned === 0 ? '' : planned}
                      onChange={e => setEdit(p => ({ ...p, [size]: e.target.value === '' ? 0 : (parseInt(e.target.value) || 0) }))}
                      placeholder="0"
                      className="flex-1 h-10 text-center text-base font-light bg-transparent border border-border focus:border-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEdit(p => ({ ...p, [size]: (p[size] ?? existing?.total_stock ?? 0) + 1 }))}
                      className="w-10 h-10 border border-border hover:bg-muted flex items-center justify-center transition-colors"
                    ><Plus size={14} /></button>
                  </div>

                  {existing && (
                    <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground pt-2 border-t border-border">
                      <span>Sold <span className="text-foreground font-medium ml-1">{existing.sold_count}</span></span>
                      <span>Cancel <span className="text-foreground font-medium ml-1">{existing.cancelled_count}</span></span>
                      <span>Return <span className="text-foreground font-medium ml-1">{existing.returned_count}</span></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 text-xs uppercase tracking-widest border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={save} disabled={saving}
            className="flex-1 py-3 text-xs uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Stock
          </button>
        </div>
      </div>
    </div>
  );
};

const LogsDrawer = ({ products, onClose }: { products: any[]; onClose: () => void; }) => {
  const [filterProduct, setFilterProduct] = useState<string>('');
  const { data: logs = [] } = useStockLogs(filterProduct || undefined);

  const productName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown';

  const typeStyle: Record<string, string> = {
    sold: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    cancelled: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    returned: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
    manual: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    restock: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />
      <div
        className="relative ml-auto w-full max-w-lg h-full bg-background border-l border-border overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Activity</p>
            <h3 className="text-lg font-light tracking-wide mt-0.5">Stock Logs</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-transparent border border-border focus:border-primary outline-none"
          >
            <option value="">All products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">No activity yet</p>
            )}
            {logs.map(log => (
              <div key={log.id} className="border border-border p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest border rounded-full ${typeStyle[log.change_type] || 'bg-muted text-foreground border-border'}`}>
                      {log.change_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-medium truncate">{productName(log.product_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Size <span className="text-foreground font-medium">{log.size}</span>
                    {log.notes && <> · {log.notes}</>}
                  </p>
                </div>
                <span className={`text-base font-light ${log.quantity > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStockManagement;
