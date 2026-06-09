import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, Headphones, ShieldCheck, Award, Heart, Sparkles, Gift, Star, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useSupabase';
import { supabase } from '@/integrations/supabase/client';

const ICONS: Record<string, any> = {
  truck: Truck, rotate: RotateCcw, headphones: Headphones, shield: ShieldCheck,
  award: Award, heart: Heart, sparkles: Sparkles, gift: Gift, star: Star, bag: ShoppingBag,
};

const safeJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { data: s } = useStoreSettings();

  // If store settings haven't loaded (DB not connected / empty) hide footer entirely.
  if (!s || Object.keys(s).length === 0) return null;

  const brandName = s?.footer_brand_name || '';
  const address = s?.footer_address || '';
  const phone = s?.footer_phone || '';
  const footerEmail = s?.footer_email || '';
  const facebookUrl = s?.footer_facebook || '';
  const instagramUrl = s?.footer_instagram || '';
  const messengerUrl = s?.footer_messenger || '';
  const whatsappUrl = s?.footer_whatsapp || '';
  const copyright = s?.footer_copyright || '';
  const newsletterText = s?.footer_newsletter_text || '';

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const emailLower = email.trim().toLowerCase();
      const { data: existing } = await supabase.from('newsletter_subscribers').select('id').eq('email', emailLower).maybeSingle();
      if (existing) {
        toast.info('You are already subscribed!');
      } else {
        const { error } = await supabase.from('newsletter_subscribers').insert({ email: emailLower });
        if (error) throw error;
        toast.success('Subscribed successfully!');
      }
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const trustItems = safeJson<Array<{ icon?: string; title?: string; title2?: string }>>(
    s?.footer_trust_items, []
  );
  const collectionLinks = safeJson<Array<{ label: string; to: string }>>(s?.footer_collection_links, []);
  const policyLinks = safeJson<Array<{ label: string; to: string }>>(s?.footer_policy_links, []);
  const collectionHeading = s?.footer_collection_heading || '';
  const policyHeading = s?.footer_policy_heading || '';


  return (
    <footer className="bg-background text-foreground border-t border-border mt-12 pb-[120px] sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 sm:py-10">

        {/* Newsletter */}
        {newsletterText && (
          <div className="mb-7 sm:mb-9 max-w-xl">
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 uppercase tracking-[0.1em]">{newsletterText}</p>

            <form onSubmit={handleNewsletter} className="flex border-b border-border pb-1.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="bg-transparent w-full text-[10px] tracking-widest outline-none placeholder:text-muted-foreground/60 uppercase text-foreground"
              />
              <button type="submit" disabled={subscribing} className="text-[10px] tracking-widest font-medium uppercase text-foreground/70 ml-4 hover:text-foreground transition-colors disabled:opacity-50">
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        )}

        {/* Brand & Contact */}
        {(brandName || address || phone || footerEmail) && (
          <div className="mb-7 sm:mb-9 text-center">
            {brandName && <h2 className="font-['Cormorant_Garamond',serif] text-3xl sm:text-4xl tracking-tight mb-2 text-foreground">{brandName}</h2>}
            <div className="space-y-0.5 text-[10px] tracking-widest text-muted-foreground uppercase">
              {address && <p>{address}</p>}
              {(phone || footerEmail) && <p>{phone}{phone && footerEmail ? ' • ' : ''}{footerEmail}</p>}
            </div>
            <div className="flex justify-center gap-5 mt-3">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-foreground/60 hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-foreground/60 hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.44-1.441 1.44-1.44-.645-1.44-1.44.645-1.44 1.44-1.44z"/></svg>
                </a>
              )}
              {messengerUrl && (
                <a href={messengerUrl} target="_blank" rel="noopener noreferrer" aria-label="Messenger" className="text-foreground/60 hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-foreground/60 hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        {(collectionLinks.length > 0 || policyLinks.length > 0) && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-7 sm:mb-9 sm:max-w-md sm:mx-auto">
            {collectionLinks.length > 0 && (
              <div>
                {collectionHeading && <h4 className="text-[10px] font-semibold tracking-[0.2em] mb-2.5 text-foreground uppercase">{collectionHeading}</h4>}
                <ul className="space-y-1.5">
                  {collectionLinks.map((l, i) => (
                    <li key={i}><Link to={l.to} className="text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            )}
            {policyLinks.length > 0 && (
              <div>
                {policyHeading && <h4 className="text-[10px] font-semibold tracking-[0.2em] mb-2.5 text-foreground uppercase">{policyHeading}</h4>}
                <ul className="space-y-1.5">
                  {policyLinks.map((l, i) => (
                    <li key={i}><Link to={l.to} className="text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Trust Badges */}
        {trustItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-border">
            {trustItems.map((it, i) => {
              const Icon = ICONS[(it.icon || 'truck').toLowerCase()] || Truck;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center shrink-0">
                    <Icon size={13} strokeWidth={1.25} className="text-foreground/60" />
                  </div>
                  <span className="text-[9px] tracking-widest text-foreground uppercase leading-tight">
                    {it.title}{it.title2 && <><br />{it.title2}</>}
                  </span>
                </div>
              );
            })}
          </div>
        )}


        {/* Copyright */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
            {(() => {
              const re = /md\.?\s*nazmul\s+hasan\s+limon/i;
              const match = copyright.match(re);
              if (!match) return copyright;
              const idx = match.index!;
              return (
                <>
                  {copyright.slice(0, idx)}
                  <a
                    href="https://www.facebook.com/nazmul.hasan.limon.432704"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    {copyright.slice(idx, idx + match[0].length)}
                  </a>
                  {copyright.slice(idx + match[0].length)}
                </>
              );
            })()}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
