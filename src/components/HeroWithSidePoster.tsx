import { Link } from 'react-router-dom';
import Hero from './Hero';
import { useStoreSettings } from '@/hooks/useSupabase';

/**
 * Desktop-only side poster next to the hero slider.
 * Mobile/tablet view stays identical — only renders Hero.
 */
const HeroWithSidePoster = () => {
  const { data: s = {} } = useStoreSettings();
  const img = s['hero_side_poster_image'];
  const link = s['hero_side_poster_link'] || '/';
  const alt = s['hero_side_poster_alt'] || 'Promotion';
  const enabled = s['hero_side_poster_enabled'] !== 'false';

  if (!img || !enabled) return <Hero />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_460px]">
      <Hero />
      <Link
        to={link}
        aria-label={alt}
        className="hidden lg:block relative overflow-hidden bg-muted h-screen group"
      >
        <img
          src={img}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </Link>
    </div>
  );
};

export default HeroWithSidePoster;
