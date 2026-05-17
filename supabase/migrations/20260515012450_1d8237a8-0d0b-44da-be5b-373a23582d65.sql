-- Packaging / Gift wrap charge options (mirrors delivery_zones pattern)
CREATE TABLE IF NOT EXISTS public.packaging_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packaging_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packaging options viewable by everyone"
  ON public.packaging_options FOR SELECT USING (true);

CREATE POLICY "Admins manage packaging options"
  ON public.packaging_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_packaging_options_updated_at
  BEFORE UPDATE ON public.packaging_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.packaging_options (name, fee, description, sort_order) VALUES
  ('Standard Packaging', 0, 'Free default packaging', 1),
  ('Gift Wrap', 50, 'Premium gift wrap with ribbon', 2),
  ('Premium Box', 100, 'Branded box with care card', 3);