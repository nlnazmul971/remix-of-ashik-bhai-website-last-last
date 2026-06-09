import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';
import { renderBlock, type LandingBlock } from '@/components/landing/LandingBlocks';

/**
 * Tries to resolve a landing page by:
 *  1) current hostname (custom_domain match), OR
 *  2) current path matched against custom_path
 * If matched + published, renders it. Otherwise falls back to provided <fallback>.
 */
const LandingResolver = ({ fallback }: { fallback: React.ReactNode }) => {
  const location = useLocation();
  const [state, setState] = useState<'loading' | 'found' | 'notfound'>('loading');
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const host = window.location.hostname;
        const path = location.pathname;

        // Try domain match first
        let { data } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('status', 'published')
          .eq('custom_domain', host)
          .maybeSingle();

        // Else try custom_path match
        if (!data) {
          const r = await supabase
            .from('landing_pages')
            .select('*')
            .eq('status', 'published')
            .eq('custom_path', path)
            .maybeSingle();
          data = r.data as any;
        }

        if (cancelled) return;
        if (data) {
          setPage(data);
          setState('found');
          supabase.from('landing_page_analytics').insert({
            landing_page_id: data.id,
            event_type: 'view',
            metadata: { path, host, referrer: document.referrer },
          } as any).then(() => {});
        } else {
          setState('notfound');
        }
      } catch {
        if (!cancelled) setState('notfound');
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'notfound' || !page) return <>{fallback}</>;

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
        path={location.pathname}
        image={page.seo_og_image}
        keywords={page.seo_keywords}
        noIndex={page.seo_no_index}
        jsonLd={jsonLd}
      />
      <Header />
      <CartDrawer />
      <main>{blocks.map((b, i) => renderBlock(b, i))}</main>
      <Footer />
    </div>
  );
};

export default LandingResolver;
