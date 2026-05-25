import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, Save, X, Eye, MessageSquare, FolderTree, UserCircle2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { slugify, calcReadingTime } from '@/lib/blogHelpers';
import { useStoreSettings } from '@/hooks/useSupabase';

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  status: string;
  published_at: string | null;
  reading_time: number;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_canonical: string | null;
  seo_og_image: string | null;
  seo_focus_keyword: string | null;
  seo_no_index: boolean;
  faq: { q: string; a: string }[];
  related_post_ids: string[];
};

type Cat = { id: string; name: string; slug: string };
type Author = { id: string; name: string; slug: string };

const empty = (): Blog => ({
  id: '', title: '', slug: '', excerpt: '', content: '', cover_image: '',
  category_id: null, author_id: null, tags: [], status: 'draft',
  published_at: null, reading_time: 0, view_count: 0,
  seo_title: '', seo_description: '', seo_keywords: '', seo_canonical: '',
  seo_og_image: '', seo_focus_keyword: '', seo_no_index: false,
  faq: [], related_post_ids: [],
});

const AdminBlogs = () => {
  const { data: settings = {} } = useStoreSettings();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'categories' | 'authors' | 'comments'>('posts');
  const [editing, setEditing] = useState<Blog | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [b, c, a, cm] = await Promise.all([
      supabase.from('blogs').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*').order('sort_order'),
      supabase.from('blog_authors').select('*').order('name'),
      supabase.from('blog_comments').select('*, blogs(title)').order('created_at', { ascending: false }),
    ]);
    setBlogs((b.data as any) || []);
    setCats((c.data as any) || []);
    setAuthors((a.data as any) || []);
    setComments(cm.data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast.error('Title required'); return; }
    setBusy(true);
    const slug = editing.slug.trim() || slugify(editing.title);
    const reading_time = editing.content ? calcReadingTime(editing.content) : 0;
    const published_at = editing.status === 'published'
      ? (editing.published_at || new Date().toISOString())
      : null;
    const payload: any = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt,
      content: editing.content,
      cover_image: editing.cover_image,
      category_id: editing.category_id || null,
      author_id: editing.author_id || null,
      tags: editing.tags,
      status: editing.status,
      published_at,
      reading_time,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      seo_keywords: editing.seo_keywords || null,
      seo_canonical: editing.seo_canonical || null,
      seo_og_image: editing.seo_og_image || null,
      seo_focus_keyword: editing.seo_focus_keyword || null,
      seo_no_index: editing.seo_no_index,
      faq: editing.faq,
      related_post_ids: editing.related_post_ids,
    };
    const { error } = editing.id
      ? await supabase.from('blogs').update(payload).eq('id', editing.id)
      : await supabase.from('blogs').insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved ✓');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); load(); }
  };



  // ---- editor ----
  if (editing) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-background py-3 z-10 border-b border-border">
          <h2 className="text-lg font-semibold">{editing.id ? 'Edit Post' : 'New Post'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs border border-border hover:bg-muted flex items-center gap-1"><X size={12} /> Cancel</button>
            <button onClick={save} disabled={busy} className="px-3 py-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1 disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>

        <section className="space-y-3 border border-border p-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Content</h3>
          <div>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} placeholder="Post title" className="w-full px-3 py-2 text-sm border border-border bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: slugify(e.target.value) })} placeholder="slug-here" className="px-3 py-2 text-sm border border-border bg-background font-mono" />
            <input value={editing.seo_focus_keyword || ''} onChange={e => setEditing({ ...editing, seo_focus_keyword: e.target.value })} placeholder="Focus keyword" className="px-3 py-2 text-sm border border-border bg-background" />
          </div>
          <div>
            <textarea value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Short excerpt (140–160 chars)" rows={2} className="w-full px-3 py-2 text-sm border border-border bg-background resize-y" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Content (HTML)</label>
            <textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} placeholder="<p>...</p>" rows={18} className="w-full px-3 py-2 text-sm border border-border bg-background font-mono resize-y" />
            <p className="text-[10px] text-muted-foreground mt-1">≈ {calcReadingTime(editing.content)} min read</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Cover Image</label>
            <ImageUpload value={editing.cover_image} onChange={url => setEditing({ ...editing, cover_image: url })} folder="blog" />
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-3 border border-border p-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <select value={editing.category_id || ''} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })} className="w-full px-3 py-2 text-sm border border-border bg-background">
              <option value="">— None —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Author</label>
            <select value={editing.author_id || ''} onChange={e => setEditing({ ...editing, author_id: e.target.value || null })} className="w-full px-3 py-2 text-sm border border-border bg-background">
              <option value="">— None —</option>
              {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Status</label>
            <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 text-sm border border-border bg-background">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-muted-foreground block mb-1">Tags (comma separated)</label>
            <input value={editing.tags.join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 text-sm border border-border bg-background" />
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">SEO</h3>
          <input value={editing.seo_title || ''} onChange={e => setEditing({ ...editing, seo_title: e.target.value })} placeholder="Meta title (50–60 chars)" className="w-full px-3 py-2 text-sm border border-border bg-background" />
          <textarea value={editing.seo_description || ''} onChange={e => setEditing({ ...editing, seo_description: e.target.value })} placeholder="Meta description (140–155)" rows={2} className="w-full px-3 py-2 text-sm border border-border bg-background resize-y" />
          <input value={editing.seo_keywords || ''} onChange={e => setEditing({ ...editing, seo_keywords: e.target.value })} placeholder="keyword1, keyword2, ..." className="w-full px-3 py-2 text-sm border border-border bg-background" />
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={editing.seo_canonical || ''} onChange={e => setEditing({ ...editing, seo_canonical: e.target.value })} placeholder="Canonical URL (override)" className="px-3 py-2 text-sm border border-border bg-background" />
            <input value={editing.seo_og_image || ''} onChange={e => setEditing({ ...editing, seo_og_image: e.target.value })} placeholder="Social image URL (override)" className="px-3 py-2 text-sm border border-border bg-background" />
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={editing.seo_no_index} onChange={e => setEditing({ ...editing, seo_no_index: e.target.checked })} /> Hide from search engines (noindex)
          </label>
        </section>

        <section className="space-y-3 border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">FAQ (for FAQPage schema)</h3>
            <button onClick={() => setEditing({ ...editing, faq: [...editing.faq, { q: '', a: '' }] })} className="px-2 py-1 text-[10px] uppercase tracking-widest border border-border hover:bg-muted">+ Add</button>
          </div>
          {editing.faq.map((f, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
              <input value={f.q} onChange={e => { const n = [...editing.faq]; n[i] = { ...n[i], q: e.target.value }; setEditing({ ...editing, faq: n }); }} placeholder="Question" className="px-2 py-1.5 text-xs border border-border bg-background" />
              <textarea value={f.a} onChange={e => { const n = [...editing.faq]; n[i] = { ...n[i], a: e.target.value }; setEditing({ ...editing, faq: n }); }} placeholder="Answer" rows={2} className="px-2 py-1.5 text-xs border border-border bg-background resize-y" />
              <button onClick={() => setEditing({ ...editing, faq: editing.faq.filter((_, idx) => idx !== i) })} className="p-1.5 text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // ---- list ----
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <TabBtn active={tab === 'posts'} onClick={() => setTab('posts')} icon={<Edit2 size={12} />}>Posts</TabBtn>
        <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')} icon={<FolderTree size={12} />}>Categories</TabBtn>
        <TabBtn active={tab === 'authors'} onClick={() => setTab('authors')} icon={<UserCircle2 size={12} />}>Authors</TabBtn>
        <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')} icon={<MessageSquare size={12} />}>Comments</TabBtn>
        <div className="ml-auto">
          {tab === 'posts' && (
            <button onClick={() => setEditing(empty())} className="px-3 py-1.5 text-xs bg-foreground text-background flex items-center gap-1 hover:bg-foreground/90">
              <Plus size={12} /> New Post
            </button>
          )}
        </div>
      </div>

      {tab === 'posts' && (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left p-2">Title</th><th className="text-left p-2">Status</th><th className="text-left p-2">Category</th><th className="text-left p-2">Views</th><th></th></tr>
            </thead>
            <tbody>
              {blogs.map(b => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-2">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">/blog/{b.slug}</div>
                  </td>
                  <td className="p-2"><span className={`px-2 py-0.5 text-[10px] uppercase ${b.status === 'published' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{b.status}</span></td>
                  <td className="p-2 text-xs">{cats.find(c => c.id === b.category_id)?.name || '—'}</td>
                  <td className="p-2 text-xs">{b.view_count}</td>
                  <td className="p-2 text-right space-x-1">
                    <a href={`/blog/${b.slug}`} target="_blank" rel="noreferrer" className="inline-flex p-1.5 border border-border hover:bg-muted"><Eye size={12} /></a>
                    <button onClick={() => setEditing(b)} className="inline-flex p-1.5 border border-border hover:bg-muted"><Edit2 size={12} /></button>
                    <button onClick={() => remove(b.id)} className="inline-flex p-1.5 border border-border text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
              {!blogs.length && <tr><td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">No posts yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && <SimpleList table="blog_categories" rows={cats} reload={load} columns={['name', 'slug', 'description']} />}
      {tab === 'authors' && <SimpleList table="blog_authors" rows={authors} reload={load} columns={['name', 'slug', 'bio', 'avatar_url']} />}

      {tab === 'comments' && (
        <div className="border border-border divide-y divide-border">
          {comments.map((c: any) => (
            <div key={c.id} className="p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="text-xs"><strong>{c.name}</strong> on <span className="text-muted-foreground">{c.blogs?.title || '—'}</span></div>
                <p className="text-sm mt-1">{c.comment}</p>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1">
                {!c.is_approved && (
                  <button onClick={async () => { await supabase.from('blog_comments').update({ is_approved: true }).eq('id', c.id); load(); }} className="px-2 py-1 text-[10px] border border-border hover:bg-muted">Approve</button>
                )}
                <button onClick={async () => { await supabase.from('blog_comments').delete().eq('id', c.id); load(); }} className="p-1.5 text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {!comments.length && <div className="p-6 text-center text-xs text-muted-foreground">No comments yet</div>}
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, children }: any) => (
  <button onClick={onClick} className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border-b-2 -mb-px ${active ? 'border-foreground text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
    {icon}{children}
  </button>
);




// generic CRUD for blog_categories / blog_authors
const SimpleList = ({ table, rows, reload, columns }: { table: 'blog_categories' | 'blog_authors'; rows: any[]; reload: () => void; columns: string[] }) => {
  const [draft, setDraft] = useState<any>({});
  const add = async () => {
    if (!draft.name?.trim()) { toast.error('Name required'); return; }
    const payload = { ...draft, slug: draft.slug || slugify(draft.name) };
    const { error } = await supabase.from(table).insert(payload);
    if (error) toast.error(error.message); else { toast.success('Added'); setDraft({}); reload(); }
  };
  const update = async (id: string, patch: any) => {
    await supabase.from(table).update(patch).eq('id', id);
    reload();
  };
  const del = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from(table).delete().eq('id', id);
    reload();
  };
  return (
    <div className="space-y-3">
      <div className="border border-border p-3 grid sm:grid-cols-4 gap-2">
        {columns.map(c => (
          <input key={c} value={draft[c] || ''} onChange={e => setDraft({ ...draft, [c]: e.target.value })} placeholder={c} className="px-2 py-1.5 text-xs border border-border bg-background" />
        ))}
        <button onClick={add} className="px-3 py-1.5 text-xs bg-foreground text-background hover:bg-foreground/90">Add</button>
      </div>
      <div className="border border-border divide-y divide-border">
        {rows.map(r => (
          <div key={r.id} className="p-3 grid sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
            {columns.map(c => (
              <input key={c} defaultValue={r[c] || ''} onBlur={e => e.target.value !== (r[c] || '') && update(r.id, { [c]: e.target.value })} className="px-2 py-1 text-xs border border-border bg-background" />
            ))}
            <button onClick={() => del(r.id)} className="p-1.5 text-destructive hover:bg-destructive/10"><Trash2 size={12} /></button>
          </div>
        ))}
        {!rows.length && <div className="p-6 text-center text-xs text-muted-foreground">Empty</div>}
      </div>
    </div>
  );
};

export default AdminBlogs;
