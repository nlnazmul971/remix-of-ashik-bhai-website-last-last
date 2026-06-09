-- ============================================================
-- FULL DATABASE SCHEMA (public schema)
-- Generated: 2026-06-09T19:19:45Z
-- Includes: tables, types, functions, triggers, RLS policies, grants
-- ============================================================

--
-- PostgreSQL database dump
--

\restrict V5gmYbS0nAHGjDK0keVAzLmHVaoOUmXgEo0mvwQZ8d2u08mKj9tGY7x3vLbcTJm

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    items jsonb NOT NULL,
    total integer NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text NOT NULL,
    customer_city text NOT NULL,
    delivery_method text DEFAULT 'standard'::text NOT NULL,
    payment_method text DEFAULT 'cod'::text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    consignment_id text,
    tracking_code text,
    courier_provider text,
    transaction_id text,
    payment_sender_number text,
    customer_note text,
    deleted_at timestamp with time zone,
    order_token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text),
    customer_email text,
    discount integer DEFAULT 0 NOT NULL,
    delivery_charge integer DEFAULT 0 NOT NULL,
    courier_fee integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'website'::text NOT NULL,
    advance_payment integer DEFAULT 0 NOT NULL,
    call_attempts integer DEFAULT 0 NOT NULL,
    admin_notes text,
    return_received boolean DEFAULT false NOT NULL
);


--
-- Name: create_order(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order(_order jsonb) RETURNS public.orders
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    actor_email text,
    actor_role text,
    entity_type text NOT NULL,
    entity_id text,
    action text NOT NULL,
    summary text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requested_by uuid,
    requester_email text,
    entity_type text NOT NULL,
    entity_id text,
    action text NOT NULL,
    payload jsonb,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewer_note text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_authors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_authors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    bio text DEFAULT ''::text,
    avatar_url text DEFAULT ''::text,
    social jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text DEFAULT ''::text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blog_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    comment text NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blogs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text DEFAULT ''::text,
    content text DEFAULT ''::text NOT NULL,
    cover_image text DEFAULT ''::text,
    category_id uuid,
    author_id uuid,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    reading_time integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    seo_title text,
    seo_description text,
    seo_keywords text,
    seo_canonical text,
    seo_og_image text,
    seo_focus_keyword text,
    seo_no_index boolean DEFAULT false NOT NULL,
    seo_schema jsonb,
    faq jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_post_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: checkout_payment_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkout_payment_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    number text DEFAULT ''::text NOT NULL,
    instructions text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    code text NOT NULL,
    discount_type text DEFAULT 'fixed'::text NOT NULL,
    discount_value integer DEFAULT 0 NOT NULL,
    min_order_amount integer DEFAULT 0 NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['fixed'::text, 'percentage'::text, 'free_shipping'::text])))
);


--
-- Name: custom_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    banner_url text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    product_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


