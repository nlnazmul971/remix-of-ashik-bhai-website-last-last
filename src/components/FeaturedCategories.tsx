import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';
import { MOCK_FEATURED_CATEGORIES } from '@/data/mockData';

export type FeaturedCategory = {
  image: string;
  label: string;
  link: string;
};

const FeaturedCategories = () => {
  const { data: settings = {} } = useStoreSettings();
  const raw = settings['homepage_featured_categories'];
  const parsed: FeaturedCategory[] = raw ? JSON.parse(raw) : [];
  const items = parsed.length > 0 ? parsed : MOCK_FEATURED_CATEGORIES;

  if (items.length === 0) return null;

  return (
    <section className="w-full bg-background py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-wide mb-6 sm:mb-8 text-foreground">
          FEATURED CATEGORIES
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((cat, i) => (
            <Link
              key={i}
              to={cat.link || '/'}
              className="group flex flex-col items-center text-center"
            >
              <div className="w-full aspect-square rounded-xl border-2 border-[hsl(var(--announce))] bg-card overflow-hidden p-2 sm:p-3 transition-transform group-hover:scale-[1.02]">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-semibold text-foreground leading-tight">
                {cat.label}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
