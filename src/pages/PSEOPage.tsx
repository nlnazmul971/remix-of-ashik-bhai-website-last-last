import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';

const PSEOPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('pseo_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (!data) { setNotFound(true); }
      else {
        setPage(data);
        supabase.from('pseo_pages').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id).then(() => {});
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><CartDrawer />
        <main className="max-w-md mx-auto px-4 pt-40 text-center">
          <h1 className="luxury-heading text-3xl mb-4">Page Not Found</h1>
          <Link to="/" className="text-sm underline text-muted-foreground">Back to home</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={page.title}
        description={page.description}
        path={`/p/${slug}`}
        keywords={page.seo_keywords}
        image={page.seo_og_image}
        jsonLd={page.seo_schema}
      />
      <Header />
      <CartDrawer />
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {page.h1 && <h1 className="luxury-heading text-3xl md:text-5xl mb-6">{page.h1}</h1>}
        <article className="prose prose-neutral dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
      </main>
      <Footer />
    </div>
  );
};

export default PSEOPage;
