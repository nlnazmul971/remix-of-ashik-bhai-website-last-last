import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';

type Item = { label: string; image: string; link: string };

const ExploreCategories = () => {
  const { data: s = {} } = useStoreSettings();
  const enabled = s['explore_cats_enabled'] !== 'false';
  const title = s['explore_cats_title'] || 'Explore Categories';
  let items: Item[] = [];
  try {
    if (s['explore_cats_items']) items = JSON.parse(s['explore_cats_items']);
  } catch {}

  if (!enabled || items.length === 0) return null;

  return (
    <section className="w-full bg-background py-1 sm:py-2">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <h2 className="text-center text-base sm:text-2xl font-extrabold tracking-[0.15em] uppercase mb-1 sm:mb-2 text-foreground">
          {title}
        </h2>

        <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 sm:gap-6 xl:gap-4">
          {items.map((cat, idx) => (

            <Link
              key={cat.label}
              to={`/?placement=${encodeURIComponent(`explore-categories:${idx}`)}`}
              className="group flex flex-col items-center text-center"
            >
              <div className="relative w-full aspect-[3/4] flex items-end justify-center">
                
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="relative w-full h-[92%] object-contain transition-transform duration-500 group-hover:-translate-y-1"
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

export default ExploreCategories;