--
-- Name: delivery_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    fee integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fraud_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fraud_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone text NOT NULL,
    status text DEFAULT 'Unknown'::text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    total_parcel integer DEFAULT 0 NOT NULL,
    success_parcel integer DEFAULT 0 NOT NULL,
    cancel_parcel integer DEFAULT 0 NOT NULL,
    response jsonb DEFAULT '{}'::jsonb NOT NULL,
    source text DEFAULT 'LIVE'::text NOT NULL,
    checked_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: header_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.header_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: landing_page_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_page_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landing_page_id uuid NOT NULL,
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: landing_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text,
    blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    seo_title text,
    seo_description text,
    seo_keywords text,
    seo_focus_keyword text,
    seo_og_image text,
    seo_canonical text,
    seo_no_index boolean DEFAULT false NOT NULL,
    seo_schema jsonb,
    view_count integer DEFAULT 0 NOT NULL,
    conversion_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_domain text,
    custom_path text
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: packaging_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packaging_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    fee numeric DEFAULT 0 NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_size_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_size_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    size text NOT NULL,
    total_stock integer DEFAULT 0 NOT NULL,
    sold_count integer DEFAULT 0 NOT NULL,
    cancelled_count integer DEFAULT 0 NOT NULL,
    returned_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    original_price integer,
    image_url text DEFAULT ''::text NOT NULL,
    category text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    sizes text[] DEFAULT ARRAY['S'::text, 'M'::text, 'L'::text, 'XL'::text] NOT NULL,
    colors jsonb DEFAULT '[]'::jsonb NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brand text DEFAULT ''::text NOT NULL,
    sku text DEFAULT ''::text NOT NULL,
    size_chart jsonb DEFAULT '[]'::jsonb,
    subcategory text,
    is_new_drop boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    seo_title text,
    seo_description text,
    seo_keywords text,
    seo_slug text,
    seo_canonical text,
    seo_og_image text,
    seo_focus_keyword text,
    seo_no_index boolean DEFAULT false NOT NULL,
    seo_faq jsonb DEFAULT '[]'::jsonb NOT NULL,
    seo_schema jsonb,
    homepage_placements text[] DEFAULT '{}'::text[] NOT NULL,
    is_new_arrival boolean DEFAULT false NOT NULL,
    is_trending boolean DEFAULT false NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    phone text,
    address text,
    city text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pseo_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid,
    slug text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    h1 text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo_keywords text DEFAULT ''::text,
    seo_og_image text,
    seo_schema jsonb,
    status text DEFAULT 'published'::text NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pseo_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pseo_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url_pattern text NOT NULL,
    title_template text DEFAULT ''::text NOT NULL,
    description_template text DEFAULT ''::text NOT NULL,
    h1_template text DEFAULT ''::text NOT NULL,
    content_template text DEFAULT ''::text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    seo_keywords_template text DEFAULT ''::text,
    schema_template jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: redirects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redirects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_path text NOT NULL,
    to_path text NOT NULL,
    status_code integer DEFAULT 301 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    hit_count integer DEFAULT 0 NOT NULL,
    last_hit_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    name text NOT NULL,
    rating integer NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: stock_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    size text NOT NULL,
    change_type text DEFAULT 'manual'::text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    order_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_category text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tracking_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracking_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trash_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trash_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_user_id uuid NOT NULL,
    email text,
    display_name text,
    phone text,
    city text,
    address text,
    role text DEFAULT 'user'::text,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: action_logs action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: blog_authors blog_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_authors
    ADD CONSTRAINT blog_authors_pkey PRIMARY KEY (id);


--
-- Name: blog_authors blog_authors_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_authors
    ADD CONSTRAINT blog_authors_slug_key UNIQUE (slug);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_comments blog_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- Name: checkout_payment_settings checkout_payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkout_payment_settings
    ADD CONSTRAINT checkout_payment_settings_pkey PRIMARY KEY (id);


--
-- Name: checkout_payment_settings checkout_payment_settings_provider_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkout_payment_settings
    ADD CONSTRAINT checkout_payment_settings_provider_unique UNIQUE (provider);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_pkey PRIMARY KEY (id);


--
-- Name: custom_pages custom_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_pages
    ADD CONSTRAINT custom_pages_slug_key UNIQUE (slug);


--
-- Name: delivery_zones delivery_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);


--
-- Name: fraud_checks fraud_checks_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_checks
    ADD CONSTRAINT fraud_checks_phone_key UNIQUE (phone);


--
-- Name: fraud_checks fraud_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_checks
    ADD CONSTRAINT fraud_checks_pkey PRIMARY KEY (id);


--
-- Name: header_categories header_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.header_categories
    ADD CONSTRAINT header_categories_pkey PRIMARY KEY (id);


--
-- Name: header_categories header_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.header_categories
    ADD CONSTRAINT header_categories_slug_key UNIQUE (slug);


--
-- Name: landing_page_analytics landing_page_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_page_analytics
    ADD CONSTRAINT landing_page_analytics_pkey PRIMARY KEY (id);


--
-- Name: landing_pages landing_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_pkey PRIMARY KEY (id);


