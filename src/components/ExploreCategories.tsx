import { Link } from 'react-router-dom';

type Item = { label: string; image: string; link: string };

const items: Item[] = [
  { label: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', link: '/?category=Footwear' },
  { label: 'Accessories', image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80', link: '/?category=Accessories' },
  { label: 'Disney & Marvel', image: 'https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=400&q=80', link: '/?category=Disney' },
  { label: 'Toys & Gaming', image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400&q=80', link: '/?category=Toys' },
  { label: 'Baby Gear', image: 'https://images.unsplash.com/photo-1591147834506-fde07cdcfc6e?w=400&q=80', link: '/?category=Baby-Gear' },
  { label: 'Diapering & Potty Training', image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80', link: '/?category=Diapering' },
  { label: 'Bath & Skincare', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', link: '/?category=Bath' },
  { label: 'Feeding & Nursing', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=400&q=80', link: '/?category=Feeding' },
  { label: 'Health & Safety', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80', link: '/?category=Health' },
  { label: 'Baby Nursery', image: 'https://images.unsplash.com/photo-1586683086728-acb591f0bdaa?w=400&q=80', link: '/?category=Nursery' },
  { label: 'Art & Hobbies', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80', link: '/?category=Art' },
  { label: 'Books', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', link: '/?category=Books' },
  { label: 'School Supplies', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80', link: '/?category=School' },
  { label: 'Slides, Tents & Sports', image: 'https://images.unsplash.com/photo-1597843797341-f9c206d0fe16?w=400&q=80', link: '/?category=Sports' },
  { label: 'Home & Living', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80', link: '/?category=Home' },
  { label: 'Birthday & Gifts', image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80', link: '/?category=Gifts' },
];

const ExploreCategories = () => {
  return (
    <section className="w-full bg-background py-2 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-base sm:text-2xl font-extrabold tracking-[0.15em] uppercase mb-3 sm:mb-5 text-foreground">
          Explore Categories
        </h2>

        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          {items.map((cat) => (
            <Link
              key={cat.label}
              to={cat.link}
              className="group flex flex-col items-center text-center"
            >
              <div className="relative w-full aspect-[3/4] flex items-end justify-center">
                <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[85%] h-[12%] rounded-[50%] bg-[hsl(200_80%_85%)]" />
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
