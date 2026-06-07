ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS homepage_placements text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_products_homepage_placements
  ON public.products USING GIN (homepage_placements);