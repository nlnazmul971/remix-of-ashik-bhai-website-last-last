import { useEffect, useState } from 'react';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Search, Globe, FileText, Tag, Image as ImageIcon, Shield, Code2 } from 'lucide-react';

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
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Brand Name"><input className={inputCls} value={brand} onChange={e => setBrand(e.target.value)} /></Field>
          <Field label="Title Template" hint="Tokens: {title}, {brand}">
            <input className={inputCls} value={titleTemplate} onChange={e => setTitleTemplate(e.target.value)} placeholder="{title} | {brand}" />
          </Field>
          <Field label="Default Page Title"><input className={inputCls} value={defaultTitle} onChange={e => setDefaultTitle(e.target.value)} /></Field>
          <Field label="Base URL (canonical root)" hint="e.g. https://www.highlightsbd.shop">
            <input className={inputCls} value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <Field label={`Default Meta Description (${defaultDesc.length}/160 recommended)`}>
          <textarea className={inputCls} rows={3} value={defaultDesc} onChange={e => setDefaultDesc(e.target.value)} />
        </Field>
        <Field label="Default Keywords" hint="Comma-separated. Modern Google ignores this but still useful for other engines.">
          <input className={inputCls} value={defaultKeywords} onChange={e => setDefaultKeywords(e.target.value)} placeholder="clothing, bangladesh, ..." />
        </Field>
        <div className="rounded-md bg-muted/40 p-3 text-[11px]">
          <span className="font-semibold">Preview: </span>
          <span className="text-foreground">{titlePreview}</span>
        </div>
      </SectionCard>

      <SectionCard icon={ImageIcon} title="Social Sharing (Open Graph & Twitter)" desc="Image shown when your link is shared on Facebook, WhatsApp, Twitter, LinkedIn.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Default OG Image URL" hint="1200x630 px recommended">
            <input className={inputCls} value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://.../og.jpg" />
          </Field>
          <Field label="Twitter Handle" hint="Include @">
            <input className={inputCls} value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)} placeholder="@yourbrand" />
          </Field>
        </div>
        {ogImage && (
          <div className="mt-2"><img src={ogImage} alt="OG preview" className="max-h-32 rounded border border-border" /></div>
        )}
      </SectionCard>

      <SectionCard icon={Shield} title="Crawler & Verification" desc="Control how search engines crawl and verify ownership.">
        <Field label="Robots Directive" hint="Default: index, follow, max-image-preview:large">
          <input className={inputCls} value={robots} onChange={e => setRobots(e.target.value)} />
        </Field>
        <Field label="Content Locale" hint="e.g. en_US, bn_BD">
          <input className={inputCls} value={locale} onChange={e => setLocale(e.target.value)} placeholder="en_US" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Google Site Verification" hint="The content value of google-site-verification meta">
            <input className={inputCls} value={googleVerif} onChange={e => setGoogleVerif(e.target.value)} />
          </Field>
          <Field label="Bing Site Verification">
            <input className={inputCls} value={bingVerif} onChange={e => setBingVerif(e.target.value)} />
          </Field>
          <Field label="Facebook Domain Verification">
            <input className={inputCls} value={fbVerif} onChange={e => setFbVerif(e.target.value)} />
          </Field>
          <Field label="Pinterest Domain Verification">
            <input className={inputCls} value={pinVerif} onChange={e => setPinVerif(e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Code2} title="Organization JSON-LD (Schema.org)" desc="Structured data for Google's Knowledge Graph & rich results.">
        <Field label="JSON" hint="Paste a valid JSON object or array. Leave blank to skip.">
          <textarea className={textareaCls} rows={10} value={orgJsonLd} onChange={e => setOrgJsonLd(e.target.value)}
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${brand}",\n  "url": "${baseUrl || 'https://...'}",\n  "logo": "${ogImage || 'https://.../logo.png'}",\n  "sameAs": ["https://facebook.com/..."]\n}`} />
        </Field>
      </SectionCard>

      <SectionCard icon={FileText} title="Per-Page Overrides" desc="Override title / description / image / noIndex for specific routes.">
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
