import { Mail, Facebook, Instagram } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useSupabase';

const TopBar = () => {
  const { data: s = {} } = useStoreSettings();
  const email = s['footer_email'] || 'info@highlights.com';
  const facebook = s['footer_facebook'] || '#';
  const instagram = s['footer_instagram'] || '#';
  const tagline = s['header_tagline'] || 'HIGHLIGHTS — A MODERN BANGLADESHI CLOTHING BRAND';

  return (
    <>
      <div className="hidden sm:block border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start gap-6 h-10 text-[11px] tracking-[0.08em] text-muted-foreground">
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
      <div className="hidden sm:block border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-center">
          <p className="text-[12px] tracking-[0.25em] uppercase text-foreground/80 font-medium">{tagline}</p>
        </div>
      </div>
    </>
  );
};

export default TopBar;