--
-- Name: landing_pages landing_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_pages
    ADD CONSTRAINT landing_pages_slug_key UNIQUE (slug);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_token_key UNIQUE (order_token);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: packaging_options packaging_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packaging_options
    ADD CONSTRAINT packaging_options_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_size_stock product_size_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size_stock
    ADD CONSTRAINT product_size_stock_pkey PRIMARY KEY (id);


--
-- Name: product_size_stock product_size_stock_product_id_size_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size_stock
    ADD CONSTRAINT product_size_stock_product_id_size_key UNIQUE (product_id, size);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: pseo_pages pseo_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_pages
    ADD CONSTRAINT pseo_pages_pkey PRIMARY KEY (id);


--
-- Name: pseo_pages pseo_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_pages
    ADD CONSTRAINT pseo_pages_slug_key UNIQUE (slug);


--
-- Name: pseo_templates pseo_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pseo_templates
    ADD CONSTRAINT pseo_templates_pkey PRIMARY KEY (id);


--
-- Name: redirects redirects_from_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_from_path_key UNIQUE (from_path);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: stock_logs stock_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_pkey PRIMARY KEY (id);


--
-- Name: store_settings store_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings
    ADD CONSTRAINT store_settings_key_key UNIQUE (key);


--
-- Name: store_settings store_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings
    ADD CONSTRAINT store_settings_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: tracking_settings tracking_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_settings
    ADD CONSTRAINT tracking_settings_key_key UNIQUE (key);


--
-- Name: tracking_settings tracking_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracking_settings
    ADD CONSTRAINT tracking_settings_pkey PRIMARY KEY (id);


--
-- Name: trash_users trash_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trash_users
    ADD CONSTRAINT trash_users_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: action_logs_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX action_logs_actor_idx ON public.action_logs USING btree (actor_id);


--
-- Name: action_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX action_logs_created_idx ON public.action_logs USING btree (created_at DESC);


--
-- Name: action_logs_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX action_logs_entity_idx ON public.action_logs USING btree (entity_type, entity_id);


--
-- Name: approval_requests_requester_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX approval_requests_requester_idx ON public.approval_requests USING btree (requested_by);


--
-- Name: approval_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX approval_requests_status_idx ON public.approval_requests USING btree (status, created_at DESC);


--
-- Name: idx_blogs_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_author ON public.blogs USING btree (author_id);


--
-- Name: idx_blogs_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_category ON public.blogs USING btree (category_id);


--
-- Name: idx_blogs_status_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_status_published ON public.blogs USING btree (status, published_at DESC);


--
-- Name: idx_blogs_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_tags ON public.blogs USING gin (tags);


--
-- Name: idx_checkout_payment_settings_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkout_payment_settings_provider ON public.checkout_payment_settings USING btree (provider);


--
-- Name: idx_landing_analytics_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_analytics_page ON public.landing_page_analytics USING btree (landing_page_id);


--
-- Name: idx_landing_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_slug ON public.landing_pages USING btree (slug);


--
-- Name: idx_landing_pages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_landing_pages_status ON public.landing_pages USING btree (status);


--
-- Name: idx_products_homepage_placements; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_homepage_placements ON public.products USING gin (homepage_placements);


--
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);


--
-- Name: idx_products_is_new_arrival; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_new_arrival ON public.products USING btree (is_new_arrival) WHERE (is_new_arrival = true);


--
-- Name: idx_products_is_new_drop; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_new_drop ON public.products USING btree (is_new_drop) WHERE (is_new_drop = true);


--
-- Name: idx_products_is_trending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_is_trending ON public.products USING btree (is_trending) WHERE (is_trending = true);


--
-- Name: idx_products_subcategory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_subcategory ON public.products USING btree (subcategory);


--
-- Name: idx_pseo_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_slug ON public.pseo_pages USING btree (slug);


--
-- Name: idx_pseo_pages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_status ON public.pseo_pages USING btree (status);


--
-- Name: idx_pseo_pages_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pseo_pages_template ON public.pseo_pages USING btree (template_id);


