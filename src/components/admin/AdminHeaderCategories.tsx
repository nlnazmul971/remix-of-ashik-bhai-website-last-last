import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Menu, ChevronDown, ChevronRight } from 'lucide-react';

type HeaderCat = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

type Sub = {
  id: string;
  parent_category: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

const emptyHeader = { name: '', slug: '', sort_order: 0, is_active: true };
const emptySub = { parent_category: '', name: '', slug: '', sort_order: 0, is_active: true };

const AdminHeaderCategories = () => {
  const [headers, setHeaders] = useState<HeaderCat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Header form
  const [editingHeader, setEditingHeader] = useState<HeaderCat | null>(null);
  const [headerForm, setHeaderForm] = useState(emptyHeader);
  const [showHeaderForm, setShowHeaderForm] = useState(false);

  // Sub form
  const [editingSub, setEditingSub] = useState<Sub | null>(null);
  const [subForm, setSubForm] = useState(emptySub);
  const [showSubFormFor, setShowSubFormFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: h }, { data: s }] = await Promise.all([
      supabase.from('header_categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
    ]);
    setHeaders((h as HeaderCat[]) || []);
    setSubs((s as Sub[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // ---------- Header CRUD ----------
  const saveHeader = async () => {
    if (!headerForm.name.trim()) { toast.error('Name required'); return; }
    const slug = headerForm.slug ? slugify(headerForm.slug) : headerForm.name.trim();
    try {
      if (editingHeader) {
        const { error } = await supabase.from('header_categories').update({ ...headerForm, slug }).eq('id', editingHeader.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from('header_categories').insert({ ...headerForm, slug });
        if (error) throw error;
        toast.success('Created');
      }
      setHeaderForm(emptyHeader); setEditingHeader(null); setShowHeaderForm(false); load();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const editHeader = (h: HeaderCat) => {
    setEditingHeader(h);
    setHeaderForm({ name: h.name, slug: h.slug, sort_order: h.sort_order, is_active: h.is_active });
    setShowHeaderForm(true);
  };

  const deleteHeader = async (h: HeaderCat) => {
    const childCount = subs.filter(s => s.parent_category === h.slug).length;
    if (!confirm(`Delete "${h.name}"?${childCount ? ` ${childCount} sub-categories will be orphaned.` : ''}`)) return;
    const { error } = await supabase.from('header_categories').delete().eq('id', h.id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  // ---------- Sub CRUD ----------
  const startNewSub = (parentSlug: string) => {
    setEditingSub(null);
    setSubForm({ ...emptySub, parent_category: parentSlug });
    setShowSubFormFor(parentSlug);
    setExpanded(e => ({ ...e, [parentSlug]: true }));
  };

  const saveSub = async () => {
    if (!subForm.name.trim()) { toast.error('Name required'); return; }
    const slug = subForm.slug ? slugify(subForm.slug) : slugify(subForm.name);
    try {
      if (editingSub) {
        const { error } = await supabase.from('subcategories').update({ ...subForm, slug }).eq('id', editingSub.id);
        if (error) throw error;
        toast.success('Updated');
      } else {
        const { error } = await supabase.from('subcategories').insert({ ...subForm, slug });
        if (error) throw error;
        toast.success('Created');
      }
      setSubForm(emptySub); setEditingSub(null); setShowSubFormFor(null); load();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const editSub = (s: Sub) => {
    setEditingSub(s);
    setSubForm({ parent_category: s.parent_category, name: s.name, slug: s.slug, sort_order: s.sort_order, is_active: s.is_active });
    setShowSubFormFor(s.parent_category);
    setExpanded(e => ({ ...e, [s.parent_category]: true }));
  };

  const deleteSub = async (id: string) => {
    if (!confirm('Delete sub-category?')) return;
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };

  const toggleExpand = (slug: string) => setExpanded(e => ({ ...e, [slug]: !e[slug] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex items-center gap-2"><Menu className="h-5 w-5" /> Header Categories</h2>
        <button
          onClick={() => { setHeaderForm(emptyHeader); setEditingHeader(null); setShowHeaderForm(!showHeaderForm); }}
          className="luxury-button-primary text-xs flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add Category
        </button>
      </div>

      {showHeaderForm && (
        <div className="border border-border p-4 space-y-3 bg-secondary/30">
          <p className="text-xs font-medium">{editingHeader ? 'Edit' : 'New'} header category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Display Name *</label>
              <input value={headerForm.name} onChange={e => setHeaderForm({ ...headerForm, name: e.target.value })} placeholder="e.g. Shirt" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category Slug (used to filter products)</label>
              <input value={headerForm.slug} onChange={e => setHeaderForm({ ...headerForm, slug: e.target.value })} placeholder="e.g. Shirts" className="luxury-input" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sort Order</label>
              <input type="number" value={headerForm.sort_order} onChange={e => setHeaderForm({ ...headerForm, sort_order: Number(e.target.value) })} className="luxury-input" />
            </div>
            <label className="flex items-center gap-2 text-xs mt-5">
              <input type="checkbox" checked={headerForm.is_active} onChange={e => setHeaderForm({ ...headerForm, is_active: e.target.checked })} /> Active
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={saveHeader} className="luxury-button-primary text-xs">Save</button>
            <button onClick={() => { setShowHeaderForm(false); setEditingHeader(null); setHeaderForm(emptyHeader); }} className="luxury-button-outline text-xs">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="border border-border divide-y divide-border">
          {headers.length === 0 && <p className="p-4 text-sm text-muted-foreground">No header categories yet.</p>}
          {headers.map(h => {
            const childSubs = subs.filter(s => s.parent_category === h.slug);
            const isExpanded = expanded[h.slug] ?? true;
            return (
              <div key={h.id}>
                <div className="flex items-center justify-between p-3 bg-background">
                  <button onClick={() => toggleExpand(h.slug)} className="flex items-center gap-2 text-left flex-1">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{h.name} {!h.is_active && <span className="text-[10px] text-muted-foreground">(hidden)</span>}</p>
                      <p className="text-[11px] text-muted-foreground">slug: {h.slug} · order: {h.sort_order} · {childSubs.length} sub-categories</p>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => startNewSub(h.slug)} className="px-2 py-1 text-[11px] hover:bg-muted rounded flex items-center gap-1"><Plus className="h-3 w-3" /> Sub</button>
                    <button onClick={() => editHeader(h)} className="p-1.5 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteHeader(h)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-secondary/20 pl-8">
                    {showSubFormFor === h.slug && (
                      <div className="border-l-2 border-primary/40 p-3 space-y-3 bg-background m-2">
                        <p className="text-xs font-medium">{editingSub ? 'Edit' : 'New'} sub-category in {h.name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                            <input value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} placeholder="e.g. Casual Shirt" className="luxury-input" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Slug (optional)</label>
                            <input value={subForm.slug} onChange={e => setSubForm({ ...subForm, slug: e.target.value })} placeholder="auto from name" className="luxury-input" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Sort Order</label>
                            <input type="number" value={subForm.sort_order} onChange={e => setSubForm({ ...subForm, sort_order: Number(e.target.value) })} className="luxury-input" />
                          </div>
                          <label className="flex items-center gap-2 text-xs mt-5">
                            <input type="checkbox" checked={subForm.is_active} onChange={e => setSubForm({ ...subForm, is_active: e.target.checked })} /> Active
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveSub} className="luxury-button-primary text-xs">Save</button>
                          <button onClick={() => { setShowSubFormFor(null); setEditingSub(null); setSubForm(emptySub); }} className="luxury-button-outline text-xs">Cancel</button>
                        </div>
                      </div>
                    )}
                    {childSubs.length === 0 && showSubFormFor !== h.slug && (
                      <p className="px-3 py-2 text-[11px] text-muted-foreground">No sub-categories.</p>
                    )}
                    {childSubs.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 border-l-2 border-border ml-2 bg-background/50 my-1">
                        <div>
                          <p className="text-xs font-medium">{s.name} {!s.is_active && <span className="text-[10px] text-muted-foreground">(hidden)</span>}</p>
                          <p className="text-[10px] text-muted-foreground">slug: {s.slug} · order: {s.sort_order}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => editSub(s)} className="p-1.5 hover:bg-muted rounded"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => deleteSub(s.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHeaderCategories;
