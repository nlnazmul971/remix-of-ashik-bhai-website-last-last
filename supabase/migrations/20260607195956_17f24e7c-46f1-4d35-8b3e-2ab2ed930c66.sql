
-- 1) Action logs (audit trail)
CREATE TABLE public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,
  entity_type text NOT NULL,         -- e.g. 'order','product','coupon'
  entity_id text,                    -- string to allow non-uuid
  action text NOT NULL,              -- 'created' | 'updated' | 'deleted' | 'status_change' | custom
  summary text,                      -- short human readable
  details jsonb,                     -- old/new or extra metadata
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.action_logs TO authenticated;
GRANT ALL ON public.action_logs TO service_role;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- Any logged-in admin/moderator can insert their own logs
CREATE POLICY "Staff can insert their own logs"
ON public.action_logs FOR INSERT TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
);

-- Admins can see all logs
CREATE POLICY "Admins read all logs"
ON public.action_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- Moderators see only their own logs
CREATE POLICY "Moderators read own logs"
ON public.action_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'moderator') AND actor_id = auth.uid());

CREATE INDEX action_logs_created_idx ON public.action_logs(created_at DESC);
CREATE INDEX action_logs_entity_idx ON public.action_logs(entity_type, entity_id);
CREATE INDEX action_logs_actor_idx ON public.action_logs(actor_id);

-- 2) Approval requests (moderator-submitted changes awaiting admin approval)
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email text,
  entity_type text NOT NULL,        -- table name e.g. 'coupons'
  entity_id text,                   -- nullable for CREATE
  action text NOT NULL,             -- 'create' | 'update' | 'delete'
  payload jsonb,                    -- proposed new values (for create/update) or row snapshot (delete)
  reason text,                      -- optional moderator note
  status text NOT NULL DEFAULT 'pending', -- 'pending'|'approved'|'rejected'
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Moderators can create requests (only their own)
CREATE POLICY "Moderators create requests"
ON public.approval_requests FOR INSERT TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND public.has_role(auth.uid(),'moderator')
);

-- Admins can also create (rare, but allowed)
CREATE POLICY "Admins create requests"
ON public.approval_requests FOR INSERT TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND public.has_role(auth.uid(),'admin')
);

-- Moderators see only their own requests
CREATE POLICY "Moderators read own requests"
ON public.approval_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'moderator') AND requested_by = auth.uid());

-- Admins read all
CREATE POLICY "Admins read all requests"
ON public.approval_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- Only admins can approve/reject (update)
CREATE POLICY "Admins update requests"
ON public.approval_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_approval_requests_updated_at
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX approval_requests_status_idx ON public.approval_requests(status, created_at DESC);
CREATE INDEX approval_requests_requester_idx ON public.approval_requests(requested_by);