--
-- Name: idx_subcategories_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_parent ON public.subcategories USING btree (parent_category);


--
-- Name: idx_subcategories_parent_active_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_parent_active_order ON public.subcategories USING btree (parent_category, is_active, sort_order);


--
-- Name: landing_pages_custom_domain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX landing_pages_custom_domain_idx ON public.landing_pages USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- Name: landing_pages_custom_path_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX landing_pages_custom_path_unique ON public.landing_pages USING btree (custom_path) WHERE (custom_path IS NOT NULL);


--
-- Name: products_seo_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_seo_slug_unique ON public.products USING btree (seo_slug) WHERE ((seo_slug IS NOT NULL) AND (seo_slug <> ''::text));


--
-- Name: approval_requests trg_approval_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_authors trg_blog_authors_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_authors_updated BEFORE UPDATE ON public.blog_authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_categories trg_blog_categories_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_categories_updated BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blogs trg_blogs_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blogs_updated BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: checkout_payment_settings update_checkout_payment_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_checkout_payment_settings_updated_at BEFORE UPDATE ON public.checkout_payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: coupons update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_pages update_custom_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_custom_pages_updated_at BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: header_categories update_header_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_header_categories_updated_at BEFORE UPDATE ON public.header_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: landing_pages update_landing_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: packaging_options update_packaging_options_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_packaging_options_updated_at BEFORE UPDATE ON public.packaging_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_size_stock update_product_size_stock_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_size_stock_updated_at BEFORE UPDATE ON public.product_size_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pseo_pages update_pseo_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pseo_pages_updated_at BEFORE UPDATE ON public.pseo_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pseo_templates update_pseo_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pseo_templates_updated_at BEFORE UPDATE ON public.pseo_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: redirects update_redirects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_redirects_updated_at BEFORE UPDATE ON public.redirects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subcategories update_subcategories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: action_logs action_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: approval_requests approval_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: approval_requests approval_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_size_stock product_size_stock_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size_stock
    ADD CONSTRAINT product_size_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: stock_logs stock_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: stock_logs stock_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: blog_comments Admins can delete blog comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete blog comments" ON public.blog_comments FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: checkout_payment_settings Admins can delete checkout payment settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete checkout payment settings" ON public.checkout_payment_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Admins can delete coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: custom_pages Admins can delete custom pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete custom pages" ON public.custom_pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: delivery_zones Admins can delete delivery zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete delivery zones" ON public.delivery_zones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: header_categories Admins can delete header categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete header categories" ON public.header_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_subscribers Admins can delete newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete newsletter subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can delete orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_images Admins can delete product images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete product images" ON public.product_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can delete products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: redirects Admins can delete redirects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete redirects" ON public.redirects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Admins can delete reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_size_stock Admins can delete stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete stock" ON public.product_size_stock FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: store_settings Admins can delete store settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete store settings" ON public.store_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subcategories Admins can delete subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete subcategories" ON public.subcategories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: checkout_payment_settings Admins can insert checkout payment settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert checkout payment settings" ON public.checkout_payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Admins can insert coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: custom_pages Admins can insert custom pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert custom pages" ON public.custom_pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: delivery_zones Admins can insert delivery zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert delivery zones" ON public.delivery_zones FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fraud_checks Admins can insert fraud checks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert fraud checks" ON public.fraud_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: header_categories Admins can insert header categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert header categories" ON public.header_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_images Admins can insert product images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert product images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can insert products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: redirects Admins can insert redirects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert redirects" ON public.redirects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_size_stock Admins can insert stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert stock" ON public.product_size_stock FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: stock_logs Admins can insert stock logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert stock logs" ON public.stock_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: store_settings Admins can insert store settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert store settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subcategories Admins can insert subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tracking_settings Admins can manage tracking_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tracking_settings" ON public.tracking_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: trash_users Admins can manage trash_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage trash_users" ON public.trash_users TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: checkout_payment_settings Admins can update checkout payment settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update checkout payment settings" ON public.checkout_payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Admins can update coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: custom_pages Admins can update custom pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update custom pages" ON public.custom_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: delivery_zones Admins can update delivery zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update delivery zones" ON public.delivery_zones FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fraud_checks Admins can update fraud checks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update fraud checks" ON public.fraud_checks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: header_categories Admins can update header categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update header categories" ON public.header_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_images Admins can update product images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update product images" ON public.product_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can update products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: redirects Admins can update redirects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update redirects" ON public.redirects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_size_stock Admins can update stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update stock" ON public.product_size_stock FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: store_settings Admins can update store settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update store settings" ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subcategories Admins can update subcategories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: wishlist_items Admins can view all wishlist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all wishlist items" ON public.wishlist_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fraud_checks Admins can view fraud checks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view fraud checks" ON public.fraud_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: landing_page_analytics Admins can view landing page analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view landing page analytics" ON public.landing_page_analytics FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_subscribers Admins can view newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: stock_logs Admins can view stock logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view stock logs" ON public.stock_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: approval_requests Admins create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins create requests" ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (((requested_by = auth.uid()) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: blog_authors Admins manage blog authors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage blog authors" ON public.blog_authors USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_categories Admins manage blog categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage blog categories" ON public.blog_categories USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_comments Admins manage blog comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage blog comments" ON public.blog_comments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_tags Admins manage blog tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage blog tags" ON public.blog_tags USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blogs Admins manage blogs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage blogs" ON public.blogs USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: landing_pages Admins manage landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage landing pages" ON public.landing_pages USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: packaging_options Admins manage packaging options; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage packaging options" ON public.packaging_options USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pseo_pages Admins manage pseo pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage pseo pages" ON public.pseo_pages USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pseo_templates Admins manage pseo templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage pseo templates" ON public.pseo_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: action_logs Admins read all logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all logs" ON public.action_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: approval_requests Admins read all requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all requests" ON public.approval_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: approval_requests Admins update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update requests" ON public.approval_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Anon can validate coupon by code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon can validate coupon by code" ON public.coupons FOR SELECT TO anon USING ((is_active = true));


--
-- Name: orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: reviews Anyone can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: landing_page_analytics Anyone can insert landing page analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert landing page analytics" ON public.landing_page_analytics FOR INSERT WITH CHECK (true);


--
-- Name: blog_comments Anyone can submit comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit comments" ON public.blog_comments FOR INSERT WITH CHECK (true);


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: blog_comments Approved comments viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved comments viewable by everyone" ON public.blog_comments FOR SELECT USING (((is_approved = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: coupons Authenticated users can view active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active coupons" ON public.coupons FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: blog_authors Blog authors viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blog authors viewable by everyone" ON public.blog_authors FOR SELECT USING (true);


--
-- Name: blog_categories Blog categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blog categories viewable by everyone" ON public.blog_categories FOR SELECT USING (true);


--
-- Name: blog_tags Blog tags viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blog tags viewable by everyone" ON public.blog_tags FOR SELECT USING (true);


--
-- Name: checkout_payment_settings Checkout payment settings are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Checkout payment settings are viewable by everyone" ON public.checkout_payment_settings FOR SELECT USING (true);


--
-- Name: custom_pages Custom pages viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Custom pages viewable by everyone" ON public.custom_pages FOR SELECT USING (true);


--
-- Name: delivery_zones Delivery zones are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delivery zones are viewable by everyone" ON public.delivery_zones FOR SELECT USING (true);


--
-- Name: header_categories Header categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Header categories are viewable by everyone" ON public.header_categories FOR SELECT USING (true);


--
-- Name: approval_requests Moderators create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators create requests" ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (((requested_by = auth.uid()) AND public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: action_logs Moderators read own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators read own logs" ON public.action_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'moderator'::public.app_role) AND (actor_id = auth.uid())));


