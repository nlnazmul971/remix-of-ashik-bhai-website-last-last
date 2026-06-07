
-- Helper predicate: staff = admin or moderator
-- Orders
CREATE POLICY "Staff view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Staff update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- Products
CREATE POLICY "Staff insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Staff update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- Stock
CREATE POLICY "Staff insert stock"
ON public.product_size_stock FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Staff update stock"
ON public.product_size_stock FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- Stock logs
CREATE POLICY "Staff insert stock logs"
ON public.stock_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Staff view stock logs"
ON public.stock_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- product_images (used in product editing)
CREATE POLICY "Staff manage product images insert"
ON public.product_images FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE POLICY "Staff manage product images update"
ON public.product_images FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
