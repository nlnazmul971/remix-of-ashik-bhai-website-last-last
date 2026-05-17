import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';

type Sub = {
  id: string;
  parent_category: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

const PARENTS = ['Shirts', 'T-Shirt', 'Panjabi', 'Pant'];

const empty = { parent_category: 'Shirts', name: '', slug: '', sort_order: 0, is_active: true };

const AdminSubcategories = () => {
  const [items, setItems] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Sub | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('subcategories').select('*').order('parent_category').order('sort_order');
    setItems((data as Sub[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    const slug = (form.slug || form.name).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      if (editing) {
        const { error } = await supabase.from('subcategories').update({ ...form, slug }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from('subcategories').insert({ ...form, slug });
        if (error) throw error;
        toast.success('Created');
      }
      setForm(empty); setEditing(null); setShowForm(false); load();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const handleEdit = (s: Sub) => {
    setEditing(s);
    setForm({ parent_category: s.parent_category, name: s.name, slug: s.slug, sort_order: s.sort_order, is_active: s.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center gap-2"><Layers className="h-5 w-5" /> Sub-categories</h2>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }} className="luxury-button-primary text-xs flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {showForm && (
        <div className="border border-border p-4 space-y-3 bg-secondary/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Parent Category</label>
              <select value={form.parent_category} onChange={e => setForm({ ...form, parent_category: e.target.value })} className="luxury-input">
                {PARENTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Casual Shirt" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Slug (optional)</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="luxury-input" />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="luxury-button-primary text-xs">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }} className="luxury-button-outline text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="border border-border divide-y divide-border">
          {items.length === 0 && <p className="p-4 text-sm text-muted-foreground">No sub-categories yet.</p>}
          {items.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{s.name} <span className="text-xs text-muted-foreground">/ {s.parent_category}</span></p>
                <p className="text-[11px] text-muted-foreground">slug: {s.slug} · order: {s.sort_order} · {s.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSubcategories;
