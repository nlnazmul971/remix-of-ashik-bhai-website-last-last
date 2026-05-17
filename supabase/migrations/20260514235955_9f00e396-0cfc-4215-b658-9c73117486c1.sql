CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_category TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subcategories_parent ON public.subcategories(parent_category);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent_active_order ON public.subcategories(parent_category, is_active, sort_order);

DROP POLICY IF EXISTS "Subcategories viewable by everyone" ON public.subcategories;
DROP POLICY IF EXISTS "Admins can insert subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON public.subcategories;

CREATE POLICY "Subcategories viewable by everyone"
ON public.subcategories
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert subcategories"
ON public.subcategories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update subcategories"
ON public.subcategories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete subcategories"
ON public.subcategories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER update_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';