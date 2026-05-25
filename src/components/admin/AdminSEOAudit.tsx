import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, Filter } from 'lucide-react';

type Issue = {
  id: string;
  entity: 'product' | 'blog' | 'page';
  entityId: string;
  title: string;
  url: string;
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  fix?: string;
};

const sevOrder = { critical: 0, warning: 1, info: 2 } as const;

const AdminSEOAudit = () => {
  const { data: settings = {} } = useStoreSettings();
  const brand = settings['seo_brand_name'] || 'Baby Store';

  const [scanning, setScanning] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | 'product' | 'blog' | 'page'>('all');
  const [fixingId, setFixingId] = useState<string>('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [stats, setStats] = useState({ products: 0, blogs: 0, pages: 0 });

  const scan = async () => {
    setScanning(true);
    try {
      const [p, b, c] = await Promise.all([
        supabase.from('products').select('id,name,description,image_url,seo_title,seo_description,seo_keywords,seo_focus_keyword,seo_og_image,seo_slug,is_active'),
        supabase.from('blogs').select('id,title,slug,excerpt,content,cover_image,seo_title,seo_description,seo_keywords,seo_focus_keyword,seo_og_image,status'),
        supabase.from('custom_pages').select('id,title,slug,banner_url,is_active'),
      ]);

      const products = p.data || [];
      const blogs = (b.data || []).filter((x: any) => x.status === 'published');
      const pages = (c.data || []).filter((x: any) => x.is_active);
      setStats({ products: products.length, blogs: blogs.length, pages: pages.length });

      const out: Issue[] = [];
      const push = (i: Omit<Issue, 'id'>) => out.push({ ...i, id: `${i.entity}:${i.entityId}:${i.code}` });

      // PRODUCTS
      for (const pr of products as any[]) {
        if (!pr.is_active) continue;
        const url = `/product/${pr.id}`;
        const base = { entity: 'product' as const, entityId: pr.id, title: pr.name, url };
        if (!pr.seo_title) push({ ...base, severity: 'critical', code: 'missing-seo-title', message: 'Missing meta title' });
        else if (pr.seo_title.length < 30 || pr.seo_title.length > 65) push({ ...base, severity: 'warning', code: 'bad-seo-title-length', message: `Meta title length is ${pr.seo_title.length} (ideal 50–60)` });
        if (!pr.seo_description) push({ ...base, severity: 'critical', code: 'missing-seo-description', message: 'Missing meta description' });
        else if (pr.seo_description.length < 80 || pr.seo_description.length > 170) push({ ...base, severity: 'warning', code: 'bad-seo-description-length', message: `Meta description length is ${pr.seo_description.length} (ideal 140–155)` });
        if (!pr.seo_keywords) push({ ...base, severity: 'info', code: 'missing-keywords', message: 'No SEO keywords set' });
        if (!pr.seo_focus_keyword) push({ ...base, severity: 'warning', code: 'missing-focus-keyword', message: 'No focus keyword set' });
        if (!pr.image_url) push({ ...base, severity: 'critical', code: 'missing-image', message: 'No product image' });
        if (!pr.description || pr.description.length < 100) push({ ...base, severity: 'warning', code: 'thin-description', message: 'Product description is too thin (<100 chars)' });
        if (pr.seo_focus_keyword && pr.seo_title && !pr.seo_title.toLowerCase().includes(pr.seo_focus_keyword.toLowerCase())) {
          push({ ...base, severity: 'warning', code: 'fk-not-in-title', message: 'Focus keyword not present in meta title' });
        }
      }

      // BLOGS
      for (const bl of blogs as any[]) {
        const url = `/blog/${bl.slug}`;
        const base = { entity: 'blog' as const, entityId: bl.id, title: bl.title, url };
        if (!bl.seo_title) push({ ...base, severity: 'critical', code: 'missing-seo-title', message: 'Missing meta title' });
        else if (bl.seo_title.length < 30 || bl.seo_title.length > 65) push({ ...base, severity: 'warning', code: 'bad-seo-title-length', message: `Meta title length is ${bl.seo_title.length}` });
        if (!bl.seo_description) push({ ...base, severity: 'critical', code: 'missing-seo-description', message: 'Missing meta description' });
        if (!bl.excerpt) push({ ...base, severity: 'warning', code: 'missing-excerpt', message: 'Missing excerpt' });
        if (!bl.cover_image && !bl.seo_og_image) push({ ...base, severity: 'warning', code: 'missing-image', message: 'No cover or social image' });
        if (!bl.seo_focus_keyword) push({ ...base, severity: 'info', code: 'missing-focus-keyword', message: 'No focus keyword' });
        const wordCount = (bl.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        if (wordCount < 300) push({ ...base, severity: 'warning', code: 'thin-content', message: `Content is thin (${wordCount} words, aim 600+)` });
        const imgs = Array.from((bl.content || '').matchAll(/<img\b([^>]*)>/gi));
        const missingAlt = imgs.filter((m: any) => !/\balt\s*=\s*["'][^"']+["']/i.test(m[1])).length;
        if (missingAlt > 0) push({ ...base, severity: 'warning', code: 'missing-alt', message: `${missingAlt} image(s) missing alt text` });
        const h2 = (bl.content || '').match(/<h2\b/gi)?.length || 0;
        if (wordCount > 400 && h2 < 2) push({ ...base, severity: 'info', code: 'few-headings', message: 'Few H2 headings — consider adding structure' });
      }

      // CUSTOM PAGES
      for (const pg of pages as any[]) {
        const url = `/page/${pg.slug}`;
        const base = { entity: 'page' as const, entityId: pg.id, title: pg.title || pg.slug, url };
        if (!pg.title) push({ ...base, severity: 'warning', code: 'missing-title', message: 'Page has no title' });
        if (!pg.banner_url) push({ ...base, severity: 'info', code: 'missing-banner', message: 'Page has no banner image' });
      }

      out.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
      setIssues(out);
      toast.success(`Scan complete — ${out.length} issue${out.length === 1 ? '' : 's'}`);
    } catch (e: any) {
      toast.error(e.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => { scan(); }, []);

  const aiFixOne = async (issue: Issue) => {
    setFixingId(issue.id);
    try {
      if (issue.entity === 'product') {
        const { data: pr } = await supabase.from('products').select('*').eq('id', issue.entityId).maybeSingle();
        if (!pr) throw new Error('Product not found');
        const patch: any = {};
        const calls: { kind: string; field: string }[] = [];
        if (['missing-seo-title', 'bad-seo-title-length', 'fk-not-in-title'].includes(issue.code)) calls.push({ kind: 'title', field: 'seo_title' });
        if (['missing-seo-description', 'bad-seo-description-length'].includes(issue.code)) calls.push({ kind: 'description', field: 'seo_description' });
        if (issue.code === 'missing-keywords') calls.push({ kind: 'keywords', field: 'seo_keywords' });
        if (issue.code === 'missing-focus-keyword') { patch.seo_focus_keyword = pr.name; }
        for (const c of calls) {
          const { data, error } = await supabase.functions.invoke('ai-seo-generator', {
            body: { kind: c.kind, product: pr, brand, focusKeyword: pr.seo_focus_keyword || pr.name },
          });
          if (error) throw error;
          if (data?.result) patch[c.field] = data.result;
        }
        if (Object.keys(patch).length) await supabase.from('products').update(patch).eq('id', issue.entityId);
      } else if (issue.entity === 'blog') {
        const { data: bl } = await supabase.from('blogs').select('*').eq('id', issue.entityId).maybeSingle();
        if (!bl) throw new Error('Blog not found');
        const patch: any = {};
        const calls: { kind: string; field: string }[] = [];
        if (['missing-seo-title', 'bad-seo-title-length'].includes(issue.code)) calls.push({ kind: 'meta-title', field: 'seo_title' });
        if (issue.code === 'missing-seo-description') calls.push({ kind: 'meta-description', field: 'seo_description' });
        if (issue.code === 'missing-excerpt') calls.push({ kind: 'excerpt', field: 'excerpt' });
        if (issue.code === 'missing-focus-keyword') patch.seo_focus_keyword = bl.title;
        for (const c of calls) {
          const { data, error } = await supabase.functions.invoke('ai-blog-writer', {
            body: { kind: c.kind, title: bl.title, topic: bl.title, focusKeyword: bl.seo_focus_keyword || bl.title, brand, content: bl.content },
          });
          if (error) throw error;
          if (data?.result) patch[c.field] = data.result;
        }
        if (Object.keys(patch).length) await supabase.from('blogs').update(patch).eq('id', issue.entityId);
      }
      toast.success('Fixed ✓');
      setIssues(prev => prev.filter(x => x.id !== issue.id));
    } catch (e: any) {
      toast.error(e.message || 'Fix failed');
    } finally {
      setFixingId('');
    }
  };

  const filtered = useMemo(() => issues.filter(i =>
    (filter === 'all' || i.severity === filter) &&
    (entityFilter === 'all' || i.entity === entityFilter)
  ), [issues, filter, entityFilter]);

  const fixable = filtered.filter(i =>
    ['missing-seo-title', 'bad-seo-title-length', 'fk-not-in-title', 'missing-seo-description', 'bad-seo-description-length', 'missing-keywords', 'missing-focus-keyword', 'missing-excerpt'].includes(i.code)
  );

  const bulkFix = async () => {
    if (!fixable.length) return;
    if (!confirm(`AI-fix ${fixable.length} issue${fixable.length === 1 ? '' : 's'}? This may take a minute.`)) return;
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const i of fixable.slice(0, 30)) {
      try { await aiFixOne(i); ok++; } catch { fail++; }
    }
    setBulkBusy(false);
    toast.success(`Bulk fix done: ${ok} fixed${fail ? `, ${fail} failed` : ''}`);
    scan();
  };

  const counts = useMemo(() => ({
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }), [issues]);

  const score = useMemo(() => {
    const total = stats.products + stats.blogs + stats.pages || 1;
    const penalty = counts.critical * 3 + counts.warning * 1 + counts.info * 0.25;
    return Math.max(0, Math.min(100, Math.round(100 - (penalty / total) * 10)));
  }, [counts, stats]);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-3">
        <Card label="SEO Score" value={`${score}/100`} accent={score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red'} />
        <Card label="Critical" value={counts.critical} accent="red" />
        <Card label="Warnings" value={counts.warning} accent="amber" />
        <Card label="Info" value={counts.info} accent="muted" />
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-border p-3">
        <Filter size={14} className="text-muted-foreground" />
        {(['all', 'critical', 'warning', 'info'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 text-[11px] uppercase tracking-widest border ${filter === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}>{s}</button>
        ))}
        <span className="mx-2 text-muted-foreground">|</span>
        {(['all', 'product', 'blog', 'page'] as const).map(s => (
          <button key={s} onClick={() => setEntityFilter(s)} className={`px-2.5 py-1 text-[11px] uppercase tracking-widest border ${entityFilter === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}>{s}</button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={scan} disabled={scanning} className="px-3 py-1.5 text-xs border border-border hover:bg-muted flex items-center gap-1 disabled:opacity-50">
            {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rescan
          </button>
          <button onClick={bulkFix} disabled={bulkBusy || !fixable.length} className="px-3 py-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1 disabled:opacity-50">
            {bulkBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Bulk Fix ({fixable.length})
          </button>
        </div>
      </div>

      <div className="border border-border divide-y divide-border">
        {scanning && !issues.length && (
          <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="inline animate-spin mr-2" size={14} /> Scanning…</div>
        )}
        {!scanning && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2 className="text-emerald-500" /> No issues match this filter.
          </div>
        )}
        {filtered.map(i => {
          const fixableHere = ['missing-seo-title', 'bad-seo-title-length', 'fk-not-in-title', 'missing-seo-description', 'bad-seo-description-length', 'missing-keywords', 'missing-focus-keyword', 'missing-excerpt'].includes(i.code);
          return (
            <div key={i.id} className="p-3 flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${i.severity === 'critical' ? 'text-red-500' : i.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                <AlertTriangle size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.entity}</span>
                  <span className="text-sm font-medium truncate">{i.title}</span>
                  <a href={i.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink size={11} /></a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{i.message}</p>
              </div>
              {fixableHere && (
                <button
                  onClick={() => aiFixOne(i)}
                  disabled={!!fixingId}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-widest border border-border hover:bg-muted disabled:opacity-50"
                >
                  {fixingId === i.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Fix
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Card = ({ label, value, accent }: { label: string; value: any; accent: 'emerald' | 'amber' | 'red' | 'muted' }) => {
  const color = accent === 'emerald' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-foreground';
  return (
    <div className="border border-border p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
};

export default AdminSEOAudit;
