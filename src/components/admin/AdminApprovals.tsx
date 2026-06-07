import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, XCircle, Clock, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { logAction } from '@/lib/audit';

type ApprovalRow = {
  id: string;
  requested_by: string | null;
  requester_email: string | null;
  entity_type: string;
  entity_id: string | null;
  action: 'create' | 'update' | 'delete';
  payload: any;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const statusTone: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const AdminApprovals = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['approval_requests', filter],
    queryFn: async () => {
      let q = supabase.from('approval_requests').select('*').order('created_at', { ascending: false }).limit(300);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ApprovalRow[];
    },
  });

  const applyChange = async (r: ApprovalRow): Promise<{ ok: boolean; msg?: string }> => {
    try {
      if (r.action === 'delete') {
        const { error } = await supabase.from(r.entity_type as any).delete().eq('id', r.entity_id);
        if (error) return { ok: false, msg: error.message };
      } else if (r.action === 'update') {
        const { error } = await supabase.from(r.entity_type as any).update(r.payload).eq('id', r.entity_id);
        if (error) return { ok: false, msg: error.message };
      } else if (r.action === 'create') {
        const { error } = await supabase.from(r.entity_type as any).insert(r.payload);
        if (error) return { ok: false, msg: error.message };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, msg: e.message };
    }
  };

  const decide = async (r: ApprovalRow, approve: boolean) => {
    if (approve) {
      const res = await applyChange(r);
      if (!res.ok) { toast.error('Apply failed: ' + res.msg); return; }
    }
    const { error } = await supabase
      .from('approval_requests')
      .update({
        status: approve ? 'approved' : 'rejected',
        reviewed_by: user?.uid,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    await logAction({
      entityType: r.entity_type,
      entityId: r.entity_id ?? undefined,
      action: approve ? 'approved' : 'rejected',
      summary: `${approve ? 'Approved' : 'Rejected'} ${r.action} request by ${r.requester_email || 'moderator'}`,
      details: { request_id: r.id, payload: r.payload },
    });
    toast.success(approve ? 'Approved & applied' : 'Rejected');
    qc.invalidateQueries({ queryKey: ['approval_requests'] });
    qc.invalidateQueries({ queryKey: ['approval-requests-pending-count'] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-wide flex items-center gap-2">
          <ShieldCheck size={20} /> Approvals
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Moderator change requests awaiting admin review</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
              filter === f ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No requests</p>
        )}
        {rows.map(r => (
          <div key={r.id} className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border rounded-full ${statusTone[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest border border-border rounded-full px-2 py-0.5">
                    {r.action}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
                    {r.entity_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User size={11} />{r.requester_email || 'unknown'}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{new Date(r.created_at).toLocaleString()}</span>
                  {r.entity_id && <span className="font-mono opacity-60">#{r.entity_id.slice(0, 8)}</span>}
                </div>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => decide(r, false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs uppercase tracking-widest border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                  <button
                    onClick={() => decide(r, true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                </div>
              )}
            </div>
            {r.reason && <p className="text-xs text-muted-foreground italic">Note: {r.reason}</p>}
            {r.payload && (
              <details className="text-[11px]">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View payload</summary>
                <pre className="mt-2 p-3 bg-muted/50 rounded overflow-auto max-h-60 text-[10px]">{JSON.stringify(r.payload, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovals;
