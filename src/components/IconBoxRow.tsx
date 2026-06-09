import { Truck, RotateCcw, Headphones, ShieldCheck, Award, Heart, Sparkles, Gift, Star, ShoppingBag } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';

const ICONS: Record<string, any> = {
  truck: Truck, rotate: RotateCcw, headphones: Headphones, shield: ShieldCheck,
  award: Award, heart: Heart, sparkles: Sparkles, gift: Gift, star: Star, bag: ShoppingBag,
};

type Item = { icon?: string; title?: string; desc?: string };

const IconBoxRow = () => {
  const { data: s = {} } = useStoreSettings();
  let items: Item[] = [];
  try {
    items = JSON.parse(s['icon_box_items'] || '[]');
  } catch {}
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="border-t border-border mt-20 sm:mt-28">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
          {items.map((it, i) => {
            const Icon = ICONS[(it.icon || 'truck').toLowerCase()] || Truck;
            return (
              <div key={i} className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-foreground leading-tight mb-1">{it.title}</h4>
                  {it.desc && <p className="text-xs text-muted-foreground leading-snug">{it.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IconBoxRow;
