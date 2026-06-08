import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';

type Props = {
  type: string;
  data: any;
  onChange: (data: any) => void;
};

const Field = ({ label, children, hint }: any) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const LandingBlockEditor = ({ type, data, onChange }: Props) => {
  const set = (patch: any) => onChange({ ...data, ...patch });
  const setItem = (key: string, idx: number, patch: any) => {
    const arr = [...(data[key] || [])];
    arr[idx] = { ...arr[idx], ...patch };
    set({ [key]: arr });
  };
  const addItem = (key: string, item: any) => set({ [key]: [...(data[key] || []), item] });
  const removeItem = (key: string, idx: number) => set({ [key]: (data[key] || []).filter((_: any, i: number) => i !== idx) });

  const ItemHeader = ({ idx, onRemove }: any) => (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-muted-foreground">Item {idx + 1}</span>
      <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
    </div>
  );

  switch (type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <Field label="Eyebrow (small text above headline)"><Input value={data.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Headline"><Input value={data.headline || ''} onChange={(e) => set({ headline: e.target.value })} /></Field>
          <Field label="Subheadline"><Textarea value={data.subheadline || ''} onChange={(e) => set({ subheadline: e.target.value })} rows={2} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text"><Input value={data.cta_text || ''} onChange={(e) => set({ cta_text: e.target.value })} /></Field>
            <Field label="Button link"><Input value={data.cta_link || ''} onChange={(e) => set({ cta_link: e.target.value })} placeholder="/" /></Field>
          </div>
          <Field label="Background image (optional)">
            <ImageUpload
              value={data.image || ''}
              onChange={(url) => set({ image: url })}
              altValue={data.image_alt || ''}
              onAltChange={(alt) => set({ image_alt: alt })}
              folder="landing"
            />
          </Field>
        </div>
      );

    case 'text':
      return (
        <Field label="Content" hint="Use toolbar — bold, headings, lists, images, links. Toggle HTML if needed.">
          <RichTextEditor value={data.html || ''} onChange={(html) => set({ html })} placeholder="Likha shuru korun…" minHeight={260} />
        </Field>
      );

    case 'features':
      return (
        <div className="space-y-3">
          <Field label="Section heading"><Input value={data.heading || ''} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <div className="space-y-2">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-border p-3 rounded">
                <ItemHeader idx={i} onRemove={() => removeItem('items', i)} />
                <div className="space-y-2">
                  <Input placeholder="Title" value={it.title || ''} onChange={(e) => setItem('items', i, { title: e.target.value })} />
                  <Textarea placeholder="Description" rows={2} value={it.description || ''} onChange={(e) => setItem('items', i, { description: e.target.value })} />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addItem('items', { title: '', description: '' })}><Plus className="w-3 h-3 mr-1" />Add feature</Button>
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-3">
          <Field label="Section heading"><Input value={data.heading || ''} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <div className="space-y-2">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-border p-3 rounded space-y-2">
                <ItemHeader idx={i} onRemove={() => removeItem('items', i)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Name" value={it.name || ''} onChange={(e) => setItem('items', i, { name: e.target.value })} />
                  <Input placeholder="Role" value={it.role || ''} onChange={(e) => setItem('items', i, { role: e.target.value })} />
                </div>
                <Textarea placeholder="Quote" rows={2} value={it.quote || ''} onChange={(e) => setItem('items', i, { quote: e.target.value })} />
                <Input type="number" min={1} max={5} placeholder="Rating 1-5" value={it.rating || 5} onChange={(e) => setItem('items', i, { rating: Number(e.target.value) })} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addItem('items', { name: '', role: '', quote: '', rating: 5 })}><Plus className="w-3 h-3 mr-1" />Add testimonial</Button>
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          <Field label="Headline"><Input value={data.headline || ''} onChange={(e) => set({ headline: e.target.value })} /></Field>
          <Field label="Subheadline"><Textarea rows={2} value={data.subheadline || ''} onChange={(e) => set({ subheadline: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text"><Input value={data.cta_text || ''} onChange={(e) => set({ cta_text: e.target.value })} /></Field>
            <Field label="Button link"><Input value={data.cta_link || ''} onChange={(e) => set({ cta_link: e.target.value })} /></Field>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          <Field label="Section heading"><Input value={data.heading || ''} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <div className="space-y-2">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-border p-3 rounded space-y-2">
                <ItemHeader idx={i} onRemove={() => removeItem('items', i)} />
                <Input placeholder="Question" value={it.question || ''} onChange={(e) => setItem('items', i, { question: e.target.value })} />
                <Textarea placeholder="Answer" rows={3} value={it.answer || ''} onChange={(e) => setItem('items', i, { answer: e.target.value })} />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addItem('items', { question: '', answer: '' })}><Plus className="w-3 h-3 mr-1" />Add FAQ</Button>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-border p-3 rounded">
                <ItemHeader idx={i} onRemove={() => removeItem('items', i)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Value (10k+)" value={it.value || ''} onChange={(e) => setItem('items', i, { value: e.target.value })} />
                  <Input placeholder="Label" value={it.label || ''} onChange={(e) => setItem('items', i, { label: e.target.value })} />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addItem('items', { value: '', label: '' })}><Plus className="w-3 h-3 mr-1" />Add stat</Button>
          </div>
        </div>
      );

    case 'trust':
      return (
        <div className="space-y-3">
          <Field label="Section heading"><Input value={data.heading || ''} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <div className="space-y-2">
            {(data.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-border p-3 rounded space-y-2">
                <ItemHeader idx={i} onRemove={() => removeItem('items', i)} />
                <Input placeholder="Brand name" value={it.name || ''} onChange={(e) => setItem('items', i, { name: e.target.value })} />
                <ImageUpload
                  value={it.image || ''}
                  onChange={(url) => setItem('items', i, { image: url })}
                  altValue={it.image_alt || it.name || ''}
                  onAltChange={(alt) => setItem('items', i, { image_alt: alt })}
                  altLabel="Brand logo alt text"
                  folder="landing"
                />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => addItem('items', { name: '', image: '' })}><Plus className="w-3 h-3 mr-1" />Add brand</Button>
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="space-y-3">
          <Field label="Headline"><Input value={data.headline || ''} onChange={(e) => set({ headline: e.target.value })} /></Field>
          <Field label="Subheadline"><Textarea rows={2} value={data.subheadline || ''} onChange={(e) => set({ subheadline: e.target.value })} /></Field>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-3">
          <Field label="Section heading"><Input value={data.heading || ''} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <div className="space-y-2">
            {(data.images || []).map((src: string, i: number) => (
              <div key={i} className="border border-border p-3 rounded">
                <ItemHeader idx={i} onRemove={() => set({ images: (data.images || []).filter((_: any, k: number) => k !== i) })} />
                <ImageUpload
                  value={src}
                  onChange={(url) => {
                    const arr = [...(data.images || [])];
                    arr[i] = url;
                    set({ images: arr });
                  }}
                  folder="landing"
                />
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set({ images: [...(data.images || []), ''] })}><Plus className="w-3 h-3 mr-1" />Add image</Button>
          </div>
        </div>
      );

    default:
      return (
        <Textarea
          value={JSON.stringify(data, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* ignore */ }
          }}
          rows={10}
          className="font-mono text-xs"
        />
      );
  }
};

export default LandingBlockEditor;
