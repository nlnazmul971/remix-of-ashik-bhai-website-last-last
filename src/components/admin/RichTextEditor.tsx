import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Quote, Link2, Image as ImageIcon, Code, Undo2, Redo2, Eraser, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import ImageUpload from './ImageUpload';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/**
 * Sundor + sohoj blog editor. No code knowledge needed —
 * just type & click toolbar buttons. Outputs clean HTML.
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Likha shuru korun…', minHeight = 360 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showImage, setShowImage] = useState(false);
  const [showHtml, setShowHtml] = useState(false);

  // Sync external value -> editor (only when different to avoid caret jumps)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current?.innerHTML || '');
  };

  const block = (tag: string) => exec('formatBlock', tag);

  const insertLink = () => {
    const url = prompt('Link URL:', 'https://');
    if (!url) return;
    exec('createLink', url);
  };

  const insertImage = (url: string) => {
    if (!url) return;
    exec('insertImage', url);
    setShowImage(false);
  };

  const Btn = ({ onClick, title, children }: any) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-1.5 text-foreground/80 hover:bg-muted hover:text-foreground border border-transparent hover:border-border rounded"
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-border mx-0.5" />;

  return (
    <div className="border border-border bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 sticky top-14 z-10">
        <Btn onClick={() => exec('undo')} title="Undo"><Undo2 size={14} /></Btn>
        <Btn onClick={() => exec('redo')} title="Redo"><Redo2 size={14} /></Btn>
        <Sep />
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => { block(e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="text-xs border border-border bg-background px-1.5 py-1 rounded"
          title="Paragraph style"
        >
          <option value="" disabled>Style</option>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code block</option>
        </select>
        <Sep />
        <Btn onClick={() => exec('bold')} title="Bold"><Bold size={14} /></Btn>
        <Btn onClick={() => exec('italic')} title="Italic"><Italic size={14} /></Btn>
        <Btn onClick={() => exec('underline')} title="Underline"><Underline size={14} /></Btn>
        <Sep />
        <Btn onClick={() => block('h2')} title="Heading 2"><Heading2 size={14} /></Btn>
        <Btn onClick={() => block('h3')} title="Heading 3"><Heading3 size={14} /></Btn>
        <Btn onClick={() => block('blockquote')} title="Quote"><Quote size={14} /></Btn>
        <Sep />
        <Btn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={14} /></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={14} /></Btn>
        <Sep />
        <Btn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={14} /></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={14} /></Btn>
        <Btn onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={14} /></Btn>
        <Sep />
        <Btn onClick={insertLink} title="Insert link"><Link2 size={14} /></Btn>
        <Btn onClick={() => setShowImage(true)} title="Insert image"><ImageIcon size={14} /></Btn>
        <Sep />
        <Btn onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser size={14} /></Btn>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowHtml(s => !s)}
            className={`px-2 py-1 text-[10px] uppercase tracking-widest border rounded ${showHtml ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted'}`}
            title="Toggle HTML source"
          >
            <Code size={12} className="inline mr-1" />{showHtml ? 'Visual' : 'HTML'}
          </button>
        </div>
      </div>

      {/* Editor body */}
      {showHtml ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="w-full px-3 py-3 text-xs font-mono bg-background outline-none resize-y"
          style={{ minHeight }}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(ref.current?.innerHTML || '')}
          onBlur={() => onChange(ref.current?.innerHTML || '')}
          data-placeholder={placeholder}
          className="prose prose-sm max-w-none px-4 py-3 outline-none focus:ring-0 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_a]:underline [&_img]:my-3 [&_img]:max-w-full [&_img]:h-auto [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:rounded empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60"
          style={{ minHeight }}
        />
      )}

      {showImage && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowImage(false)}>
          <div className="bg-background border border-border p-5 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Insert Image</h4>
              <button type="button" onClick={() => setShowImage(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <ImageUpload value="" onChange={insertImage} folder="blog" />
            <div className="text-[10px] text-muted-foreground">Or paste URL:</div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://…"
                className="flex-1 px-2 py-1.5 text-xs border border-border bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    insertImage((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