--
-- Name: approval_requests Moderators read own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators read own requests" ON public.approval_requests FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'moderator'::public.app_role) AND (requested_by = auth.uid())));


--
-- Name: packaging_options Packaging options viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Packaging options viewable by everyone" ON public.packaging_options FOR SELECT USING (true);


--
-- Name: product_images Product images are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Product images are viewable by everyone" ON public.product_images FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


--
-- Name: pseo_templates Pseo templates viewable by admins for management; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pseo templates viewable by admins for management" ON public.pseo_templates FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tracking_settings Public can read tracking_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read tracking_settings" ON public.tracking_settings FOR SELECT TO authenticated, anon USING (true);


--
-- Name: blogs Published blogs viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published blogs viewable by everyone" ON public.blogs FOR SELECT USING (((status = 'published'::text) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: landing_pages Published landing pages viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published landing pages viewable by everyone" ON public.landing_pages FOR SELECT USING (((status = 'published'::text) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: pseo_pages Published pseo pages viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published pseo pages viewable by everyone" ON public.pseo_pages FOR SELECT USING (((status = 'published'::text) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: redirects Redirects viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Redirects viewable by everyone" ON public.redirects FOR SELECT USING (true);


--
-- Name: reviews Reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);


--
-- Name: action_logs Staff can insert their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert their own logs" ON public.action_logs FOR INSERT TO authenticated WITH CHECK (((actor_id = auth.uid()) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))));


--
-- Name: products Staff insert products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff insert products" ON public.products FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: product_size_stock Staff insert stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff insert stock" ON public.product_size_stock FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: stock_logs Staff insert stock logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff insert stock logs" ON public.stock_logs FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: product_images Staff manage product images insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff manage product images insert" ON public.product_images FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: product_images Staff manage product images update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff manage product images update" ON public.product_images FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: orders Staff update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: products Staff update products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff update products" ON public.products FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: product_size_stock Staff update stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff update stock" ON public.product_size_stock FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: orders Staff view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff view all orders" ON public.orders FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: stock_logs Staff view stock logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff view stock logs" ON public.stock_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role)));


--
-- Name: product_size_stock Stock viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Stock viewable by everyone" ON public.product_size_stock FOR SELECT USING (true);


--
-- Name: store_settings Store settings viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);


