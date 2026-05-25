
-- Add SEO fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS seo_slug TEXT,
  ADD COLUMN IF NOT EXISTS seo_canonical TEXT,
  ADD COLUMN IF NOT EXISTS seo_og_image TEXT,
  ADD COLUMN IF NOT EXISTS seo_focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_no_index BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_schema JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS products_seo_slug_unique
  ON public.products (seo_slug) WHERE seo_slug IS NOT NULL AND seo_slug <> '';

-- Redirects table
CREATE TABLE IF NOT EXISTS public.redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redirects viewable by everyone"
  ON public.redirects FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert redirects"
  ON public.redirects FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update redirects"
  ON public.redirects FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete redirects"
  ON public.redirects FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_redirects_updated_at
  BEFORE UPDATE ON public.redirects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
