import { useEffect, useState } from 'react';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { toast } from 'sonner';
import { Save, Loader2, FileText } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const PAGES = [
  { id: 'about',    label: 'About Us',        path: '/about',           key: 'page_about_html',    defaultTitle: 'About Us' },
  { id: 'contact',  label: 'Contact',         path: '/contact',         key: 'page_contact_html',  defaultTitle: 'Contact Us' },
  { id: 'privacy',  label: 'Privacy Policy',  path: '/privacy-policy',  key: 'page_privacy_html',  defaultTitle: 'Privacy Policy' },
  { id: 'terms',    label: 'Terms',           path: '/terms',           key: 'page_terms_html',    defaultTitle: 'Terms & Conditions' },
  { id: 'refund',   label: 'Refund Policy',   path: '/refund-policy',   key: 'page_refund_html',   defaultTitle: 'Refund Policy' },
  { id: 'shipping', label: 'Shipping Policy', path: '/shipping-policy', key: 'page_shipping_html', defaultTitle: 'Shipping Policy' },
];

const AdminStaticPages = () => {
  const { data: settings = {}, isLoading } = useStoreSettings();
  const update = useUpdateStoreSetting();
  const [drafts, setDrafts] = useState<Record<string, { title: string; html: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const next: Record<string, { title: string; html: string }> = {};
    for (const p of PAGES) {
      next[p.id] = {
        title: (settings as any)[`${p.key}_title`] || '',
        html:  (settings as any)[p.key] || '',
      };
    }
    setDrafts(next);
  }, [isLoading, settings]);

  const save = async (pageId: string) => {
    const p = PAGES.find(x => x.id === pageId)!;
    const d = drafts[pageId];
    if (!d) return;
    setSaving(pageId);
    try {
      await update.mutateAsync({ key: p.key, value: d.html });
      await update.mutateAsync({ key: `${p.key}_title`, value: d.title });
      toast.success(`${p.label} saved`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2"><FileText size={18} /> Static Pages</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Website-er About, Contact, Privacy, Terms, Refund, Shipping page-er content edit korun.
          Khali rakhle page e "content nai" message dekhabe.
        </p>
      </div>

      <Tabs defaultValue="about">
        <TabsList className="flex flex-wrap h-auto">
          {PAGES.map(p => <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>)}
        </TabsList>

        {PAGES.map(p => (
          <TabsContent key={p.id} value={p.id} className="space-y-4 mt-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground">Path: <span className="font-mono">{p.path}</span></p>
                </div>
                <button
                  onClick={() => save(p.id)}
                  disabled={saving === p.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-sm font-semibold disabled:opacity-60"
                >
                  {saving === p.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </button>
              </div>

              <div>
                <Label>Page Title <span className="text-muted-foreground text-xs">(khali rakhle "{p.defaultTitle}" dekhabe)</span></Label>
                <Input
                  value={drafts[p.id]?.title || ''}
                  onChange={(e) => setDrafts(prev => ({ ...prev, [p.id]: { ...prev[p.id], title: e.target.value } }))}
                  placeholder={p.defaultTitle}
                />
              </div>

              <div>
                <Label>Content (HTML)</Label>
                <RichTextEditor
                  value={drafts[p.id]?.html || ''}
                  onChange={(html) => setDrafts(prev => ({ ...prev, [p.id]: { ...prev[p.id], html } }))}
                  placeholder="Ei page er kotha gula likhun..."
                  minHeight={400}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminStaticPages;
