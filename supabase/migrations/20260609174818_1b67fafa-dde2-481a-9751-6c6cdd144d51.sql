ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS custom_domain TEXT, ADD COLUMN IF NOT EXISTS custom_path TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_custom_path_unique ON public.landing_pages (custom_path) WHERE custom_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS landing_pages_custom_domain_idx ON public.landing_pages (custom_domain) WHERE custom_domain IS NOT NULL;