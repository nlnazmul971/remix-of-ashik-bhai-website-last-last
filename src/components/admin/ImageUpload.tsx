import { useState, useRef, DragEvent } from 'react';
import { uploadImage } from '@/lib/upload';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onMultiUpload?: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  altValue?: string;
  onAltChange?: (alt: string) => void;
  altLabel?: string;
};

const ImageUpload = ({ value, onChange, onMultiUpload, folder = 'products', multiple = false, altValue, onAltChange, altLabel = 'Alt text (SEO)' }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const maxSize = 25 * 1024 * 1024;

    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        const isValidType = file.type.startsWith('image/') || validExtensions.includes(ext);
        if (!isValidType) { toast.error(`${file.name}: Invalid format`); continue; }
        if (file.size > maxSize) { toast.error(`${file.name}: Max 25MB`); continue; }

        const url = await uploadImage(file, folder);
        uploadedUrls.push(url);
        setProgress({ done: i + 1, total: files.length });
      }

      if (uploadedUrls.length > 0) {
        if (multiple && onMultiUpload) onMultiUpload(uploadedUrls);
        else onChange(uploadedUrls[0]);
        toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded ✓`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {value ? (
        <div className="relative group inline-block">
          <div className="relative w-40 h-48 overflow-hidden border border-border bg-gradient-to-br from-muted/40 to-muted/10">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-background text-foreground text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
              <Check size={10} />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative w-full max-w-md min-h-[180px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : uploading
                ? 'border-primary/50 bg-muted/20'
                : 'border-border hover:border-foreground/40 hover:bg-muted/20'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="text-primary animate-spin mb-3" />
              <p className="text-xs font-medium tracking-wide">Uploading {progress.done} of {progress.total}…</p>
              <div className="w-40 h-1 bg-muted mt-3 overflow-hidden rounded-full">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ImageIcon size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium tracking-wide">
                {dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5 tracking-wide">
                JPG · PNG · WEBP · max 25MB {multiple && '· multiple files'}
              </p>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest border border-border hover:bg-muted disabled:opacity-50 transition-colors"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {uploading ? 'Uploading…' : value ? 'Replace Image' : multiple ? 'Choose Files' : 'Choose File'}
      </button>

      {onAltChange && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{altLabel}</label>
          <input
            type="text"
            value={altValue || ''}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="eg. Red baby dress with white polka dots"
            className="w-full max-w-md px-2 py-1.5 text-xs border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
            maxLength={125}
          />
          <p className="text-[10px] text-muted-foreground">Image-er short description — blind reader o Google ke bole image-e ki ache. 5–15 word + main keyword.</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
