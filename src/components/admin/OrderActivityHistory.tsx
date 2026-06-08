import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { History, User } from 'lucide-react';

interface Props { orderId: string }

const OrderActivityHistory = ({ orderId }: Props) => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['order-activity', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_logs')
        .select('id, actor_email, actor_role, action, summary, details, created_at')
        .eq('entity_type', 'orders')
        .eq('entity_id', orderId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });

  return (
    <div className="border border-border rounded-lg p-3 mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <History size={12} /> Change History
        </span>
        <span className="text-[10px] text-muted-foreground">{rows.length} entries</span>
      </div>
      {isLoading ? (
        <p className="text-[11px] text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">No recorded changes yet.</p>
      ) : (
        <ul className="space-y-1.5 max-h-56 overflow-auto">
          {rows.map((r: any) => (
            <li key={r.id} className="text-[11px] border-b border-border/50 pb-1.5 last:border-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 border border-border rounded-sm text-[9px] uppercase tracking-wider">
                  {r.action}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User size={10} />{r.actor_email || 'unknown'}
                  {r.actor_role && <span className="opacity-60">({r.actor_role})</span>}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              {r.summary && <p className="mt-0.5 text-foreground">{r.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderActivityHistory;
