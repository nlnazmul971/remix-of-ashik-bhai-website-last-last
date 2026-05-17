import { useMemo } from 'react';
import { useOrders } from '@/hooks/useSupabase';
import { Package } from 'lucide-react';

const AdminPackaging = () => {
  const { data: orders = [] } = useOrders();

  const processingSummary = useMemo(() => {
    const processingOrders = orders.filter(o => o.status === 'Processing');
    const summary: Record<string, Record<string, number>> = {};
    processingOrders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const name = item.name || 'Unknown';
        const size = item.size || 'N/A';
        const qty = item.quantity || 1;
        if (!summary[name]) summary[name] = {};
        summary[name][size] = (summary[name][size] || 0) + qty;
      });
    });
    return summary;
  }, [orders]);

  const processingOrderCount = orders.filter(o => o.status === 'Processing').length;
  const totalPcs = Object.values(processingSummary).reduce(
    (s, sizes) => s + Object.values(sizes).reduce((a, b) => a + b, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-light tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Packaging Summary
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">
          Processing orders — products & sizes to pack
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-xl p-4 bg-gradient-to-br from-primary/5 to-transparent">
          <p className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase font-semibold">Processing Orders</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{processingOrderCount}</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-gradient-to-br from-[#22C5A0]/5 to-transparent">
          <p className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase font-semibold">Total Pieces to Pack</p>
          <p className="text-2xl font-bold tracking-tight mt-1">{totalPcs} <span className="text-xs font-normal text-muted-foreground">pcs</span></p>
        </div>
      </div>

      {/* Products grid */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-primary" />
          <span className="text-sm font-medium">📦 Products to Pack</span>
        </div>
        {Object.keys(processingSummary).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">কোনো processing order নেই 🎉</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(processingSummary).map(([productName, sizes]) => {
              const totalQty = Object.values(sizes).reduce((s, q) => s + q, 0);
              return (
                <div key={productName} className="border border-border rounded-lg p-3 bg-gradient-to-br from-primary/5 to-transparent">
                  <h4 className="text-sm font-semibold truncate mb-2" title={productName}>{productName}</h4>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(sizes).sort(([a], [b]) => {
                      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
                      return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
                    }).map(([size, qty]) => (
                      <span key={size} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                        {size}: <span className="text-foreground">{qty}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Total: {totalQty} pcs</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPackaging;
