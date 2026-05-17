import { useEffect, useState, useRef } from 'react';
import { Search, X, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  category?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const TRENDING = ['Shirt', 'T-Shirt', 'Panjabi', 'Pant', 'Winter'];
const RECENT_KEY = 'recent_searches';

const SearchOverlay = ({ open, onClose, query, setQuery, onSubmit }: Props) => {
  const navigate = useNavigate();
  const [debounced, setDebounced] = useState(query);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['search-suggestions', debounced],
    queryFn: async () => {
      if (!debounced) return [] as Product[];
      const { data } = await supabase
        .from('products')
        .select('id,name,price,original_price,image_url,category')
        .ilike('name', `%${debounced}%`)
        .eq('is_active', true)
        .limit(8);
      return (data as Product[]) || [];
    },
    enabled: open && debounced.length > 0,
    staleTime: 30_000,
  });

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
  };

  const goSearch = (term: string) => {
    saveRecent(term);
    navigate(`/?search=${encodeURIComponent(term)}`);
    setQuery('');
    onClose();
  };

  const goProduct = (p: Product) => {
    saveRecent(p.name);
    navigate(`/product/${p.id}`);
    setQuery('');
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) goSearch(query.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mx-auto mt-2 sm:mt-10 max-w-2xl w-[calc(100%-1rem)] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
        {/* Search bar */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-border">
          <Search size={20} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, categories..."
            className="flex-1 bg-transparent outline-none text-base sm:text-lg placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 hover:opacity-60 text-muted-foreground">
              <X size={16} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="ml-1 p-1.5 rounded-full hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </form>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* No query state */}
          {!debounced && (
            <div className="p-5 space-y-6">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <Clock size={12} /> Recent
                    </div>
                    <button
                      onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                      className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map(r => (
                      <button
                        key={r}
                        onClick={() => goSearch(r)}
                        className="px-3 py-1.5 text-sm border border-border rounded-full hover:bg-foreground hover:text-background transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <TrendingUp size={12} /> Trending
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map(t => (
                    <button
                      key={t}
                      onClick={() => goSearch(t)}
                      className="px-3 py-1.5 text-sm border border-border rounded-full hover:bg-foreground hover:text-background transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Query state */}
          {debounced && (
            <div className="p-2">
              {isFetching && suggestions.length === 0 && (
                <div className="p-6 space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-14 h-14 bg-muted rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isFetching && suggestions.length === 0 && (
                <div className="p-10 text-center">
                  <div className="text-sm text-muted-foreground mb-3">No products match "{debounced}"</div>
                  <button
                    onClick={() => goSearch(debounced)}
                    className="text-xs uppercase tracking-wider underline underline-offset-4 hover:opacity-70"
                  >
                    Search anyway
                  </button>
                </div>
              )}

              {suggestions.length > 0 && (
                <ul className="divide-y divide-border">
                  {suggestions.map(p => {
                    const img = p.image_url;
                    const price = p.price;
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => goProduct(p)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/60 transition-colors text-left group"
                        >
                          <div className="w-14 h-14 bg-muted rounded overflow-hidden shrink-0">
                            {img && <img src={img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {p.category ? `${p.category} · ` : ''}৳{price}
                            </div>
                          </div>
                          <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      onClick={() => goSearch(debounced)}
                      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/60 transition-colors text-sm"
                    >
                      <span>See all results for <span className="font-medium">"{debounced}"</span></span>
                      <ArrowUpRight size={16} />
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
