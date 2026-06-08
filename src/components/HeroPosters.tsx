import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';

type HeroPoster = { image: string; link: string; alt: string; title?: string; subtitle?: string };

const HeroPosters = () => {
  const { data: s = {} } = useStoreSettings();
  const enabled = s['hero_posters_enabled'] !== 'false';
  let posters: HeroPoster[] = [];
  try {
    if (s['hero_posters_items']) posters = JSON.parse(s['hero_posters_items']);
  } catch {}
  posters = posters.slice(0, 2);
  if (!enabled || posters.length === 0) return null;

  return (
    <section className="w-full bg-background py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {posters.map((p, i) => (
            <Link
              key={i}
              to={p.link || '/'}
              className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl bg-muted aspect-[3/4] shadow-sm hover:shadow-xl transition-shadow"
            >
              <img
                src={p.image}
                alt={p.alt || p.title || 'Promotion poster'}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {(p.title || p.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
              )}
              {(p.title || p.subtitle) && (
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-background">
                  {p.subtitle && <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase opacity-90">{p.subtitle}</p>}
                  {p.title && <p className="luxury-heading text-lg sm:text-2xl mt-1">{p.title}</p>}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroPosters;
