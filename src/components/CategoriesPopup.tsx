import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStoreSettings } from '@/hooks/useSupabase';
import { X } from 'lucide-react';

type Item = { label: string; image: string; link: string };

const defaultItems: Item[] = [
  { label: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', link: '/?category=Footwear' },
  { label: 'Accessories', image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80', link: '/?category=Accessories' },
  { label: 'Toys & Gaming', image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400&q=80', link: '/?category=Toys' },
  { label: 'Baby Gear', image: 'https://images.unsplash.com/photo-1591147834506-fde07cdcfc6e?w=400&q=80', link: '/?category=Baby-Gear' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const CategoriesPopup = ({ open, onClose }: Props) => {
  const { data: s = {} } = useStoreSettings();
  const title = s['categories_popup_title'] || 'Shop by Category';

  let items: Item[] = defaultItems;
  try {
    if (s['categories_popup_items']) {
      const parsed = JSON.parse(s['categories_popup_items']);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } else if (s['explore_cats_items']) {
      const parsed = JSON.parse(s['explore_cats_items']);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    }
  } catch {}

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 rounded-t-3xl border-t border-border bg-background"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-5 pt-4 pb-3 border-b border-border relative">
            <div className="mx-auto w-10 h-1 bg-muted-foreground/30 rounded-full mb-3" />
            <SheetTitle className="text-center text-base font-extrabold tracking-[0.15em] uppercase text-foreground">
              {title}
            </SheetTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted/60 transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-foreground/70" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((cat) => (
                <Link
                  key={cat.label + cat.link}
                  to={cat.link}
                  onClick={onClose}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted/40 border border-border/60 shadow-sm group-active:scale-95 transition-transform">
                    <img
                      src={cat.image}
                      alt={cat.label}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                    {cat.label}
                  </div>
                </Link>
              ))}
            </div>
            {items.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                No categories available.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CategoriesPopup;
