import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProducts, useStoreSettings } from '@/hooks/useSupabase';
import ProductCard from './ProductCard';

const NewArrivals = () => {
  const { data: dbProducts = [] } = useProducts();
  const { data: s = {} } = useStoreSettings();
  const enabled = s['new_arrivals_enabled'] !== 'false';
  const eyebrow = s['new_arrivals_eyebrow'] || 'Just In';
  const title = s['new_arrivals_title'] || 'New Arrivals';
  const viewAllLink = s['new_arrivals_view_all'] || '/?category=All';
  const limit = parseInt(s['new_arrivals_limit'] || '6', 10) || 6;
  let pickedIds: string[] = [];
  try { if (s['new_arrivals_product_ids']) pickedIds = JSON.parse(s['new_arrivals_product_ids']); } catch {}
  const source = dbProducts;
  const flagged = (source as any[]).filter(p => p.is_new_arrival);
  const products = pickedIds.length > 0
    ? pickedIds.map(id => (source as any[]).find(p => p.id === id)).filter(Boolean)
    : (flagged.length > 0 ? flagged.slice(0, limit) : source.slice(0, limit));

  if (!enabled || products.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-sky-50/40 to-background py-6 sm:py-10">
      <div className="max-w-full mx-auto px-3 sm:px-6">
        <div className="flex items-end justify-between mb-4 sm:mb-6 px-1">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-sky-600">{eyebrow}</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">{title}</h2>
          </div>
          <Link to={viewAllLink} className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-800 transition">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-5 xl:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} badgeLabel="NEW" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;

