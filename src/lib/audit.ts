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
