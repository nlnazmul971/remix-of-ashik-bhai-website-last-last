
-- Blog categories
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog categories viewable by everyone" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage blog categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Blog tags
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog tags viewable by everyone" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage blog tags" ON public.blog_tags FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Blog authors
CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  social JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog authors viewable by everyone" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "Admins manage blog authors" ON public.blog_authors FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Blogs
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT DEFAULT '',
  category_id UUID,
  author_id UUID,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  reading_time INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  seo_canonical TEXT,
  seo_og_image TEXT,
  seo_focus_keyword TEXT,
  seo_no_index BOOLEAN NOT NULL DEFAULT false,
  seo_schema JSONB,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_post_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blogs viewable by everyone" ON public.blogs FOR SELECT USING (status = 'published' OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage blogs" ON public.blogs FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE INDEX idx_blogs_status_published ON public.blogs(status, published_at DESC);
CREATE INDEX idx_blogs_category ON public.blogs(category_id);
CREATE INDEX idx_blogs_author ON public.blogs(author_id);
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN(tags);

-- Blog comments
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved comments viewable by everyone" ON public.blog_comments FOR SELECT USING (is_approved = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can submit comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage blog comments" ON public.blog_comments FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete blog comments" ON public.blog_comments FOR DELETE USING (has_role(auth.uid(),'admin'));

-- Triggers for updated_at
CREATE TRIGGER trg_blog_categories_updated BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_authors_updated BEFORE UPDATE ON public.blog_authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blogs_updated BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
