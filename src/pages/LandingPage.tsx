import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';
import { renderBlock, type LandingBlock } from '@/components/landing/LandingBlocks';

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data);
        // Fire-and-forget view tracking
        supabase.from('landing_page_analytics').insert({
          landing_page_id: data.id,
          event_type: 'view',
          metadata: { path: `/l/${slug}`, referrer: document.referrer },
        }).then(() => {});
        supabase.rpc as any;
        supabase.from('landing_pages').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id).then(() => {});
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
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

  const blocks: LandingBlock[] = Array.isArray(page.blocks) ? page.blocks : [];
  const jsonLd = page.seo_schema || {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.seo_title || page.title,
    description: page.seo_description || page.description,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={page.seo_title || page.title}
        description={page.seo_description || page.description}
        path={`/l/${slug}`}
        image={page.seo_og_image}
        keywords={page.seo_keywords}
        noIndex={page.seo_no_index}
        jsonLd={jsonLd}
      />
      <Header />
      <CartDrawer />
      <main>
        {blocks.map((b, i) => renderBlock(b, i))}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
