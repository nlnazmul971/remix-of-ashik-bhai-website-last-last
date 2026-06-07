import { useState, useEffect, useMemo, useRef } from 'react';
import { useProducts, useDeleteProduct, useUpdateProduct, useCreateProduct, useProductImages, useAddProductImage, useDeleteProductImage, useAllSizeStock } from '@/hooks/useSupabase';
import { Product, getProductImage } from '@/data/products';
import { Edit, Trash2, Plus, Search, X, Upload, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const AdminProducts = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const { data: products = [] } = useProducts(undefined, search || undefined, undefined, true);
  const { data: allSizeStock = [] } = useAllSizeStock();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copyChartOpen, setCopyChartOpen] = useState(false);

  const computedStock = (productId: string, fallback: number) => {
    const stocks = allSizeStock.filter(s => s.product_id === productId);
    if (stocks.length === 0) return fallback;
    return stocks.reduce((sum, s) => sum + (s.total_stock - s.sold_count + s.cancelled_count + s.returned_count), 0);
  };

  // Unique categories & subcategories derived from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.subcategory && (categoryFilter === 'all' || p.category === categoryFilter)) {
        set.add(p.subcategory);
      }
    });
    return Array.from(set).sort();
  }, [products, categoryFilter]);

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && p.subcategory !== subcategoryFilter) return false;
      return true;
    });
  }, [products, categoryFilter, subcategoryFilter]);

  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Stats
  const stats = useMemo(() => {
    let totalStock = 0, lowStock = 0, outStock = 0, featured = 0, newDrops = 0;
    products.forEach((p: any) => {
      const s = computedStock(p.id, p.stock);
      totalStock += s;
      if (s <= 0) outStock += 1;
      else if (s < 5) lowStock += 1;
      if (p.featured) featured += 1;
      if (p.is_new_drop) newDrops += 1;
    });
    return { totalStock, lowStock, outStock, featured, newDrops };
  }, [products, allSizeStock]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide">Products</h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">Manage your catalog · {products.length} products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCopyChartOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest border border-border hover:bg-muted transition-colors">
            <Copy size={13} /> Copy Size Chart
          </button>
          <button onClick={() => { setShowAddForm(true); setEditingProduct({ id: '', name: '', price: 0, original_price: null, image_url: '', category: 'T-Shirt', description: '', sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'Black', hex: '#1a1a1a' }], stock: 0, featured: false, is_new_drop: false, is_active: true, brand: '', sku: '', size_chart: [], created_at: '', updated_at: '' } as any); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Total Stock" value={stats.totalStock} tone="emerald" />
        <StatCard label="Low Stock" value={stats.lowStock} tone="amber" />
        <StatCard label="Out of Stock" value={stats.outStock} tone="destructive" />
        <StatCard label="Featured / New" value={`${stats.featured} / ${stats.newDrops}`} tone="primary" />
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full pl-11 pr-4 py-3 text-sm bg-transparent border border-border focus:border-primary outline-none transition-colors tracking-wide"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setSubcategoryFilter('all'); }}
          className="px-4 py-3 text-xs bg-transparent border border-border focus:border-primary outline-none transition-colors tracking-wide cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={subcategoryFilter}
          onChange={e => setSubcategoryFilter(e.target.value)}
          disabled={subcategories.length === 0}
          className="px-4 py-3 text-xs bg-transparent border border-border focus:border-primary outline-none transition-colors tracking-wide cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="all">All Subcategories</option>
          {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
          <button
            onClick={() => { setCategoryFilter('all'); setSubcategoryFilter('all'); }}
            className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
        <div className="flex border border-border">
          {(['grid', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-3 text-[10px] uppercase tracking-widest transition-colors ${view === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {copyChartOpen && (
        <CopySizeChartModal products={products} onClose={() => setCopyChartOpen(false)} />
      )}

      {editingProduct && (
        <ProductForm product={editingProduct} isNew={showAddForm} onSave={async (p) => {
          try {
            if (showAddForm) {
              const { id, created_at, updated_at, ...rest } = p;
              const result = await createProduct.mutateAsync(rest);
              toast.success('Product added');
              return result;
            } else {
              await updateProduct.mutateAsync(p);
              toast.success('Product updated');
              return p;
            }
          } catch (err: any) { toast.error(err.message); return null; }
        }} onCancel={() => { setEditingProduct(null); setShowAddForm(false); }}
        onDone={() => { setEditingProduct(null); setShowAddForm(false); }} />
      )}

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <ImageIcon size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">কোনো product পাওয়া যায়নি</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const st = computedStock(p.id, p.stock);
            const colors = Array.isArray(p.colors) ? (p.colors as any[]) : [];
            const discount = p.original_price && p.original_price > p.price
              ? Math.round((1 - p.price / p.original_price) * 100)
              : 0;
            const isInactive = (p as any).is_active === false;
            return (
              <div
                key={p.id}
                onClick={() => { setEditingProduct(p); setShowAddForm(false); }}
                className={`group relative cursor-pointer bg-card border hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col ${
                  isInactive ? 'border-dashed border-muted-foreground/30 opacity-70' : 'border-border hover:border-foreground/40'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted/40 to-muted/10">
                  <img
                    src={getProductImage(p.image_url, 200)}
                    alt={p.name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isInactive ? 'grayscale' : ''}`}
                  />
                  {isInactive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-destructive/90 text-destructive-foreground text-[10px] uppercase tracking-widest px-3 py-1.5 font-bold shadow-lg backdrop-blur-sm">
                        Hidden
                      </span>
                    </div>
                  )}

                  {/* Top-left badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-1 tracking-wider shadow-md">
                        -{discount}%
                      </span>
                    )}
                    {(p as any).is_new_drop && (
                      <span className="bg-foreground text-background text-[9px] font-bold px-2 py-1 tracking-widest uppercase shadow-md">
                        New
                      </span>
                    )}
                  </div>

                  {/* featured star removed */}


                  <span
                    className={`absolute bottom-2 left-2 px-2 py-1 text-[9px] uppercase tracking-widest font-medium backdrop-blur-md shadow-sm ${
                      st <= 0
                        ? 'bg-destructive/90 text-destructive-foreground'
                        : st < 5
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-background/85 text-foreground'
                    }`}
                  >
                    {st <= 0 ? 'Out of stock' : `${st} in stock`}
                  </span>

                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center gap-2 pb-3 pointer-events-none">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setShowAddForm(false); }}
                      className="pointer-events-auto px-3 py-2 bg-background text-foreground text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5"
                    >
                      <Edit size={11} /> Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this product?')) { await deleteProduct.mutateAsync(p.id); toast.success('Deleted'); }
                      }}
                      className="pointer-events-auto p-2 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
                  <p className="font-medium text-sm tracking-wide line-clamp-2 mt-1 min-h-[2.5em]">{p.name}</p>

                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-medium">৳{p.price.toLocaleString()}</span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through">৳{p.original_price.toLocaleString()}</span>
                      )}
                    </div>
                    {/* color swatches removed */}

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updateProduct.mutateAsync({ id: p.id, is_active: isInactive ? true : false } as any);
                        toast.success(isInactive ? 'Product activated ✓' : 'Product hidden from store');
                      }}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full transition-all ${
                        isInactive
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                      }`}
                      title={isInactive ? 'Click to activate' : 'Click to hide'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-destructive' : 'bg-emerald-500 animate-pulse'}`} />
                      {isInactive ? 'Hidden' : 'Active'}
                    </button>

                  </div>

                  {p.sku && (
                    <p className="text-[9px] text-muted-foreground/70 font-mono mt-2 truncate">{p.sku}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border divide-y divide-border bg-card">
          {filtered.map(p => {
            const st = computedStock(p.id, p.stock);
            const stockTone = st <= 0 ? 'text-destructive' : st < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
            return (
              <div
                key={p.id}
                onClick={() => { setEditingProduct(p); setShowAddForm(false); }}
                className="group flex items-center gap-4 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <img src={getProductImage(p.image_url, 200)} alt={p.name} className="w-14 h-16 object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm tracking-wide truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                    {p.category}{p.sku ? <> · <span className="font-mono">{p.sku}</span></> : null}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  {p.featured && <span className="text-amber-500" title="Featured">★</span>}
                  {(p as any).is_new_drop && <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-widest bg-primary/10 text-primary rounded-full">New</span>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">৳{p.price.toLocaleString()}</p>
                  <p className={`text-[10px] uppercase tracking-widest ${stockTone}`}>{st} stock</p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setShowAddForm(false); }} className="p-2 hover:bg-muted transition-colors"><Edit size={13} /></button>
                  <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete this product?')) { await deleteProduct.mutateAsync(p.id); toast.success('Deleted'); } }} className="p-2 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: number | string; tone?: 'emerald' | 'amber' | 'destructive' | 'primary' }) => {
  const t = tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'amber' ? 'text-amber-600 dark:text-amber-400'
    : tone === 'destructive' ? 'text-destructive'
    : tone === 'primary' ? 'text-primary'
    : 'text-foreground';
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-light mt-2 ${t}`}>{value}</p>
    </div>
  );
};

const CopySizeChartModal = ({ products, onClose }: { products: Product[]; onClose: () => void }) => {
  const [sourceId, setSourceId] = useState('');
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const updateProduct = useUpdateProduct();

  const parseChart = (sc: any): any[] => {
    if (!sc) return [];
    if (Array.isArray(sc)) return sc;
    if (typeof sc === 'string') { try { const p = JSON.parse(sc); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };

  const sourcesWithChart = products.filter(p => parseChart(p.size_chart).length > 0);
  const source = products.find(p => p.id === sourceId);
  const sourceChart = parseChart(source?.size_chart);
  const targetCandidates = products
    .filter(p => p.id !== sourceId)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    const next = new Set(targetIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setTargetIds(next);
  };

  const toggleAll = () => {
    if (targetIds.size === targetCandidates.length) setTargetIds(new Set());
    else setTargetIds(new Set(targetCandidates.map(p => p.id)));
  };

  const apply = async () => {
    if (!sourceId) { toast.error('Source product select করুন'); return; }
    if (sourceChart.length === 0) { toast.error('Source product এ valid size chart নেই'); return; }
    if (targetIds.size === 0) { toast.error('কমপক্ষে একটি product select করুন'); return; }
    setSaving(true);
    try {
      let success = 0;
      let failed = 0;
      for (const id of targetIds) {
        try {
          await updateProduct.mutateAsync({ id, size_chart: sourceChart } as any);
          success++;
        } catch (e) {
          console.error('Copy failed for', id, e);
          failed++;
        }
      }
      if (success > 0) toast.success(`${success} product এ size chart copy হয়েছে${failed ? ` (${failed} failed)` : ''}`);
      if (success === 0) toast.error('কোনো product update হয়নি');
      if (success > 0) onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border max-w-2xl w-full max-h-[85vh] overflow-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium tracking-wide">Copy Size Chart to Multiple Products</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent"><X size={16} /></button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground tracking-wider uppercase">Source Product (যেটার size chart নিবেন)</label>
          <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="luxury-input">
            <option value="">-- Select source product --</option>
            {sourcesWithChart.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({parseChart(p.size_chart).length} rows)</option>
            ))}
          </select>
          {sourcesWithChart.length === 0 && (
            <p className="text-xs text-destructive">কোনো product এ size chart নেই। আগে একটিতে size chart বানিয়ে নিন।</p>
          )}
        </div>

        {sourceId && sourceChart.length > 0 && (
          <div className="border border-border p-2 max-h-32 overflow-auto">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Preview</p>
            <table className="w-full text-[11px]">
              <thead><tr>{Object.keys(sourceChart[0]).map(c => <th key={c} className="text-left px-1.5 py-0.5 font-medium">{c}</th>)}</tr></thead>
              <tbody>{sourceChart.map((r: any, i: number) => (
                <tr key={i}>{Object.keys(sourceChart[0]).map(c => <td key={c} className="px-1.5 py-0.5">{r[c]}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground tracking-wider uppercase">Target Products ({targetIds.size} selected)</label>
            <button onClick={toggleAll} className="text-[10px] text-primary hover:underline">
              {targetIds.size === targetCandidates.length ? 'Unselect all' : 'Select all'}
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="luxury-input text-xs" />
          <div className="border border-border max-h-64 overflow-auto">
            {targetCandidates.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs border-b border-border last:border-0 hover:bg-muted/30 ${targetIds.has(p.id) ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-4 h-4 border flex items-center justify-center ${targetIds.has(p.id) ? 'bg-primary border-primary' : 'border-border'}`}>
                  {targetIds.has(p.id) && <Check size={10} className="text-primary-foreground" />}
                </div>
                <img src={getProductImage(p.image_url, 200)} alt="" className="w-8 h-10 object-cover" />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {parseChart(p.size_chart).length > 0 ? `${parseChart(p.size_chart).length} rows (will overwrite)` : 'no chart'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="luxury-button-outline text-[10px]">Cancel</button>
          <button onClick={apply} disabled={saving || !sourceId || targetIds.size === 0} className="luxury-button-primary text-[10px] disabled:opacity-50">
            {saving ? 'Copying...' : `Copy to ${targetIds.size} product(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const GalleryUpload = ({ gallery, onChange }: { gallery: string[]; onChange: (g: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > 25 * 1024 * 1024) { toast.error(`${file.name}: max 25MB`); continue; }
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) { toast.error(error.message); continue; }
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        newUrls.push(publicUrl);
        setProgress({ done: i + 1, total: files.length });
      }
      if (newUrls.length > 0) {
        onChange([...gallery, ...newUrls]);
        toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} added ✓`);
      }
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(gallery.filter((_, i) => i !== idx));
  const makeMain = (idx: number) => {
    if (idx === 0) return;
    const next = [...gallery];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
        className={`relative w-full min-h-[120px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : uploading ? 'border-primary/50 bg-muted/20' : 'border-border hover:border-foreground/40 hover:bg-muted/20'}`}
      >
        {uploading ? (
          <>
            <Upload size={20} className="text-primary animate-pulse mb-2" />
            <p className="text-xs">Uploading {progress.done} of {progress.total}…</p>
          </>
        ) : (
          <>
            <ImageIcon size={20} className="text-muted-foreground mb-2" />
            <p className="text-sm">Drag & drop or click to upload (multiple)</p>
            <p className="text-[10px] text-muted-foreground mt-1">JPG · PNG · WEBP · max 25MB · select many at once</p>
          </>
        )}
      </div>

      {gallery.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {gallery.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative group border border-border bg-muted/20 aspect-[3/4] overflow-hidden">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-foreground text-background text-[8px] uppercase tracking-widest px-1.5 py-0.5">Main</span>
              )}
              <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx !== 0 && (
                  <button type="button" onClick={() => makeMain(idx)} className="px-2 py-1 bg-background text-foreground text-[9px] uppercase tracking-widest hover:bg-foreground hover:text-background" title="Set as main">★</button>
                )}
                <button type="button" onClick={() => remove(idx)} className="p-1.5 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground" title="Remove">
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SizeChartEditor = ({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) => {
  const safeValue = Array.isArray(value) ? value : [];
  
  const [columns, setColumns] = useState<string[]>(() => {
    if (safeValue.length > 0) return Object.keys(safeValue[0]);
    return ['Size', 'Chest (inch)', 'Length (inch)', 'Shoulder (inch)'];
  });
  const [rows, setRows] = useState<Record<string, string>[]>(safeValue);
  const [newCol, setNewCol] = useState('');

  useEffect(() => {
    if (Array.isArray(value)) {
      setRows(value);
      if (value.length > 0) {
        setColumns(Object.keys(value[0]));
      }
    }
  }, [value]);

  const addRow = () => {
    const row: Record<string, string> = {};
    columns.forEach(c => row[c] = '');
    const updated = [...rows, row];
    setRows(updated);
    onChange(updated);
  };

  const removeRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    onChange(updated);
  };

  const updateCell = (rowIdx: number, col: string, val: string) => {
    const updated = rows.map((r, i) => i === rowIdx ? { ...r, [col]: val } : r);
    setRows(updated);
    onChange(updated);
  };

  const addColumn = () => {
    if (!newCol.trim()) return;
    const col = newCol.trim();
    setColumns([...columns, col]);
    const updated = rows.map(r => ({ ...r, [col]: '' }));
    setRows(updated);
    onChange(updated);
    setNewCol('');
  };

  const removeColumn = (col: string) => {
    const newCols = columns.filter(c => c !== col);
    setColumns(newCols);
    const updated = rows.map(r => {
      const { [col]: _, ...rest } = r;
      return rest;
    });
    setRows(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs text-muted-foreground tracking-wider uppercase">Size Chart</label>
      
      {columns.length > 0 && (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                {columns.map(col => (
                  <th key={col} className="px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="flex items-center gap-1">
                      {col}
                      <button onClick={() => removeColumn(col)} className="text-destructive hover:text-destructive/80 ml-1"><X size={10} /></button>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-1.5 border-b border-border w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map(col => (
                    <td key={col} className="px-1 py-1">
                      <input
                        value={row[col] || ''}
                        onChange={e => updateCell(i, col, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-foreground/30 outline-none"
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <button onClick={() => removeRow(i)} className="p-1 text-destructive hover:text-destructive/80"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="luxury-button-outline text-[10px] py-1.5 px-3 inline-flex items-center gap-1">
          <Plus size={12} /> Add Row
        </button>
        <div className="flex items-center gap-1">
          <input
            value={newCol}
            onChange={e => setNewCol(e.target.value)}
            placeholder="Column name"
            className="luxury-input text-[10px] py-1.5 px-2 w-28"
            onKeyDown={e => e.key === 'Enter' && addColumn()}
          />
          <button type="button" onClick={addColumn} className="luxury-button-outline text-[10px] py-1.5 px-2">
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm = ({ product, isNew, onSave, onCancel, onDone }: { product: Product; isNew: boolean; onSave: (p: Product) => Promise<any>; onCancel: () => void; onDone: () => void }) => {
  const parseSizeChart = (sc: any): any[] => {
    if (!sc) return [];
    if (Array.isArray(sc)) return sc;
    if (typeof sc === 'string') {
      try { const p = JSON.parse(sc); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  };
  const [form, setForm] = useState({
    ...product,
    size_chart: parseSizeChart(product.size_chart)
  });
  const [savedProductId, setSavedProductId] = useState(isNew ? '' : product.id);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; parent_category: string; name: string; slug: string }>>([]);
  const [headerCategories, setHeaderCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [existingSizeStocks, setExistingSizeStocks] = useState<Record<string, { id: string; total_stock: number }>>({});
  const [gallery, setGallery] = useState<string[]>(product.image_url ? [product.image_url] : []);
  const [originalExtras, setOriginalExtras] = useState<Array<{ id: string; image_url: string }>>([]);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.from('subcategories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setSubcategories((data as any) || []));
    supabase.from('header_categories').select('id, name, slug').eq('is_active', true).order('sort_order')
      .then(({ data }) => setHeaderCategories((data as any) || []));
  }, []);


  // Load existing per-size stock + extra images for this product
  useEffect(() => {
    const pid = savedProductId || (!isNew ? product.id : '');
    if (!pid) return;
    supabase.from('product_size_stock').select('id, size, total_stock').eq('product_id', pid).then(({ data }) => {
      const ex: Record<string, { id: string; total_stock: number }> = {};
      const stocks: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        ex[r.size] = { id: r.id, total_stock: r.total_stock };
        stocks[r.size] = r.total_stock;
      });
      setExistingSizeStocks(ex);
      setSizeStocks(stocks);
    });
    supabase.from('product_images').select('id, image_url, sort_order').eq('product_id', pid).order('sort_order').then(({ data }) => {
      const extras = (data || []) as any[];
      setOriginalExtras(extras.map(e => ({ id: e.id, image_url: e.image_url })));
      setGallery(g => {
        const main = g[0] || product.image_url || '';
        const extraUrls = extras.map(e => e.image_url);
        return main ? [main, ...extraUrls] : extraUrls;
      });
    });
  }, [savedProductId, product.id, isNew]);

  const availableSubs = subcategories.filter(s => s.parent_category === form.category);

  const persistSizeStocks = async (productId: string) => {
    for (const size of form.sizes) {
      const qty = sizeStocks[size] ?? 0;
      const ex = existingSizeStocks[size];
      if (ex) {
        if (ex.total_stock === qty) continue;
        await supabase.from('product_size_stock').update({ total_stock: qty } as any).eq('id', ex.id);
        await supabase.from('stock_logs').insert({
          product_id: productId, size, change_type: 'manual',
          quantity: qty - ex.total_stock, notes: `Stock set to ${qty} (from product form)`,
        });
      } else {
        await supabase.from('product_size_stock').insert({ product_id: productId, size, total_stock: qty });
        await supabase.from('stock_logs').insert({
          product_id: productId, size, change_type: 'manual',
          quantity: qty, notes: `Initial stock ${qty} (from product form)`,
        });
      }
    }
    qc.invalidateQueries({ queryKey: ['all-size-stock'] });
    qc.invalidateQueries({ queryKey: ['product-size-stock'] });
  };

  const persistGallery = async (productId: string) => {
    const extras = gallery.slice(1);
    // delete originals not in current extras
    const toDelete = originalExtras.filter(o => !extras.includes(o.image_url));
    for (const d of toDelete) {
      await supabase.from('product_images').delete().eq('id', d.id);
    }
    // insert extras not already in originals
    const existingUrls = originalExtras.map(o => o.image_url);
    for (let i = 0; i < extras.length; i++) {
      const url = extras[i];
      if (!existingUrls.includes(url)) {
        await supabase.from('product_images').insert({ product_id: productId, image_url: url, sort_order: i });
      }
    }
    qc.invalidateQueries({ queryKey: ['product-images', productId] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, image_url: gallery[0] || form.image_url || '' };
      const result = await onSave(payload as Product);
      if (result && result.id) {
        try { await persistSizeStocks(result.id); } catch (e: any) { toast.error('Stock save failed: ' + e.message); }
        try { await persistGallery(result.id); } catch (e: any) { toast.error('Image save failed: ' + e.message); }
        onDone();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-background border border-border shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{isNew ? 'New' : 'Edit'}</p>
            <h3 className="text-lg font-light tracking-wide mt-0.5">{isNew ? 'Add Product' : form.name || 'Edit Product'}</h3>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-8">
          {/* Section: Basic Info */}
          <Section title="Basic Information" subtitle="Product identity and category">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Product Name">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Classic White Tee" className="luxury-input" />
              </Field>
              <Field label="Brand">
                <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Brand Name" className="luxury-input" />
              </Field>
              <Field label="SKU">
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="TSH-BLK-001" className="luxury-input font-mono text-xs" />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subcategory: null })} className="luxury-input">
                  {['T-Shirt', 'Winter', 'Shirts', 'Knit Polos', 'Pant', 'Panjabi', 'Kafsu'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-category" className="sm:col-span-2">
                <select value={form.subcategory || ''} onChange={e => setForm({ ...form, subcategory: e.target.value || null })} className="luxury-input" disabled={availableSubs.length === 0}>
                  <option value="">{availableSubs.length === 0 ? 'No sub-categories' : '— None —'}</option>
                  {availableSubs.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* Section: Pricing */}
          <Section title="Pricing" subtitle="Selling price and original price">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (৳)">
                <input type="number" value={form.price === 0 ? '' : form.price} onChange={e => setForm({ ...form, price: e.target.value === '' ? 0 : Number(e.target.value) })} placeholder="0" className="luxury-input" />
              </Field>
              <Field label="Original Price (৳)">
                <input type="number" value={form.original_price ?? ''} onChange={e => setForm({ ...form, original_price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="0" className="luxury-input" />
              </Field>
            </div>
            {form.original_price && form.original_price > form.price && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 tracking-wide">
                ✓ {Math.round((1 - form.price / form.original_price) * 100)}% discount will be shown
              </p>
            )}
          </Section>

          {/* Section: Sizes & Stock */}
          <Section title="Sizes & Stock" subtitle="Select preset or type any custom size (e.g. 28, 30, Free, 6-12M)">
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    const sizes = form.sizes.includes(size)
                      ? form.sizes.filter(s => s !== size)
                      : [...form.sizes, size];
                    setForm({ ...form, sizes });
                  }}
                  className={`min-w-[44px] px-3 py-2 text-xs uppercase tracking-widest border transition-all ${form.sizes.includes(size) ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}
                >
                  {size}
                </button>
              ))}
              {form.sizes.filter(s => !['XS','S','M','L','XL','XXL','2XL','3XL'].includes(s)).map(size => (
                <span key={size} className="inline-flex items-center gap-1.5 min-w-[44px] px-3 py-2 text-xs uppercase tracking-widest bg-foreground text-background border border-foreground">
                  {size}
                  <button type="button" onClick={() => setForm({ ...form, sizes: form.sizes.filter(s => s !== size) })} className="hover:opacity-70"><X size={11} /></button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ Custom size, press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (e.currentTarget.value || '').trim();
                    if (v && !form.sizes.includes(v)) setForm({ ...form, sizes: [...form.sizes, v] });
                    e.currentTarget.value = '';
                  }
                }}
                className="px-3 py-2 text-xs border border-dashed border-border bg-transparent outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60 min-w-[180px]"
              />
            </div>
            {form.sizes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {form.sizes.map(size => (
                  <div key={size} className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-widest font-medium w-8">{size}</span>
                    <input
                      type="number" min={0}
                      value={sizeStocks[size] ?? ''}
                      onChange={e => setSizeStocks(p => ({ ...p, [size]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      placeholder="0"
                      className="flex-1 text-sm bg-transparent border-0 outline-none w-full text-right font-medium"
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Section: Images */}
          <Section title="Images" subtitle="First image becomes the main · upload many at once">
            <GalleryUpload gallery={gallery} onChange={setGallery} />
            <input value={gallery[0] || ''} onChange={e => setGallery(g => [e.target.value, ...g.slice(1)])} placeholder="Or paste main image URL" className="luxury-input text-xs mt-3" />
          </Section>

          {/* Section: Description */}
          <Section title="Description" subtitle="Product details shown to customers">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Tell customers what makes this product special…" className="luxury-input min-h-[100px]" />
          </Section>

          {/* Section: Size Chart */}
          <Section title="Size Chart" subtitle="Measurement table shown on product page">
            <SizeChartEditor
              value={form.size_chart}
              onChange={(chart) => setForm({ ...form, size_chart: chart })}
            />
          </Section>

          {/* Section: SEO */}
          <Section title="SEO" subtitle="Per-product search engine optimization.">
            <div className="space-y-4">
              <Field label="SEO Slug (URL-friendly, optional)">
                <input
                  value={(form as any).seo_slug || ''}
                  onChange={e => setForm({ ...form, seo_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') } as any)}
                  placeholder="e.g. organic-cotton-baby-onesie"
                  className="luxury-input font-mono text-xs"
                />
              </Field>
              <Field label="Focus Keyword">
                <input
                  value={(form as any).seo_focus_keyword || ''}
                  onChange={e => setForm({ ...form, seo_focus_keyword: e.target.value } as any)}
                  placeholder="e.g. organic baby onesie"
                  className="luxury-input text-xs"
                />
              </Field>
              <Field label="Meta Title (50-60 chars recommended)">
                <input
                  value={(form as any).seo_title || ''}
                  onChange={e => setForm({ ...form, seo_title: e.target.value } as any)}
                  placeholder="Defaults to product name"
                  className="luxury-input text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{((form as any).seo_title || '').length} / 60</p>
              </Field>
              <Field label="Meta Description (140-155 chars)">
                <textarea
                  value={(form as any).seo_description || ''}
                  onChange={e => setForm({ ...form, seo_description: e.target.value } as any)}
                  placeholder="Defaults to product description"
                  className="luxury-input text-xs min-h-[70px]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{((form as any).seo_description || '').length} / 155</p>
              </Field>
              <Field label="Keywords (comma separated)">
                <input
                  value={(form as any).seo_keywords || ''}
                  onChange={e => setForm({ ...form, seo_keywords: e.target.value } as any)}
                  placeholder="keyword1, keyword2, ..."
                  className="luxury-input text-xs"
                />
              </Field>
              <Field label="Canonical URL (optional)">
                <input
                  value={(form as any).seo_canonical || ''}
                  onChange={e => setForm({ ...form, seo_canonical: e.target.value } as any)}
                  placeholder="https://… (leave empty to auto)"
                  className="luxury-input text-xs"
                />
              </Field>
              <Field label="OG Image URL (social share, optional)">
                <input
                  value={(form as any).seo_og_image || ''}
                  onChange={e => setForm({ ...form, seo_og_image: e.target.value } as any)}
                  placeholder="https://… (defaults to product image)"
                  className="luxury-input text-xs"
                />
              </Field>
              <Field label="FAQ (shown on page + Google FAQ rich result)">
                <FaqEditor form={form} setForm={setForm} />
              </Field>
              <label className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-foreground/30 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={!!(form as any).seo_no_index}
                  onChange={e => setForm({ ...form, seo_no_index: e.target.checked } as any)}
                />
                <span className="text-xs">Noindex this product (hide from Google)</span>
              </label>
            </div>
          </Section>

          {/* Section: Visibility */}
          <Section title="Visibility & Status">
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 px-4 py-2.5 border cursor-pointer transition-colors ${form.featured ? 'border-amber-500/40 bg-amber-500/5' : 'border-border hover:border-foreground/30'}`}>
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-amber-500" />
                <span className="text-xs uppercase tracking-widest">★ Featured</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2.5 border cursor-pointer transition-colors ${form.is_new_drop ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-foreground/30'}`}>
                <input type="checkbox" checked={!!form.is_new_drop} onChange={e => setForm({ ...form, is_new_drop: e.target.checked })} className="accent-primary" />
                <span className="text-xs uppercase tracking-widest">New Drop</span>
              </label>
            </div>
          </Section>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-6 py-4 flex gap-2 justify-end">
          <button onClick={onCancel} disabled={saving} className="px-5 py-2.5 text-[10px] uppercase tracking-widest border border-border hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-[10px] uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Saving…' : isNew ? 'Save Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
    <div className="border-t border-border pt-4">{children}</div>
  </div>
);

const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[10px] text-muted-foreground tracking-widest uppercase block">{label}</label>
    {children}
  </div>
);




const FaqEditor = ({ form, setForm }: { form: any; setForm: (v: any) => void }) => {
  const faq: Array<{ q: string; a: string }> = Array.isArray(form.seo_faq) ? form.seo_faq : [];
  const update = (next: any[]) => setForm({ ...form, seo_faq: next });
  return (
    <div className="space-y-2">
      {faq.map((f, i) => (
        <div key={i} className="border border-border rounded p-2 space-y-1.5 bg-muted/20">
          <input
            value={f.q}
            onChange={e => update(faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
            placeholder="Question"
            className="luxury-input text-xs"
          />
          <textarea
            value={f.a}
            onChange={e => update(faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
            placeholder="Answer"
            className="luxury-input text-xs min-h-[50px]"
          />
          <button type="button" onClick={() => update(faq.filter((_, j) => j !== i))} className="text-[10px] text-destructive">Remove</button>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={() => update([...faq, { q: '', a: '' }])}
          className="text-xs px-3 py-1.5 border border-dashed border-border rounded hover:bg-muted"
        >
          + Add FAQ
        </button>
      </div>
    </div>
  );
};

export default AdminProducts;
