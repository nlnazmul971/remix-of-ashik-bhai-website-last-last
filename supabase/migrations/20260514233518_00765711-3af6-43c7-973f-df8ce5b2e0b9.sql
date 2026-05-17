
CREATE TABLE public.header_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.header_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Header categories are viewable by everyone"
ON public.header_categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert header categories"
ON public.header_categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update header categories"
ON public.header_categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete header categories"
ON public.header_categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_header_categories_updated_at
BEFORE UPDATE ON public.header_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.header_categories (name, slug, sort_order) VALUES
  ('Shirt', 'Shirts', 1),
  ('T-Shirt', 'T-Shirt', 2),
  ('Panjabi', 'Panjabi', 3),
  ('Pant', 'Pant', 4);
