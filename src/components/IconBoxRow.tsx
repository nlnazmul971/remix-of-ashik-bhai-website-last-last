import { Truck, RotateCcw, Headphones, ShieldCheck } from 'lucide-react';

const items = [
  { icon: Truck, title: 'Cash on Delivery', desc: 'Pay when you receive your order' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: Headphones, title: 'Dedicated Support', desc: '10am–10pm everyday' },
  { icon: ShieldCheck, title: 'Quality Guarantee', desc: 'Handpicked premium fabrics' },
];

const IconBoxRow = () => (
  <section className="border-t border-border mt-20 sm:mt-28">
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-medium text-foreground leading-tight mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default IconBoxRow;
