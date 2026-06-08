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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Edit, Save, Eye } from 'lucide-react';
import { BLOCK_TYPES } from '@/components/landing/LandingBlocks';
import { gateWrite } from '@/lib/audit';
import LandingBlockEditor from './LandingBlockEditor';

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type Page = {
  id: string;
  slug: string;
  title: string;
  description: string;
  blocks: any[];
  status: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_focus_keyword?: string;
  seo_og_image?: string;
  seo_no_index?: boolean;
  view_count?: number;
};

const empty: Page = { id: '', slug: '', title: '', description: '', blocks: [], status: 'draft' };

const AdminLandingPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [editing, setEditing] = useState<Page | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('landing_pages').select('*').order('updated_at', { ascending: false });
    setPages((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ ...empty });

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      toast.error('Title and slug required');
      return;
    }
    setSaving(true);
    const payload: any = {
      slug: editing.slug,
      title: editing.title,
      description: editing.description,
      blocks: editing.blocks,
      status: editing.status,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      seo_keywords: editing.seo_keywords || null,
      seo_focus_keyword: editing.seo_focus_keyword || null,
      seo_og_image: editing.seo_og_image || null,
      seo_no_index: !!editing.seo_no_index,
      published_at: editing.status === 'published' ? new Date().toISOString() : null,
    };
    const gate = await gateWrite({
      entityType: 'landing_pages',
      action: editing.id ? 'update' : 'create',
      entityId: editing.id || null,
      payload,
      run: async () => {
        const { error } = editing.id
          ? await supabase.from('landing_pages').update(payload).eq('id', editing.id)
          : await supabase.from('landing_pages').insert(payload);
        if (error) throw error;
      },
    }).catch(e => ({ gated: false, error: e }));
    setSaving(false);
    if ((gate as any).error) { toast.error((gate as any).error.message); return; }
    if (gate.gated) { setEditing(null); return; }
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this landing page?')) return;
    try {
      const { gated } = await gateWrite({
        entityType: 'landing_pages', action: 'delete', entityId: id,
        run: async () => {
          const { error } = await supabase.from('landing_pages').delete().eq('id', id);
          if (error) throw error;
        },
      });
      if (!gated) { toast.success('Deleted'); load(); }
    } catch (e: any) { toast.error(e.message); }
  };

  const addBlock = (type: string) => {
    if (!editing) return;
    const def = BLOCK_TYPES.find((b) => b.type === type);
    if (!def) return;
    setEditing({ ...editing, blocks: [...editing.blocks, { type, data: structuredClone(def.defaultData) }] });
  };

  const updateBlock = (i: number, data: any) => {
    if (!editing) return;
    const blocks = [...editing.blocks];
    blocks[i] = { ...blocks[i], data };
    setEditing({ ...editing, blocks });
  };

  const moveBlock = (i: number, dir: -1 | 1) => {
    if (!editing) return;
    const j = i + dir;
    if (j < 0 || j >= editing.blocks.length) return;
    const blocks = [...editing.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    setEditing({ ...editing, blocks });
  };

  const removeBlock = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, blocks: editing.blocks.filter((_, k) => k !== i) });
  };



  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">{editing.id ? 'Edit' : 'New'} Landing Page</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Slug (URL: /l/{editing.slug || 'your-slug'})</Label>
                    <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Internal description</Label>
                  <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {editing.blocks.map((b, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{i + 1}</Badge>
                      <CardTitle className="text-base capitalize">{b.type}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => moveBlock(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveBlock(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeBlock(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(b.data, null, 2)}
                      onChange={(e) => {
                        try { updateBlock(i, JSON.parse(e.target.value)); } catch { /* ignore until valid */ }
                      }}
                      rows={Math.min(20, JSON.stringify(b.data, null, 2).split('\n').length + 1)}
                      className="font-mono text-xs"
                    />
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="pt-6">
                  <Label>Add a block</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BLOCK_TYPES.map((t) => (
                      <Button key={t.type} size="sm" variant="outline" onClick={() => addBlock(t.type)}>
                        <Plus className="w-3 h-3 mr-1" />{t.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>SEO Title (50-60 chars)</Label>
                  <Input value={editing.seo_title || ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.seo_title || '').length} chars</p>
                </div>
                <div>
                  <Label>Meta Description (140-160 chars)</Label>
                  <Textarea value={editing.seo_description || ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} rows={3} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.seo_description || '').length} chars</p>
                </div>
                <div>
                  <Label>Focus Keyword</Label>
                  <Input value={editing.seo_focus_keyword || ''} onChange={(e) => setEditing({ ...editing, seo_focus_keyword: e.target.value })} />
                </div>
                <div>
                  <Label>Keywords (comma separated)</Label>
                  <Input value={editing.seo_keywords || ''} onChange={(e) => setEditing({ ...editing, seo_keywords: e.target.value })} />
                </div>
                <div>
                  <Label>OG Image URL</Label>
                  <Input value={editing.seo_og_image || ''} onChange={(e) => setEditing({ ...editing, seo_og_image: e.target.value })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>No-index this page</Label>
                  <Switch checked={!!editing.seo_no_index} onCheckedChange={(v) => setEditing({ ...editing, seo_no_index: v })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Landing Pages</h2>
          <p className="text-sm text-muted-foreground">Programmatic landing pages with full SEO and block builder.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={startNew}><Plus className="w-4 h-4 mr-2" />New Page</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {pages.length === 0 && (
          <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">No landing pages yet. Create one to get started.</CardContent></Card>
        )}
        {pages.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">/l/{p.slug} · {(p.blocks || []).length} blocks</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" asChild>
                  <a href={`/l/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Edit className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLandingPages;
