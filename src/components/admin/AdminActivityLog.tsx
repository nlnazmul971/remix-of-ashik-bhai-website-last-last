import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Search, User, Clock } from 'lucide-react';

type LogRow = {
  id: string;
  actor_email: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string | null;
  created_at: string;
};

const actionTone: Record<string, string> = {
  created: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  updated: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  status_change: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  deleted: 'bg-destructive/10 text-destructive border-destructive/20',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const AdminActivityLog = ({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) => {
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('all');

  const openEntity = (l: LogRow) => {
    if (!l.entity_id) return;
    if (l.entity_type === 'order') {
      sessionStorage.setItem('focusOrderId', l.entity_id);
      onNavigate?.('orders');
    }
  };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['action_logs', entity],
    queryFn: async () => {
      let q = supabase.from('action_logs').select('*').order('created_at', { ascending: false }).limit(500);
      if (entity !== 'all') q = q.eq('entity_type', entity);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as LogRow[];
    },
  });

  const filtered = logs.filter(l => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.actor_email?.toLowerCase().includes(s) ||
      l.entity_type.toLowerCase().includes(s) ||
      l.summary?.toLowerCase().includes(s) ||
      l.entity_id?.toLowerCase().includes(s)
    );
  });

  const entityTypes = Array.from(new Set(logs.map(l => l.entity_type)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-wide flex items-center gap-2">
          <Activity size={20} /> Activity Log
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Every action taken in the admin panel</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, entity, summary…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-transparent border border-border focus:border-primary outline-none"
          />
        </div>
        <select
          value={entity}
          onChange={e => setEntity(e.target.value)}
          className="px-3 py-2.5 text-sm bg-transparent border border-border focus:border-primary outline-none"
        >
          <option value="all">All entities</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="border border-border bg-card divide-y divide-border">
        {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No activity yet</div>
        )}
        {filtered.map(l => {
          const clickable = l.entity_type === 'order' && !!l.entity_id;
          return (
          <div
            key={l.id}
            onClick={clickable ? () => openEntity(l) : undefined}
            className={`p-4 flex items-start gap-3 transition-colors ${clickable ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30'}`}
            title={clickable ? 'Open order' : undefined}
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border rounded-full ${actionTone[l.action] || 'bg-muted text-foreground border-border'}`}>
                  {l.action}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {l.entity_type}
                </span>
                {l.actor_role && (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {l.actor_role}
                  </span>
                )}
                {clickable && (
                  <span className="text-[10px] uppercase tracking-widest text-primary ml-auto">Open →</span>
                )}
              </div>
              <p className="text-sm">{l.summary || <span className="text-muted-foreground italic">No summary</span>}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><User size={11} />{l.actor_email || 'unknown'}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{new Date(l.created_at).toLocaleString()}</span>
                {l.entity_id && <span className="font-mono opacity-60 truncate max-w-[160px]">#{l.entity_id.slice(0, 8)}</span>}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActivityLog;
