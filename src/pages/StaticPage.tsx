import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SEO from '@/components/SEO';
import { useStoreSettings } from '@/hooks/useSupabase';

type Props = {
  path: string;
  title: string;
  /** store_settings key holding the HTML body (e.g. 'page_about_html') */
  contentKey: string;
};

const StaticPage = ({ path, title, contentKey }: Props) => {
  const { data: s = {} } = useStoreSettings();
  const html = (s as any)[contentKey] || '';
  const customTitle = (s as any)[`${contentKey}_title`] || title;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={customTitle} path={path} />
      <Header />
      <CartDrawer />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        <h1 className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-center mb-4">{customTitle}</h1>
        <div className="w-12 h-px bg-foreground mx-auto mb-10" />
        {html ? (
          <div
            className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-medium [&_h2]:text-lg [&_h2]:tracking-wide [&_h2]:mt-8 [&_strong]:text-foreground [&_a]:text-foreground [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-center text-sm text-muted-foreground italic">
            Ei page er content ekhono add kora hoy nai. Admin → Static Pages theke edit korun.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StaticPage;
