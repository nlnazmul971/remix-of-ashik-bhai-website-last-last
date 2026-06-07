import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useSupabase';

type Item = { label: string; sublabel: string; image: string; link: string };

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
  let rows: Item[][] = [];
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
                <Card key={`r${ri}-${ii}-${item.label}`} item={item} slotKey={`baby-kids:${ri}:${ii}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BabyKidsFashion;
