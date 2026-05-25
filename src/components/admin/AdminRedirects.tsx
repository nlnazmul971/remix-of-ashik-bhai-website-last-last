import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';

type Redirect = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  hit_count: number;
  last_hit_at: string | null;
  notes: string | null;
};

const AdminRedirects = () => {
  const [rows, setRows] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ from_path: '', to_path: '', status_code: 301, notes: '' });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('redirects' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.from_path.trim() || !draft.to_path.trim()) {
      toast.error('From and To paths are required');
      return;
    }
    const from = draft.from_path.startsWith('/') ? draft.from_path : '/' + draft.from_path;
    const to = draft.to_path.startsWith('/') || draft.to_path.startsWith('http')
      ? draft.to_path : '/' + draft.to_path;
    const { error } = await supabase.from('redirects' as any).insert({
      from_path: from.trim(),
      to_path: to.trim(),
      status_code: draft.status_code,
      notes: draft.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Redirect added');
    setDraft({ from_path: '', to_path: '', status_code: 301, notes: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this redirect?')) return;
    const { error } = await supabase.from('redirects' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('redirects' as any).update({ is_active }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Redirects (301 / 302)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send old or removed URLs to a new destination. Works for old product slugs, deleted pages, marketing links, etc.
        </p>
      </div>

      <div className="border border-border rounded-lg p-4 bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add new redirect</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_120px_auto] gap-2 items-center">
          <input
            value={draft.from_path}
            onChange={e => setDraft({ ...draft, from_path: e.target.value })}
            placeholder="/old-path"
            className="luxury-input text-sm"
          />
          <ArrowRight size={14} className="text-muted-foreground hidden md:block" />
          <input
            value={draft.to_path}
            onChange={e => setDraft({ ...draft, to_path: e.target.value })}
            placeholder="/new-path or https://..."
            className="luxury-input text-sm"
          />
          <select
            value={draft.status_code}
            onChange={e => setDraft({ ...draft, status_code: Number(e.target.value) })}
            className="luxury-input text-sm"
          >
            <option value={301}>301 Permanent</option>
            <option value={302}>302 Temporary</option>
          </select>
          <button onClick={add} className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded hover:opacity-90">
            <Plus size={14} /> Add
          </button>
        </div>
        <input
          value={draft.notes}
          onChange={e => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Optional notes (why this redirect exists)"
          className="luxury-input text-xs mt-2"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
          No redirects yet.
        </p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">From</th>
                <th className="text-left px-3 py-2">To</th>
                <th className="text-center px-3 py-2">Code</th>
                <th className="text-center px-3 py-2">Hits</th>
                <th className="text-center px-3 py-2">Active</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{r.from_path}</td>
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[280px]">{r.to_path}</td>
                  <td className="px-3 py-2 text-center text-xs">{r.status_code}</td>
                  <td className="px-3 py-2 text-center text-xs">{r.hit_count}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      onChange={e => toggle(r.id, e.target.checked)}
                      className="accent-foreground"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(r.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRedirects;
