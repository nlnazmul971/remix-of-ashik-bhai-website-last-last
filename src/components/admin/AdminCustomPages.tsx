import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileImage, Upload, ExternalLink, Copy, Check, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useSupabase';

type Page = {
  id: string;
  slug: string;
  title: string;
  banner_url: string;
  sort_order: number;
  is_active: boolean;
  product_ids: string[];
};

const empty: Omit<Page, 'id'> = { slug: '', title: '', banner_url: '', sort_order: 0, is_active: true, product_ids: [] };

const AdminCustomPages = () => {
  const [items, setItems] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState<Omit<Page, 'id'>>(empty);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('custom_pages').select('*').order('sort_order');
    setItems(((data as any[]) || []).map(p => ({ ...p, product_ids: p.product_ids || [] })) as Page[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, 'custom-pages');
      setForm(f => ({ ...f, banner_url: url }));
      toast.success('Banner uploaded');
    } catch (e: any) { toast.error(e.message || 'Upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    const slug = form.slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) { toast.error('Slug required'); return; }
    if (!form.banner_url) { toast.error('Banner required'); return; }
    try {
      const payload = { ...form, slug };
      if (editing) {
        const { error } = await supabase.from('custom_pages').update(payload as any).eq('id', editing.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from('custom_pages').insert(payload as any);
        if (error) throw error;
        toast.success('Created');
      }
      setForm(empty); setEditing(null); setShowForm(false); load();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const handleEdit = (p: Page) => {
    setEditing(p);
    setForm({ slug: p.slug, title: p.title, banner_url: p.banner_url, sort_order: p.sort_order, is_active: p.is_active, product_ids: p.product_ids || [] });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    const { error } = await supabase.from('custom_pages').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/page/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter(x => x !== id) : [...f.product_ids, id]
    }));
  };

  const filteredProducts = productSearch
    ? products.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center gap-2"><FileImage className="h-5 w-5" /> Custom Pages</h2>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }} className="luxury-button-primary text-xs flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add Page
        </button>
      </div>

      <p className="text-xs text-muted-foreground">Custom page e ekta banner upload korbe ar nicher dik e specific products show korte chaile select korbe. URL: <code>/page/your-slug</code></p>

      {showForm && (
        <div className="border border-border p-4 space-y-3 bg-secondary/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Slug * (URL)</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. eid-sale" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="for browser tab" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sort Order</label>
              <input type="number" value={form.sort_order === 0 ? '' : form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value === '' ? 0 : Number(e.target.value) })} placeholder="0" className="luxury-input" />
            </div>
            <label className="flex items-center gap-2 text-xs mt-5">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Banner / Poster Image *</label>
            {form.banner_url && (
              <div className="mb-2 border border-border p-2 inline-block">
                <img src={form.banner_url} alt="banner" className="max-h-40 w-auto" />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="luxury-button-outline text-xs flex items-center gap-1">
              <Upload className="h-3 w-3" /> {uploading ? 'Uploading...' : (form.banner_url ? 'Replace Image' : 'Upload Image')}
            </button>
          </div>

          {/* Products selector */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs text-muted-foreground block">Products to display ({form.product_ids.length} selected)</label>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="luxury-input text-xs pl-8" />
            </div>
            <div className="border border-border max-h-64 overflow-auto">
              {filteredProducts.length === 0 && <p className="p-3 text-xs text-muted-foreground">No products</p>}
              {filteredProducts.map((p: any) => {
                const selected = form.product_ids.includes(p.id);
                return (
                  <button
                    key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs border-b border-border last:border-0 hover:bg-muted/30 ${selected ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`w-4 h-4 border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selected && <Check size={10} className="text-primary-foreground" />}
                    </div>
                    {p.image_url && <img src={p.image_url} alt="" className="w-8 h-10 object-cover" />}
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">৳{p.price}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">Faka thakle shudhu banner show hobe.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="luxury-button-primary text-xs">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }} className="luxury-button-outline text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="border border-border divide-y divide-border">
          {items.length === 0 && <p className="p-4 text-sm text-muted-foreground">No custom pages yet.</p>}
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              {p.banner_url && <img src={p.banner_url} alt={p.slug} className="w-20 h-14 object-cover border border-border" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title || p.slug}</p>
                <p className="text-[11px] text-muted-foreground truncate">/page/{p.slug} · {p.is_active ? 'Active' : 'Inactive'} · {(p.product_ids || []).length} products</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => copyLink(p.slug)} title="Copy link" className="p-1.5 hover:bg-muted rounded"><Copy className="h-3.5 w-3.5" /></button>
                <a href={`/page/${p.slug}`} target="_blank" rel="noreferrer" title="Open" className="p-1.5 hover:bg-muted rounded"><ExternalLink className="h-3.5 w-3.5" /></a>
                <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCustomPages;
