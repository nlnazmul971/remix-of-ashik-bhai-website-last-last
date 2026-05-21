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
        <h2 className="text-center text-base sm:text-2xl font-extrabold tracking-[0.15em] uppercase mb-6 sm:mb-10 text-foreground">
          FEATURED CATEGORIES
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4">
          {items.map((cat, i) => (
            <Link
              key={i}
              to={cat.link || '/'}
              className="group flex flex-col items-center text-center"
            >
              <div className="relative w-full aspect-square flex items-center justify-center">
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-[14%] rounded-[50%] bg-[hsl(var(--announce)/0.18)] blur-[1px]" />
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="mt-2 sm:mt-3 text-[11px] sm:text-sm font-semibold text-foreground leading-tight">
                {cat.label}<span className="ml-0.5">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
