import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';
import { useStoreSettings } from '@/hooks/useSupabase';
import { Calendar, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { extractTOC, injectHeadingIds } from '@/lib/blogHelpers';
import { toast } from 'sonner';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: settings = {} } = useStoreSettings();
  const baseUrl = (settings['seo_base_url'] || '').replace(/\/+$/, '');
  const brand = settings['seo_brand_name'] || settings['footer_brand_name'] || '';

  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', comment: '' });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('blogs').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
      if (!data) { setPost(null); setLoading(false); return; }
      setPost(data);
      // increment view (best-effort)
      supabase.from('blogs').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id);

      const relatedQuery = supabase.from('blogs').select('id,title,slug,cover_image,excerpt,published_at')
        .eq('status', 'published')
        .neq('id', data.id)
        .order('published_at', { ascending: false }).limit(3);
      if (data.category_id) relatedQuery.eq('category_id', data.category_id);

      const [a, c, r, cm] = await Promise.all([
        data.author_id ? supabase.from('blog_authors').select('*').eq('id', data.author_id).maybeSingle() : Promise.resolve({ data: null }),
        data.category_id ? supabase.from('blog_categories').select('*').eq('id', data.category_id).maybeSingle() : Promise.resolve({ data: null }),
        relatedQuery,
        supabase.from('blog_comments').select('*').eq('blog_id', data.id).eq('is_approved', true).order('created_at', { ascending: false }),
      ]);
      setAuthor(a.data); setCategory(c.data); setRelated(r.data || []); setComments(cm.data || []);
      setLoading(false);
    })();
  }, [slug]);

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) { toast.error('Name and comment required'); return; }
    setPosting(true);
    const { error } = await supabase.from('blog_comments').insert({ blog_id: post.id, ...form });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Comment submitted for review');
    setForm({ name: '', email: '', comment: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header /><CartDrawer />
        <main className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Post not found" path={`/blog/${slug}`} noIndex />
        <Header /><CartDrawer />
        <main className="flex-1 max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-sm underline">← Back to blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const toc = extractTOC(post.content);
  const contentHtml = injectHeadingIds(post.content);
  const canonical = post.seo_canonical || `${baseUrl}/blog/${post.slug}`;

  const ldArray: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.seo_description || post.excerpt,
      image: post.seo_og_image || post.cover_image || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      author: author ? { '@type': 'Person', name: author.name } : { '@type': 'Organization', name: brand },
      publisher: { '@type': 'Organization', name: brand },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      keywords: post.seo_keywords || (post.tags || []).join(', '),
      wordCount: (post.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl || '/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  ];
  if (Array.isArray(post.faq) && post.faq.length) {
    ldArray.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((f: any) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        keywords={post.seo_keywords || undefined}
        path={`/blog/${post.slug}`}
        image={post.seo_og_image || post.cover_image}
        type="article"
        noIndex={post.seo_no_index}
        jsonLd={ldArray}
      />
      <Header /><CartDrawer />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-32 pb-16">
        <nav className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1">
          <Link to="/" className="hover:text-foreground">Home</Link><ChevronRight size={10} />
          <Link to="/blog" className="hover:text-foreground">Blog</Link><ChevronRight size={10} />
          {category && <><Link to={`/blog?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link><ChevronRight size={10} /></>}
          <span className="truncate">{post.title}</span>
        </nav>

        <article>
          <header className="mb-8">
            {category && <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">{category.name}</p>}
            <h1 className="luxury-heading text-3xl sm:text-4xl tracking-tight leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground mt-4">
              {author && <span>By {author.name}</span>}
              {post.published_at && <span className="inline-flex items-center gap-1"><Calendar size={10} />{new Date(post.published_at).toLocaleDateString()}</span>}
              {post.reading_time > 0 && <span className="inline-flex items-center gap-1"><Clock size={10} />{post.reading_time} min read</span>}
            </div>
          </header>

          {post.cover_image && (
            <div className="aspect-[16/9] overflow-hidden bg-muted mb-8">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {toc.length > 2 && (
            <aside className="border border-border p-4 mb-8 bg-muted/20">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Table of Contents</p>
              <ul className="space-y-1 text-sm">
                {toc.map((t, i) => (
                  <li key={i} className={t.level === 3 ? 'pl-4' : ''}>
                    <a href={`#${t.id}`} className="hover:underline">{t.text}</a>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div
            className="prose prose-neutral max-w-none prose-headings:luxury-heading prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-p:leading-relaxed prose-a:text-foreground prose-a:underline prose-img:my-6 prose-blockquote:border-l-foreground prose-blockquote:italic"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
              {post.tags.map((t: string) => (
                <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`} className="px-2 py-1 text-[10px] uppercase tracking-widest border border-border hover:bg-muted">#{t}</Link>
              ))}
            </div>
          )}

          {author?.bio && (
            <div className="flex items-start gap-4 mt-10 pt-6 border-t border-border">
              {author.avatar_url && <img src={author.avatar_url} alt={author.name} className="w-12 h-12 rounded-full object-cover" />}
              <div>
                <p className="text-sm font-medium">{author.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{author.bio}</p>
              </div>
            </div>
          )}

          {Array.isArray(post.faq) && post.faq.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="luxury-heading text-2xl tracking-tight mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {post.faq.map((f: any, i: number) => (
                  <details key={i} className="border border-border p-4 group">
                    <summary className="text-sm font-medium cursor-pointer list-none flex justify-between items-center">
                      {f.q}<ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-border">
            <h2 className="luxury-heading text-xl tracking-tight mb-6">Related Reads</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted mb-2">
                    {r.cover_image && <img src={r.cover_image} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <h3 className="text-sm font-medium leading-snug group-hover:underline">{r.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="luxury-heading text-xl tracking-tight mb-6 flex items-center gap-2"><MessageSquare size={16} /> Comments ({comments.length})</h2>
          <div className="space-y-4 mb-8">
            {comments.map(c => (
              <div key={c.id} className="border border-border p-3">
                <p className="text-xs"><strong>{c.name}</strong> <span className="text-muted-foreground">· {new Date(c.created_at).toLocaleDateString()}</span></p>
                <p className="text-sm mt-1">{c.comment}</p>
              </div>
            ))}
            {!comments.length && <p className="text-xs text-muted-foreground">Be the first to comment.</p>}
          </div>
          <form onSubmit={submitComment} className="space-y-3 border border-border p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="px-3 py-2 text-sm border border-border bg-background" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="px-3 py-2 text-sm border border-border bg-background" />
            </div>
            <textarea required value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Write a comment…" rows={4} className="w-full px-3 py-2 text-sm border border-border bg-background resize-y" />
            <button disabled={posting} className="px-4 py-2 text-xs uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50">{posting ? 'Posting…' : 'Post Comment'}</button>
            <p className="text-[10px] text-muted-foreground">Comments are reviewed before publishing.</p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
