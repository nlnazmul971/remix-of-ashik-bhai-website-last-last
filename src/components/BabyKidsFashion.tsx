import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

type Item = { label: string; sublabel: string; image: string; link: string };

const girls: Item[] = [
  { label: '0 – 6', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80', link: '/?category=Girls&sub=0-6-months' },
  { label: '6 – 24', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80', link: '/?category=Girls&sub=6-24-months' },
  { label: '2 – 4', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80', link: '/?category=Girls&sub=2-4-years' },
  { label: '4 – 6', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=600&q=80', link: '/?category=Girls&sub=4-6-years' },
  { label: '6 – 14', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=600&q=80', link: '/?category=Girls&sub=6-14-years' },
];

const boys: Item[] = [
  { label: '0 – 6', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=600&q=80', link: '/?category=Boys&sub=0-6-months' },
  { label: '6 – 24', sublabel: 'Months', image: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=600&q=80', link: '/?category=Boys&sub=6-24-months' },
  { label: '2 – 4', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80', link: '/?category=Boys&sub=2-4-years' },
  { label: '4 – 6', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80', link: '/?category=Boys&sub=4-6-years' },
  { label: '6 – 14', sublabel: 'Years', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80', link: '/?category=Boys&sub=6-14-years' },
];

const Card = ({ item }: { item: Item }) => (
  <Link to={item.link} className="group flex flex-col items-center text-center">
    <div className="relative w-full aspect-square overflow-hidden rounded-full ring-1 ring-border bg-muted shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 group-hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] group-hover:ring-foreground/40">
      {/* subtle gold ring on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-amber-300/0 group-hover:ring-2 group-hover:ring-amber-300/60 transition-all duration-500" />
      <img
        src={item.image}
        alt={`${item.label} ${item.sublabel}`}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* soft vignette */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
      {/* hover arrow chip */}
      <span className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <ArrowUpRight size={12} className="text-foreground" />
      </span>
    </div>
    <div className="mt-3 sm:mt-4">
      <div className="text-[13px] sm:text-base tracking-[0.08em] text-foreground" style={{ fontFamily: 'Cormorant Garamond, Playfair Display, Georgia, serif', fontWeight: 600 }}>
        {item.label}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted-foreground transition-colors group-hover:text-foreground">
        {item.sublabel}
      </div>
    </div>
  </Link>
);

const RowLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
    <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-muted-foreground">
      {children}
    </span>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
  </div>
);

const BabyKidsFashion = () => {
  return (
    <section className="relative py-14 sm:py-24 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
      {/* decorative blurred orbs */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-100/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-rose-100/30 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
            Curated Collection
          </div>
          <h2
            className="text-3xl sm:text-5xl tracking-[0.04em] text-foreground"
            style={{ fontFamily: 'Cormorant Garamond, Playfair Display, Georgia, serif', fontWeight: 500 }}
          >
            Baby <span className="italic text-amber-700/80">&amp;</span> Kids Fashion
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="h-px w-8 bg-foreground/40" />
            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/70" />
            <span className="h-px w-8 bg-foreground/40" />
          </div>
          <p className="mt-4 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Thoughtfully designed essentials for every little chapter — from first cuddles to bold adventures.
          </p>
        </div>

        <div className="space-y-10 sm:space-y-14">
          <div>
            <RowLabel>For Her</RowLabel>
            <div className="grid grid-cols-5 gap-3 sm:gap-6">
              {girls.map((item) => (
                <Card key={`g-${item.label}`} item={item} />
              ))}
            </div>
          </div>
          <div>
            <RowLabel>For Him</RowLabel>
            <div className="grid grid-cols-5 gap-3 sm:gap-6">
              {boys.map((item) => (
                <Card key={`b-${item.label}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BabyKidsFashion;
