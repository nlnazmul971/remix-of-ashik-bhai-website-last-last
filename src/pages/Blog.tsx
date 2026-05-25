import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';
import { useStoreSettings } from '@/hooks/useSupabase';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

type Blog = {
  id: string; title: string; slug: string; excerpt: string; cover_image: string;
  category_id: string | null; tags: string[]; published_at: string; reading_time: number;
};
type Cat = { id: string; name: string; slug: string };

const Blog = () => {
  const { data: settings = {} } = useStoreSettings();
  const baseUrl = (settings['seo_base_url'] || '').replace(/\/+$/, '');
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get('category') || '';
  const tag = params.get('tag') || '';

  const [posts, setPosts] = useState<Blog[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, p] = await Promise.all([
        supabase.from('blog_categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('blogs').select('id,title,slug,excerpt,cover_image,category_id,tags,published_at,reading_time')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
      ]);
      setCats((c.data as any) || []);
      let list = (p.data as any) || [];
      if (categorySlug) {
        const cat = (c.data as any || []).find((x: Cat) => x.slug === categorySlug);
        if (cat) list = list.filter((x: Blog) => x.category_id === cat.id);
      }
      if (tag) list = list.filter((x: Blog) => x.tags?.includes(tag));
      setPosts(list);
      setLoading(false);
    })();
  }, [categorySlug, tag]);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${settings['seo_brand_name'] || 'Blog'} — Blog`,
    url: `${baseUrl}/blog`,
    blogPost: posts.slice(0, 20).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${baseUrl}/blog/${p.slug}`,
      datePublished: p.published_at,
      image: p.cover_image || undefined,
    })),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={categorySlug ? `${categorySlug} — Blog` : 'Blog'}
        description="Tips, guides, and stories from our team."
        path="/blog"
        type="website"
        jsonLd={ld}
      />
      <Header /><CartDrawer />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-32 pb-16">
        <header className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Journal</p>
          <h1 className="luxury-heading text-4xl sm:text-5xl tracking-tight">Our Blog</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">Insights, guides, and stories.</p>
        </header>

        {cats.length > 0 && (
          <nav className="flex flex-wrap gap-2 justify-center mb-10">
            <button onClick={() => setParams({})} className={`px-3 py-1.5 text-xs border ${!categorySlug ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}>All</button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setParams({ category: c.slug })} className={`px-3 py-1.5 text-xs border ${categorySlug === c.slug ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}>{c.name}</button>
            ))}
          </nav>
        )}

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No posts yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-muted mb-3">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/40" />
                  )}
                </div>
                <h2 className="text-base font-medium leading-snug group-hover:underline">{p.title}</h2>
                {p.excerpt && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.excerpt}</p>}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                  {p.published_at && <span className="inline-flex items-center gap-1"><Calendar size={10} />{new Date(p.published_at).toLocaleDateString()}</span>}
                  {p.reading_time > 0 && <span className="inline-flex items-center gap-1"><Clock size={10} />{p.reading_time} min</span>}
                  <span className="ml-auto inline-flex items-center gap-0.5 group-hover:gap-1.5 transition-all">Read <ChevronRight size={10} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