--
-- Name: subcategories Subcategories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Subcategories viewable by everyone" ON public.subcategories FOR SELECT USING (true);


--
-- Name: wishlist_items Users can add to wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: wishlist_items Users can remove from wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: wishlist_items Users can view own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: action_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: approval_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_authors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: blogs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

--
-- Name: checkout_payment_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkout_payment_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: delivery_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: fraud_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fraud_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: header_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.header_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: landing_page_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.landing_page_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: landing_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: packaging_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.packaging_options ENABLE ROW LEVEL SECURITY;

--
-- Name: product_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

--
-- Name: product_size_stock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_size_stock ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: pseo_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pseo_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: redirects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: store_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: tracking_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: trash_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trash_users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO sandbox_exec;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT SELECT,INSERT ON TABLE public.orders TO sandbox_exec;


--
-- Name: FUNCTION create_order(_order jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_order(_order jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_order(_order jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_order(_order jsonb) TO service_role;
GRANT ALL ON FUNCTION public.create_order(_order jsonb) TO sandbox_exec;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO sandbox_exec;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO sandbox_exec;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO sandbox_exec;


--
-- Name: TABLE action_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.action_logs TO anon;
GRANT ALL ON TABLE public.action_logs TO authenticated;
GRANT ALL ON TABLE public.action_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.action_logs TO sandbox_exec;


--
-- Name: TABLE approval_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.approval_requests TO anon;
GRANT ALL ON TABLE public.approval_requests TO authenticated;
GRANT ALL ON TABLE public.approval_requests TO service_role;
GRANT SELECT,INSERT ON TABLE public.approval_requests TO sandbox_exec;


--
-- Name: TABLE blog_authors; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_authors TO anon;
GRANT ALL ON TABLE public.blog_authors TO authenticated;
GRANT ALL ON TABLE public.blog_authors TO service_role;
GRANT SELECT,INSERT ON TABLE public.blog_authors TO sandbox_exec;


--
-- Name: TABLE blog_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_categories TO anon;
GRANT ALL ON TABLE public.blog_categories TO authenticated;
GRANT ALL ON TABLE public.blog_categories TO service_role;
GRANT SELECT,INSERT ON TABLE public.blog_categories TO sandbox_exec;


--
-- Name: TABLE blog_comments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_comments TO anon;
GRANT ALL ON TABLE public.blog_comments TO authenticated;
GRANT ALL ON TABLE public.blog_comments TO service_role;
GRANT SELECT,INSERT ON TABLE public.blog_comments TO sandbox_exec;


--
-- Name: TABLE blog_tags; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blog_tags TO anon;
GRANT ALL ON TABLE public.blog_tags TO authenticated;
GRANT ALL ON TABLE public.blog_tags TO service_role;
GRANT SELECT,INSERT ON TABLE public.blog_tags TO sandbox_exec;


--
-- Name: TABLE blogs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.blogs TO anon;
GRANT ALL ON TABLE public.blogs TO authenticated;
GRANT ALL ON TABLE public.blogs TO service_role;
GRANT SELECT,INSERT ON TABLE public.blogs TO sandbox_exec;


--
-- Name: TABLE checkout_payment_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.checkout_payment_settings TO anon;
GRANT ALL ON TABLE public.checkout_payment_settings TO authenticated;
GRANT ALL ON TABLE public.checkout_payment_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.checkout_payment_settings TO sandbox_exec;


--
-- Name: TABLE coupons; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.coupons TO anon;
GRANT ALL ON TABLE public.coupons TO authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;
GRANT SELECT,INSERT ON TABLE public.coupons TO sandbox_exec;


--
-- Name: TABLE custom_pages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.custom_pages TO anon;
GRANT ALL ON TABLE public.custom_pages TO authenticated;
GRANT ALL ON TABLE public.custom_pages TO service_role;
GRANT SELECT,INSERT ON TABLE public.custom_pages TO sandbox_exec;


--
-- Name: TABLE delivery_zones; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.delivery_zones TO anon;
GRANT ALL ON TABLE public.delivery_zones TO authenticated;
GRANT ALL ON TABLE public.delivery_zones TO service_role;
GRANT SELECT,INSERT ON TABLE public.delivery_zones TO sandbox_exec;


--
-- Name: TABLE fraud_checks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fraud_checks TO anon;
GRANT ALL ON TABLE public.fraud_checks TO authenticated;
GRANT ALL ON TABLE public.fraud_checks TO service_role;
GRANT SELECT,INSERT ON TABLE public.fraud_checks TO sandbox_exec;


--
-- Name: TABLE header_categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.header_categories TO anon;
GRANT ALL ON TABLE public.header_categories TO authenticated;
GRANT ALL ON TABLE public.header_categories TO service_role;
GRANT SELECT,INSERT ON TABLE public.header_categories TO sandbox_exec;


--
-- Name: TABLE landing_page_analytics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.landing_page_analytics TO anon;
GRANT ALL ON TABLE public.landing_page_analytics TO authenticated;
GRANT ALL ON TABLE public.landing_page_analytics TO service_role;
GRANT SELECT,INSERT ON TABLE public.landing_page_analytics TO sandbox_exec;


--
-- Name: TABLE landing_pages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.landing_pages TO anon;
GRANT ALL ON TABLE public.landing_pages TO authenticated;
GRANT ALL ON TABLE public.landing_pages TO service_role;
GRANT SELECT,INSERT ON TABLE public.landing_pages TO sandbox_exec;


--
-- Name: TABLE newsletter_subscribers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.newsletter_subscribers TO anon;
GRANT ALL ON TABLE public.newsletter_subscribers TO authenticated;
GRANT ALL ON TABLE public.newsletter_subscribers TO service_role;
GRANT SELECT,INSERT ON TABLE public.newsletter_subscribers TO sandbox_exec;


--
-- Name: TABLE packaging_options; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.packaging_options TO anon;
GRANT ALL ON TABLE public.packaging_options TO authenticated;
GRANT ALL ON TABLE public.packaging_options TO service_role;
GRANT SELECT,INSERT ON TABLE public.packaging_options TO sandbox_exec;


--
-- Name: TABLE product_images; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_images TO anon;
GRANT ALL ON TABLE public.product_images TO authenticated;
GRANT ALL ON TABLE public.product_images TO service_role;
GRANT SELECT,INSERT ON TABLE public.product_images TO sandbox_exec;


--
-- Name: TABLE product_size_stock; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_size_stock TO anon;
GRANT ALL ON TABLE public.product_size_stock TO authenticated;
GRANT ALL ON TABLE public.product_size_stock TO service_role;
GRANT SELECT,INSERT ON TABLE public.product_size_stock TO sandbox_exec;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;
GRANT SELECT,INSERT ON TABLE public.products TO sandbox_exec;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT,INSERT ON TABLE public.profiles TO sandbox_exec;


--
-- Name: TABLE pseo_pages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pseo_pages TO anon;
GRANT ALL ON TABLE public.pseo_pages TO authenticated;
GRANT ALL ON TABLE public.pseo_pages TO service_role;
GRANT SELECT,INSERT ON TABLE public.pseo_pages TO sandbox_exec;


--
-- Name: TABLE pseo_templates; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pseo_templates TO anon;
GRANT ALL ON TABLE public.pseo_templates TO authenticated;
GRANT ALL ON TABLE public.pseo_templates TO service_role;
GRANT SELECT,INSERT ON TABLE public.pseo_templates TO sandbox_exec;


--
-- Name: TABLE redirects; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.redirects TO anon;
GRANT ALL ON TABLE public.redirects TO authenticated;
GRANT ALL ON TABLE public.redirects TO service_role;
GRANT SELECT,INSERT ON TABLE public.redirects TO sandbox_exec;


--
-- Name: TABLE reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.reviews TO anon;
GRANT ALL ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;
GRANT SELECT,INSERT ON TABLE public.reviews TO sandbox_exec;


--
-- Name: TABLE stock_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.stock_logs TO anon;
GRANT ALL ON TABLE public.stock_logs TO authenticated;
GRANT ALL ON TABLE public.stock_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.stock_logs TO sandbox_exec;


--
-- Name: TABLE store_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.store_settings TO anon;
GRANT ALL ON TABLE public.store_settings TO authenticated;
GRANT ALL ON TABLE public.store_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.store_settings TO sandbox_exec;


--
-- Name: TABLE subcategories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.subcategories TO anon;
GRANT ALL ON TABLE public.subcategories TO authenticated;
GRANT ALL ON TABLE public.subcategories TO service_role;
GRANT SELECT,INSERT ON TABLE public.subcategories TO sandbox_exec;


--
-- Name: TABLE tracking_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tracking_settings TO anon;
GRANT ALL ON TABLE public.tracking_settings TO authenticated;
GRANT ALL ON TABLE public.tracking_settings TO service_role;
GRANT SELECT,INSERT ON TABLE public.tracking_settings TO sandbox_exec;


--
-- Name: TABLE trash_users; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.trash_users TO anon;
GRANT ALL ON TABLE public.trash_users TO authenticated;
GRANT ALL ON TABLE public.trash_users TO service_role;
GRANT SELECT,INSERT ON TABLE public.trash_users TO sandbox_exec;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_roles TO sandbox_exec;


--
-- Name: TABLE wishlist_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.wishlist_items TO anon;
GRANT ALL ON TABLE public.wishlist_items TO authenticated;
GRANT ALL ON TABLE public.wishlist_items TO service_role;
GRANT SELECT,INSERT ON TABLE public.wishlist_items TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict V5gmYbS0nAHGjDK0keVAzLmHVaoOUmXgEo0mvwQZ8d2u08mKj9tGY7x3vLbcTJm

