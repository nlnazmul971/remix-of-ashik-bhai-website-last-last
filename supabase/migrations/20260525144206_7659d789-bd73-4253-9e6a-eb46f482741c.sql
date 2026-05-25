CREATE TABLE public.pseo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url_pattern TEXT NOT NULL,
  title_template TEXT NOT NULL DEFAULT '',
  description_template TEXT NOT NULL DEFAULT '',
  h1_template TEXT NOT NULL DEFAULT '',
  content_template TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_keywords_template TEXT DEFAULT '',
  schema_template JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pseo_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pseo templates"
ON public.pseo_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pseo templates viewable by admins for management"
ON public.pseo_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pseo_templates_updated_at
BEFORE UPDATE ON public.pseo_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pseo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  h1 TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_keywords TEXT DEFAULT '',
  seo_og_image TEXT,
  seo_schema JSONB,
  status TEXT NOT NULL DEFAULT 'published',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pseo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pseo pages viewable by everyone"
ON public.pseo_pages FOR SELECT
USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage pseo pages"
ON public.pseo_pages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pseo_pages_updated_at
BEFORE UPDATE ON public.pseo_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pseo_pages_slug ON public.pseo_pages(slug);
CREATE INDEX idx_pseo_pages_template ON public.pseo_pages(template_id);
CREATE INDEX idx_pseo_pages_status ON public.pseo_pages(status);