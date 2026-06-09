import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';

const AnnouncementBar = () => {
  const { data: s = {} } = useStoreSettings();
  const [dismissed, setDismissed] = useState(true);

  const message = s['announcement_text'] || '';
  const enabled = s['announcement_enabled'] !== 'false';

  useEffect(() => {
    const v = sessionStorage.getItem('announcement_dismissed');
    setDismissed(v === '1');
  }, []);

  if (!enabled || dismissed || !message) return null;

  return (
    <div
      className="relative w-full text-[11px] sm:text-[12px] tracking-[0.05em] font-medium"
      style={{ backgroundColor: 'hsl(var(--announce))', color: 'hsl(var(--announce-foreground))' }}
    >
      <div className="overflow-hidden whitespace-nowrap py-2 px-10 text-center">
        {message} <span className="ml-1">🏷️</span>
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
