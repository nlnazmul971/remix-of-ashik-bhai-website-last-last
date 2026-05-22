import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';

type Poster = { image: string; link: string; alt: string };

const defaultPosters: Poster[] = [
  { image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&q=80', link: '/?category=Boys', alt: 'Boys Collection' },
  { image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&q=80', link: '/?category=Girls', alt: 'Girls Collection' },
];

const PromoPosters = () => {
  const { data: s = {} } = useStoreSettings();
  const enabled = s['promo_posters_enabled'] !== 'false';
  let posters: Poster[] = defaultPosters;
  try {
    if (s['promo_posters_items']) posters = JSON.parse(s['promo_posters_items']);
  } catch {}

  if (!enabled || posters.length === 0) return null;

  return (
    <section className="w-full bg-background py-3 sm:py-6">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className={`grid gap-3 sm:gap-5 ${posters.length === 1 ? 'grid-cols-1' : posters.length >= 3 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
          {posters.map((p, i) => (
            <Link
              key={i}
              to={p.link}
              className="block overflow-hidden rounded-xl sm:rounded-2xl bg-muted group"
            >
              <img
                src={p.image}
                alt={p.alt}
                loading="lazy"
                className="w-full h-auto aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoPosters;
