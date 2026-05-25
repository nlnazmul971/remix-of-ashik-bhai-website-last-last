import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Save, ExternalLink, Eye, Wand2 } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  url_pattern: string;
  title_template: string;
  description_template: string;
  h1_template: string;
  content_template: string;
  seo_keywords_template: string;
  variables: string[];
  is_active: boolean;
};

const emptyTemplate: Template = {
  id: '', name: '', url_pattern: '{{category}}-in-{{city}}',
  title_template: 'Buy {{category}} in {{city}} | Premium Fashion',
  description_template: 'Shop premium {{category}} in {{city}}. Fast delivery, easy returns, authentic styles.',
  h1_template: 'Premium {{category}} in {{city}}',
  content_template: '<p>Discover our curated collection of {{category}} for shoppers in {{city}}...</p>',
  seo_keywords_template: '{{category}}, {{category}} {{city}}, buy {{category}} online',
  variables: ['category', 'city'], is_active: true,
};

const AdminPSEO = () => {
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [genTemplate, setGenTemplate] = useState<string>('');
  const [genCsv, setGenCsv] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const [t, p] = await Promise.all([
      supabase.from('pseo_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('pseo_pages').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setTemplates((t.data as any) || []);
    setPages((p.data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const saveTemplate = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.url_pattern.trim()) {
      toast.error('Name and URL pattern required');
      return;
    }
    // Auto-extract variables from URL pattern
    const matches = [...editing.url_pattern.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]);
    const variables = Array.from(new Set(matches));

    const payload: any = {
      name: editing.name,
      url_pattern: editing.url_pattern,
      title_template: editing.title_template,
      description_template: editing.description_template,
      h1_template: editing.h1_template,
      content_template: editing.content_template,
      seo_keywords_template: editing.seo_keywords_template,
      variables,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from('pseo_templates').update(payload).eq('id', editing.id)
      : await supabase.from('pseo_templates').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success('Saved'); setEditing(null); load(); }
  };

  const removeTemplate = async (id: string) => {
    if (!confirm('Delete this template? Generated pages will remain.')) return;
    const { error } = await supabase.from('pseo_templates').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); load(); }
  };

  const removePage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    const { error } = await supabase.from('pseo_pages').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); load(); }
  };

  const generate = async () => {
    if (!genTemplate) { toast.error('Pick a template'); return; }
    const tpl = templates.find(t => t.id === genTemplate);
    if (!tpl) return;
    const lines = genCsv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error('Provide a header row + at least one data row'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const combinations = lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
      return obj;
    });

    setGenerating(true);
    const { data, error } = await supabase.functions.invoke('pseo-generate', {
      body: { template_id: genTemplate, combinations, use_ai: useAI },
    });
    setGenerating(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Generation failed');
    } else {
      toast.success(`Created ${data.created}, skipped ${data.skipped}`);
      load();
    }
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{editing.id ? 'Edit' : 'New'} Template</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveTemplate}><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{`{{variable}}`}</code> placeholders. Variables are auto-detected from the URL pattern.</p>
            <div>
              <Label>Template Name</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Category × City" />
            </div>
            <div>
              <Label>URL Pattern (resolves to /p/&lt;pattern&gt;)</Label>
              <Input value={editing.url_pattern} onChange={(e) => setEditing({ ...editing, url_pattern: e.target.value })} placeholder="{{category}}-in-{{city}}" />
            </div>
            <div>
              <Label>Title Template (50-60 chars)</Label>
              <Input value={editing.title_template} onChange={(e) => setEditing({ ...editing, title_template: e.target.value })} />
            </div>
            <div>
              <Label>Meta Description Template (140-160 chars)</Label>
              <Textarea value={editing.description_template} onChange={(e) => setEditing({ ...editing, description_template: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>H1 Template</Label>
              <Input value={editing.h1_template} onChange={(e) => setEditing({ ...editing, h1_template: e.target.value })} />
            </div>
            <div>
              <Label>Content Template (HTML)</Label>
              <Textarea value={editing.content_template} onChange={(e) => setEditing({ ...editing, content_template: e.target.value })} rows={10} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Keywords Template</Label>
              <Input value={editing.seo_keywords_template} onChange={(e) => setEditing({ ...editing, seo_keywords_template: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Programmatic SEO</h2>
        <p className="text-sm text-muted-foreground">Generate hundreds of unique landing pages at scale from templates and CSV data.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="generate">Generate Pages</TabsTrigger>
          <TabsTrigger value="pages">Generated Pages ({pages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setEditing({ ...emptyTemplate })}><Plus className="w-4 h-4 mr-2" />New Template</Button>
          </div>
          {templates.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">No templates yet.</CardContent></Card>}
          {templates.map(t => (
            <Card key={t.id}>
              <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{t.name}</h3>
                    {!t.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">/p/{t.url_pattern}</p>
                  <p className="text-xs text-muted-foreground mt-1">Variables: {(t.variables || []).join(', ') || '—'}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeTemplate(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Template</Label>
                <select className="w-full border border-border rounded-md h-10 px-3 bg-background" value={genTemplate} onChange={(e) => setGenTemplate(e.target.value)}>
                  <option value="">— Select template —</option>
                  {templates.filter(t => t.is_active).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({(t.variables || []).join(', ')})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>CSV Data (first row = variable headers)</Label>
                <Textarea
                  value={genCsv}
                  onChange={(e) => setGenCsv(e.target.value)}
                  rows={10}
                  placeholder={`category,city\ndresses,Dhaka\ndresses,Chittagong\nshirts,Dhaka\nshirts,Sylhet`}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">Each row becomes one page. Existing slugs are skipped.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4" />AI-enrich content (slower)</Label>
                  <p className="text-xs text-muted-foreground">Uses AI to rewrite content uniquely per page. Avoids duplicate-content penalties.</p>
                </div>
                <Switch checked={useAI} onCheckedChange={setUseAI} />
              </div>
              <div className="flex justify-end">
                <Button onClick={generate} disabled={generating || !genTemplate}>
                  <Wand2 className="w-4 h-4 mr-2" />{generating ? 'Generating…' : 'Generate Pages'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-2">
          {pages.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">No generated pages yet.</CardContent></Card>}
          {pages.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{p.title || p.slug}</h3>
                  <p className="text-xs text-muted-foreground font-mono truncate">/p/{p.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count || 0}</span>
                  <Button size="icon" variant="ghost" asChild><a href={`/p/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
                  <Button size="icon" variant="ghost" onClick={() => removePage(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPSEO;
