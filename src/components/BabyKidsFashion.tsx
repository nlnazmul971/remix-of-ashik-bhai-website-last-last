import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';

type Item = { label: string; sublabel: string; image: string; link: string };

const defaultGirls: Item[] = [
  { label: '0 - 6', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80', link: '/?category=Girls&sub=0-6-months' },
  { label: '6 - 24', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80', link: '/?category=Girls&sub=6-24-months' },
  { label: '2 - 4', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80', link: '/?category=Girls&sub=2-4-years' },
  { label: '4 - 6', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=600&q=80', link: '/?category=Girls&sub=4-6-years' },
  { label: '6 - 14', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=600&q=80', link: '/?category=Girls&sub=6-14-years' },
];

const defaultBoys: Item[] = [
  { label: '0 - 6', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=600&q=80', link: '/?category=Boys&sub=0-6-months' },
  { label: '6 - 24', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=600&q=80', link: '/?category=Boys&sub=6-24-months' },
  { label: '2 - 4', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80', link: '/?category=Boys&sub=2-4-years' },
  { label: '4 - 6', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80', link: '/?category=Boys&sub=4-6-years' },
  { label: '6 - 14', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80', link: '/?category=Boys&sub=6-14-years' },
];

const Card = ({ item, slotKey }: { item: Item; slotKey: string }) => (
  <Link to={`/?placement=${encodeURIComponent(slotKey)}`} className="group flex flex-col items-center text-center">
    <div className="w-full aspect-square overflow-hidden rounded-md bg-muted">
      <img
        src={item.image}
        alt={`${item.label} ${item.sublabel}`}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="mt-2 sm:mt-3 text-sm sm:text-base font-bold text-foreground">
      {item.label}
    </div>
    <div className="text-[11px] sm:text-xs text-muted-foreground">
      {item.sublabel}<span className="ml-0.5">›</span>
    </div>
  </Link>
);

const BabyKidsFashion = () => {
  const { data: s = {} } = useStoreSettings();
  const enabled = s['baby_kids_enabled'] !== 'false';
  const title = s['baby_kids_title'] || 'Baby & Kids Fashion';
  let rows: Item[][] = [defaultGirls, defaultBoys];
  try {
    if (s['baby_kids_rows']) rows = JSON.parse(s['baby_kids_rows']);
  } catch {}

  if (!enabled || rows.length === 0) return null;

  return (
    <section className="py-4 sm:py-8 bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-base sm:text-2xl font-extrabold tracking-[0.15em] uppercase mb-6 sm:mb-10 text-foreground">
          {title}
        </h2>

        <div className="space-y-5 sm:space-y-8">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-5 gap-2 sm:gap-4">
              {row.map((item, ii) => (
                <Card key={`r${ri}-${ii}-${item.label}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BabyKidsFashion;
