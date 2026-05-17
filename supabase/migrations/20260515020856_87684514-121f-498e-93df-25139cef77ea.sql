
-- 1) Remove dangerous anon SELECT on orders (was leaking ALL orders for 30s)
DROP POLICY IF EXISTS "Anon can read back inserted order" ON public.orders;

-- 2) Remove dangerous anon INSERT on stock_logs (audit-trail pollution)
DROP POLICY IF EXISTS "Anyone can insert stock logs" ON public.stock_logs;

-- 3) Tighten coupons SELECT for authenticated users — only active coupons
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4) SECURITY DEFINER RPC to create an order safely without exposing other orders
CREATE OR REPLACE FUNCTION public.create_order(_order jsonb)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted public.orders;
BEGIN
  INSERT INTO public.orders (
    customer_name,
    customer_phone,
    customer_address,
    customer_city,
    customer_email,
    customer_note,
    items,
    total,
    delivery_method,
    payment_method,
    payment_sender_number,
    transaction_id,
    discount,
    delivery_charge,
    user_id,
    source
  )
  VALUES (
    _order->>'customer_name',
    _order->>'customer_phone',
    _order->>'customer_address',
    _order->>'customer_city',
    NULLIF(_order->>'customer_email', ''),
    NULLIF(_order->>'customer_note', ''),
    COALESCE(_order->'items', '[]'::jsonb),
    COALESCE((_order->>'total')::int, 0),
    COALESCE(_order->>'delivery_method', 'standard'),
    COALESCE(_order->>'payment_method', 'cod'),
    NULLIF(_order->>'payment_sender_number', ''),
    NULLIF(_order->>'transaction_id', ''),
    COALESCE((_order->>'discount')::int, 0),
    COALESCE((_order->>'delivery_charge')::int, 0),
    NULLIF(_order->>'user_id','')::uuid,
    COALESCE(_order->>'source', 'website')
  )
  RETURNING * INTO inserted;

  RETURN inserted;
END;
$$;

-- Allow public web visitors to call this RPC (it only inserts; never reads other rows)
GRANT EXECUTE ON FUNCTION public.create_order(jsonb) TO anon, authenticated;
