import { supabase } from '@/integrations/supabase/client';

type LogInput = {
  entityType: string;
  entityId?: string | null;
  action: string; // 'created' | 'updated' | 'deleted' | 'status_change' | custom
  summary?: string;
  details?: any;
};

const cache: { uid?: string; email?: string | null; role?: string | null; ts?: number } = {};

async function currentActor() {
  const now = Date.now();
  if (cache.uid && cache.ts && now - cache.ts < 60_000) return cache;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { uid: undefined, email: null, role: null };
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  cache.uid = user.id;
  cache.email = user.email ?? null;
  cache.role = (roleRow as any)?.role ?? null;
  cache.ts = now;
  return cache;
}

export async function logAction(input: LogInput) {
  try {
    const actor = await currentActor();
    if (!actor.uid) return;
    await supabase.from('action_logs').insert({
      actor_id: actor.uid,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: input.entityType,
      entity_id: input.entityId ? String(input.entityId) : null,
      action: input.action,
      summary: input.summary ?? null,
      details: input.details ?? null,
    } as any);
  } catch (e) {
    console.warn('[audit] logAction failed', e);
  }
}

type ApprovalInput = {
  entityType: string;
  entityId?: string | null;
  action: 'create' | 'update' | 'delete';
  payload?: any;
  reason?: string;
};

export async function requestApproval(input: ApprovalInput) {
  const actor = await currentActor();
  if (!actor.uid) throw new Error('Not signed in');
  const { data, error } = await supabase.from('approval_requests').insert({
    requested_by: actor.uid,
    requester_email: actor.email,
    entity_type: input.entityType,
    entity_id: input.entityId ? String(input.entityId) : null,
    action: input.action,
    payload: input.payload ?? null,
    reason: input.reason ?? null,
  } as any).select().single();
  if (error) throw error;
  return data;
}

export function clearActorCache() {
  cache.uid = undefined;
  cache.ts = undefined;
}

export async function getActorRole(): Promise<string | null> {
  const a = await currentActor();
  return a.role ?? null;
}

/**
 * Gate a write behind admin approval.
 * If actor is a moderator: queues an approval request and returns { gated: true }.
 * Otherwise runs the supplied function.
 */
export async function gateWrite<T>(opts: {
  entityType: string;
  entityId?: string | null;
  action: 'create' | 'update' | 'delete';
  payload?: any;
  reason?: string;
  run: () => Promise<T>;
}): Promise<{ gated: boolean; result?: T }> {
  const role = await getActorRole();
  if (role === 'moderator') {
    const { toast } = await import('sonner');
    try {
      await requestApproval({
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        action: opts.action,
        payload: opts.payload,
        reason: opts.reason,
      });
      toast.info('Sent to admin for approval');
    } catch (e: any) {
      const { toast: t } = await import('sonner');
      t.error('Approval request failed: ' + (e?.message || 'unknown'));
      throw e;
    }
    return { gated: true };
  }
  const result = await opts.run();
  return { gated: false, result };
}
