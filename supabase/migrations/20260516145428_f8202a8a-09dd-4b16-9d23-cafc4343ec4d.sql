CREATE POLICY "Public can read tracking_settings"
ON public.tracking_settings
FOR SELECT
TO anon, authenticated
USING (true);