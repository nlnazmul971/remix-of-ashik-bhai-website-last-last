import { Mail, Facebook, Instagram } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';

const TopBar = () => {
  const { data: s = {} } = useStoreSettings();
  const email = s['footer_email'] || 'ptexfashion@gmail.com';
  const facebook = s['footer_facebook'] || '#';
  const instagram = s['footer_instagram'] || '#';

  return (
    <div className="hidden sm:block border-b border-border bg-background">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start gap-6 h-9 text-[12px] text-muted-foreground">
          <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Mail size={13} />
            <span className="lowercase">{email}</span>
          </a>
          <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Facebook size={13} />
            <span>Facebook</span>
          </a>
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Instagram size={13} />
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
