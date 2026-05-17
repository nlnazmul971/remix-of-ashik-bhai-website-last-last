import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';

const AnnouncementBar = () => {
  const { data: s = {} } = useStoreSettings();
  const [dismissed, setDismissed] = useState(true);

  const message = s['announcement_text'] || 'FREE SHIPPING ON ORDERS OVER TK 2000 — SHOP NOW';
  const enabled = s['announcement_enabled'] !== 'false';

  useEffect(() => {
    const v = sessionStorage.getItem('announcement_dismissed');
    setDismissed(v === '1');
  }, []);

  if (!enabled || dismissed) return null;

  return (
    <div className="relative w-full bg-primary text-primary-foreground text-[11px] sm:text-xs tracking-[0.15em] uppercase font-medium">
      <div className="overflow-hidden whitespace-nowrap py-2.5 px-12 text-center">
        {message}
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem('announcement_dismissed', '1');
          setDismissed(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
