import { useEffect, useState } from 'react';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Search, Globe, FileText, Tag, Image as ImageIcon, Shield, Code2 } from 'lucide-react';
import SEOHelp from './SEOHelp';

type Override = {
  path: string;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  noIndex?: boolean;
};

const PRESET_PATHS = ['/', '/about', '/contact', '/wishlist', '/privacy-policy', '/terms', '/refund-policy', '/shipping-policy'];

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-foreground/80 tracking-wide">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const SectionCard = ({ icon: Icon, title, desc, children }: any) => (
  <section className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-start gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon size={16} className="text-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-bold tracking-wide">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const AdminSEO = () => {
  const { data: settings = {}, isLoading } = useStoreSettings();
  const update = useUpdateStoreSetting();

  const [brand, setBrand] = useState('');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultDesc, setDefaultDesc] = useState('');
  const [defaultKeywords, setDefaultKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [locale, setLocale] = useState('en_US');
  const [robots, setRobots] = useState('');
  const [googleVerif, setGoogleVerif] = useState('');
  const [bingVerif, setBingVerif] = useState('');
  const [fbVerif, setFbVerif] = useState('');
  const [pinVerif, setPinVerif] = useState('');
  const [orgJsonLd, setOrgJsonLd] = useState('');
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setBrand(settings['seo_brand_name'] || 'Baby Store');
    setTitleTemplate(settings['seo_title_template'] || '{title} | {brand}');
    setDefaultTitle(settings['seo_default_title'] || 'Baby Store — Quality Baby Products');
    setDefaultDesc(settings['seo_default_description'] || 'Shop trusted baby products — clothing, gear, toys & essentials. Safe, gentle and made for little ones. Fast delivery & cash on delivery available.');
    setDefaultKeywords(settings['seo_default_keywords'] || 'baby products, baby clothing, baby toys, baby gear, baby essentials, newborn, infant, toddler');
    setOgImage(settings['seo_og_image'] || '');
    setTwitterHandle(settings['seo_twitter_handle'] || '');
    setBaseUrl(settings['seo_base_url'] || '');
    setLocale(settings['seo_locale'] || 'en_US');
    setRobots(settings['seo_robots'] || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setGoogleVerif(settings['seo_google_verification'] || '');
    setBingVerif(settings['seo_bing_verification'] || '');
    setFbVerif(settings['seo_facebook_verification'] || '');
    setPinVerif(settings['seo_pinterest_verification'] || '');
    setOrgJsonLd(settings['seo_organization_jsonld'] || '');
    try {
      const parsed = JSON.parse(settings['seo_page_overrides'] || '{}');
      const arr: Override[] = Object.entries(parsed).map(([path, v]: any) => ({ path, ...v }));
      setOverrides(arr);
    } catch { setOverrides([]); }
  }, [isLoading, settings]);

  const saveAll = async () => {
    // Validate JSON fields
    if (orgJsonLd.trim()) {
      try { JSON.parse(orgJsonLd); }
      catch { toast.error('Organization JSON-LD is not valid JSON'); return; }
    }
    const overridesObj: Record<string, any> = {};
    for (const o of overrides) {
      if (!o.path?.trim()) continue;
      const { path, ...rest } = o;
      const clean: any = {};
      Object.entries(rest).forEach(([k, v]) => { if (v !== '' && v !== undefined && v !== null) clean[k] = v; });
      overridesObj[path.trim()] = clean;
    }

    setSaving(true);
    try {
      const pairs: Array<[string, string]> = [
        ['seo_brand_name', brand],
        ['seo_title_template', titleTemplate],
        ['seo_default_title', defaultTitle],
        ['seo_default_description', defaultDesc],
        ['seo_default_keywords', defaultKeywords],
        ['seo_og_image', ogImage],
        ['seo_twitter_handle', twitterHandle],
        ['seo_base_url', baseUrl],
        ['seo_locale', locale],
        ['seo_robots', robots],
        ['seo_google_verification', googleVerif],
        ['seo_bing_verification', bingVerif],
        ['seo_facebook_verification', fbVerif],
        ['seo_pinterest_verification', pinVerif],
        ['seo_organization_jsonld', orgJsonLd],
        ['seo_page_overrides', JSON.stringify(overridesObj)],
      ];
      for (const [key, value] of pairs) {
        await update.mutateAsync({ key, value });
      }
      toast.success('SEO settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addOverride = (path = '') => setOverrides([...overrides, { path, title: '', description: '', keywords: '', image: '', noIndex: false }]);
  const removeOverride = (i: number) => setOverrides(overrides.filter((_, idx) => idx !== i));
  const updateOverride = (i: number, patch: Partial<Override>) =>
    setOverrides(overrides.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const titlePreview = (() => {
    const t = defaultTitle || brand;
    if (t === brand) return brand;
    return (titleTemplate || '{title} | {brand}').replace('{title}', t).replace('{brand}', brand);
  })();

  const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30';
  const textareaCls = inputCls + ' font-mono text-xs';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div>
          <h1 className="text-lg font-bold tracking-tight">SEO Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Google search rules, social cards & per-page overrides — applies sitewide.</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-sm font-semibold disabled:opacity-60">
          <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <SectionCard icon={Globe} title="Brand & Defaults" desc="Used when a page doesn't override these values.">
        <SEOHelp
          title="Ki info dite hobe? — Bujhe nin"
          defaultOpen
          steps={[
            { text: 'Brand Name — apnar dokaner naam (eg. "Highlights BD"). Eta protita page er title-e add hobe.' },
            { text: 'Title Template — {title} | {brand} format. Mane: page er nijer title aage, tarpor pipe ( | ), tarpor brand naam. Google search-e ei kotha gula dekhabe.' },
            { text: 'Default Page Title — homepage ba je page-er nijer title nai, oi page-e ei title dekhabe. 50–60 character-er moddhe rakhun.' },
            { text: 'Base URL — apnar website-er purno address. Eta canonical link banate use hoy (duplicate content thekey banchaye).' },
            { text: 'Meta Description — Google search result-e title er niche je summary dekha jay. 140–160 character somporkito.' },
          ]}
          tips={[
            'Title-e main keyword aage rakhun (eg. "Baby Clothes BD | Highlights").',
            'Description-e CTA dile click-through bare (eg. "Free delivery! Order now").',
          ]}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Brand Name" hint="Apnar dokan / website naam"><input className={inputCls} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Highlights BD" /></Field>
          <Field label="Title Template" hint="Tokens: {title}, {brand}">
            <input className={inputCls} value={titleTemplate} onChange={e => setTitleTemplate(e.target.value)} placeholder="{title} | {brand}" />
          </Field>
          <Field label="Default Page Title" hint="50–60 character recommended"><input className={inputCls} value={defaultTitle} onChange={e => setDefaultTitle(e.target.value)} /></Field>
          <Field label="Base URL (canonical root)" hint="e.g. https://www.highlightsbd.shop">
            <input className={inputCls} value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <Field label={`Default Meta Description (${defaultDesc.length}/160 recommended)`} hint="Google search result-e title er niche dekhabe">
          <textarea className={inputCls} rows={3} value={defaultDesc} onChange={e => setDefaultDesc(e.target.value)} />
        </Field>
        <Field label="Default Keywords" hint="Comma-separated. Modern Google ignores this but still useful for other engines.">
          <input className={inputCls} value={defaultKeywords} onChange={e => setDefaultKeywords(e.target.value)} placeholder="clothing, bangladesh, ..." />
        </Field>
        <div className="rounded-md bg-muted/40 p-3 text-[11px]">
          <span className="font-semibold">Google Preview: </span>
          <span className="text-foreground">{titlePreview}</span>
        </div>
      </SectionCard>

      <SectionCard icon={ImageIcon} title="Social Sharing (Open Graph & Twitter)" desc="Image shown when your link is shared on Facebook, WhatsApp, Twitter, LinkedIn.">
        <SEOHelp
          title="Social share image kothay banabo? — Step by step"
          steps={[
            { text: 'Canva khule "Custom size" select korun. Width: 1200, Height: 630 px.' , link: { label: 'Canva khulun', href: 'https://www.canva.com/' } },
            { text: 'Apnar logo, brand naam, ar attractive tagline boshan. JPG format-e download korun (size 500KB er moddhe).' },
            { text: 'Image ta upload korun (eg. Products section-er kono product image-e add korun) ba public URL ta paste korun ekhane.' },
            { text: 'Twitter Handle: apnar Twitter/X account username dite hobe @ shoho (eg. @highlightsbd).' },
          ]}
          tips={[
            'OG image na thakle Facebook/WhatsApp link blank dekhabe — eta khub joruri.',
            '1200x630 ratio na hole crop hoye jabe.',
          ]}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Default OG Image URL" hint="1200x630 px recommended. JPG/PNG.">
            <input className={inputCls} value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://.../og.jpg" />
          </Field>
          <Field label="Twitter Handle" hint="Include @ symbol">
            <input className={inputCls} value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="@yourbrand" />
          </Field>
        </div>
        {ogImage && (
          <div className="mt-2"><img src={ogImage} alt={`${brand} social sharing preview`} className="max-h-32 rounded border border-border" /></div>
        )}
      </SectionCard>

      <SectionCard icon={Shield} title="Crawler & Verification" desc="Control how search engines crawl and verify ownership.">
        <SEOHelp
          title="Verification code kothay pabo? — Google, Bing, Facebook, Pinterest"
          steps={[
            { text: 'Google: Search Console-e jaan → Property add korun (apnar domain dilei hobe) → "HTML tag" method select korun → "content=" er bhitor je code thakbe, oita copy kore Google Site Verification field-e paste korun.', link: { label: 'Google Search Console', href: 'https://search.google.com/search-console' } },
            { text: 'Bing: Bing Webmaster Tools-e site add korun → "Meta tag" option select korun → content value ta copy korun.', link: { label: 'Bing Webmaster', href: 'https://www.bing.com/webmasters' } },
            { text: 'Facebook: Business Manager → Brand Safety → Domains → apnar domain add korun → "Meta-tag verification" → code copy korun.', link: { label: 'FB Business Manager', href: 'https://business.facebook.com/' } },
            { text: 'Pinterest: Pinterest Business account → Settings → Claim → Website → "Add HTML tag" → content value copy korun.', link: { label: 'Pinterest Business', href: 'https://www.pinterest.com/business/hub/' } },
            { text: 'Code paste korar por "Save All" press korun. Tarpor je site-e add korechen oikhane "Verify" button click korun.' },
          ]}
          tips={[
            'Robots Directive — default ta ("index, follow") rakhle Google sob page crawl korbe. Site hide korte chaile "noindex, nofollow" diben.',
            'Locale — Bangladesh-e Bangla site hole "bn_BD" diben, English hole "en_US".',
          ]}
        />
        <Field label="Robots Directive" hint='Default: "index, follow" — Google ke sob page crawl korte dey'>
          <input className={inputCls} value={robots} onChange={e => setRobots(e.target.value)} />
        </Field>
        <Field label="Content Locale" hint="Bangla: bn_BD · English: en_US">
          <input className={inputCls} value={locale} onChange={e => setLocale(e.target.value)} placeholder="en_US" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Google Site Verification" hint='Meta tag-er content="..." value ta paste korun'>
            <input className={inputCls} value={googleVerif} onChange={e => setGoogleVerif(e.target.value)} placeholder="abc123XyZ..." />
          </Field>
          <Field label="Bing Site Verification" hint="Bing Webmaster Tools theke">
            <input className={inputCls} value={bingVerif} onChange={e => setBingVerif(e.target.value)} />
          </Field>
          <Field label="Facebook Domain Verification" hint="FB Business Manager → Brand Safety → Domains">
            <input className={inputCls} value={fbVerif} onChange={e => setFbVerif(e.target.value)} />
          </Field>
          <Field label="Pinterest Domain Verification" hint="Pinterest Business → Settings → Claim">
            <input className={inputCls} value={pinVerif} onChange={e => setPinVerif(e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Code2} title="Organization JSON-LD (Schema.org)" desc="Structured data for Google's Knowledge Graph & rich results.">
        <SEOHelp
          title="JSON-LD ki? Kothay banabo?"
          steps={[
            { text: 'Eta Google ke bole apnar dokan-er detail — naam, logo, address, phone, social links. Result-e brand panel hisebe dekhabe.' },
            { text: 'Niche default template debe — apnar info bosheye nin. Ba Schema.org generator use kore banate paren.', link: { label: 'Generator khulun', href: 'https://technicalseo.com/tools/schema-markup-generator/' } },
            { text: '"Organization" select korun → naam, URL, logo, phone, address, sameAs (Facebook/Instagram link) dite hobe → JSON copy kore ekhane paste korun.' },
            { text: 'Save korar por Google Rich Results Test-e check korun.', link: { label: 'Rich Results Test', href: 'https://search.google.com/test/rich-results' } },
          ]}
          tips={['JSON valid kina test korun — ekta comma missing thakleo kaaj korbe na.']}
        />
        <Field label="JSON" hint="Paste a valid JSON object or array. Leave blank to skip.">
          <textarea className={textareaCls} rows={10} value={orgJsonLd} onChange={e => setOrgJsonLd(e.target.value)}
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${brand}",\n  "url": "${baseUrl || 'https://...'}",\n  "logo": "${ogImage || 'https://.../logo.png'}",\n  "sameAs": ["https://facebook.com/..."]\n}`} />
        </Field>
      </SectionCard>

      <SectionCard icon={FileText} title="Per-Page Overrides" desc="Override title / description / image / noIndex for specific routes.">
        <SEOHelp
          title="Per-page override ki? Kkn use korbo?"
          steps={[
            { text: 'Default title/description sob page-e onyo. Kintu /about ba /contact er moto page-er nijer title chaile ekhane override din.' },
            { text: 'Preset path button click korun (eg. /about) ba "Custom" diye nijer path likhun.' },
            { text: 'Title, description, image, keywords — ja override korte chan, oitai bharun. Khali field default theke nibe.' },
            { text: 'No-index check korle oi specific page Google search-e ashbe na (eg. private /admin page).' },
          ]}
          tips={['Product page er title automatic product naam theke ase — manually override lagbe na.']}
        />
        <div className="flex flex-wrap gap-2">
          {PRESET_PATHS.map(p => (
            <button key={p} onClick={() => addOverride(p)} className="text-[11px] px-2 py-1 border border-border rounded hover:bg-muted">
              + {p}
            </button>
          ))}
          <button onClick={() => addOverride('')} className="text-[11px] px-2 py-1 border border-dashed border-border rounded hover:bg-muted inline-flex items-center gap-1">
            <Plus size={11} /> Custom
          </button>
        </div>

        {overrides.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No overrides — all pages use the defaults above.</p>
        )}

        <div className="space-y-3">
          {overrides.map((o, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">PATH</span>
                <input className={inputCls + ' flex-1'} value={o.path} onChange={e => updateOverride(i, { path: e.target.value })} placeholder="/about" />
                <button onClick={() => removeOverride(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <input className={inputCls} value={o.title || ''} onChange={e => updateOverride(i, { title: e.target.value })} placeholder="Title (optional)" />
                <input className={inputCls} value={o.image || ''} onChange={e => updateOverride(i, { image: e.target.value })} placeholder="OG image URL (optional)" />
              </div>
              <textarea className={inputCls} rows={2} value={o.description || ''} onChange={e => updateOverride(i, { description: e.target.value })} placeholder="Description (optional, max 160 chars)" />
              <input className={inputCls} value={o.keywords || ''} onChange={e => updateOverride(i, { keywords: e.target.value })} placeholder="Keywords (optional)" />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={!!o.noIndex} onChange={e => updateOverride(i, { noIndex: e.target.checked })} />
                Hide this page from search engines (noindex)
              </label>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Search} title="SEO Checklist" desc="Google best practices auto-applied by this app:">
        <ul className="text-xs space-y-1.5 text-foreground/80">
          <li>✓ Unique &lt;title&gt; per page via template</li>
          <li>✓ Meta description (truncated to 300 chars)</li>
          <li>✓ Canonical URL with absolute base</li>
          <li>✓ Open Graph + Twitter Card tags</li>
          <li>✓ Configurable robots directive</li>
          <li>✓ Organization & Product JSON-LD structured data</li>
          <li>✓ Sitemap.xml at <code className="bg-muted px-1 rounded">/sitemap.xml</code></li>
          <li>✓ robots.txt at <code className="bg-muted px-1 rounded">/robots.txt</code></li>
          <li>✓ Per-page noindex toggle</li>
          <li>✓ Semantic HTML (h1, alt text, lazy images)</li>
        </ul>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-sm font-semibold disabled:opacity-60">
          <Save size={14} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSEO;
