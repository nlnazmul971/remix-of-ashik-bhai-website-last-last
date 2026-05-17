ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);