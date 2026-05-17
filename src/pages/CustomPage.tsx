import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import NotFound from '@/pages/NotFound';
import SEO from '@/components/SEO';
import { Product } from '@/data/products';

type Page = { id: string; slug: string; title: string; banner_url: string; is_active: boolean; product_ids: string[] };

const CustomPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.from('custom_pages').select('*').eq('slug', slug || '').maybeSingle();
      if (cancel) return;
      const p = (data as any) || null;
      setPage(p ? { ...p, product_ids: p.product_ids || [] } : null);
      if (p && p.product_ids && p.product_ids.length > 0) {
        const { data: prods } = await supabase.from('products').select('*').in('id', p.product_ids);
        if (!cancel) {
          // preserve admin order
          const ordered = (p.product_ids as string[])
            .map(id => (prods as any[] || []).find(x => x.id === id))
            .filter(Boolean) as Product[];
          setProducts(ordered);
        }
      }
    })();
    return () => { cancel = true; };
  }, [slug]);

  if (page === undefined) return <div className="min-h-screen" />;
  if (!page || !page.is_active) return <NotFound />;

  return (
    <>
      <SEO
        title={page.title || page.slug}
        description={`${page.title || page.slug} — collection at HIGHLIGHTS.`}
        path={`/page/${page.slug}`}
        image={page.banner_url}
      />
      <Header />
      <main className="pt-28 sm:pt-36 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {page.title && <h1 className="luxury-heading text-2xl sm:text-3xl text-center mb-6">{page.title}</h1>}
        <img src={page.banner_url} alt={page.title || page.slug} className="w-full h-auto" />

        {products.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default CustomPage;
