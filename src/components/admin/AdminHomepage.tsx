import { useState, useRef, useEffect, useMemo } from 'react';
import { useStoreSettings, useUpdateStoreSetting, useProducts } from '@/hooks/useSupabase';
import { uploadImage } from '@/lib/upload';
import { Upload, X, Save, Loader2, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

const AdminHomepage = () => {
  const { data: settings = {}, isLoading } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();

  const rawSlides = settings['hero_slides'];
  const slides: SlideType[] = rawSlides ? JSON.parse(rawSlides) : [];

  const rawPosters = settings['homepage_posters'];
  const posters: PosterType[] = rawPosters ? JSON.parse(rawPosters) : [];

  const rawCategoryBanners = settings['homepage_category_banners'];
  const categoryBanners: CategoryBannerType[] = rawCategoryBanners ? JSON.parse(rawCategoryBanners) : [];

  const rawVideos = settings['homepage_videos'];
  const videos: VideoType[] = rawVideos ? JSON.parse(rawVideos) : [];

  const rawFeatCats = settings['homepage_featured_categories'];
  const featCats: FeaturedCatType[] = rawFeatCats ? JSON.parse(rawFeatCats) : [];

  const siteLogo = settings['site_logo'] || '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-border p-4 bg-secondary/20 flex items-start gap-3">
        <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Image Guidelines:</strong></p>
          <p>• Hero Slider PC: <strong>1920×1080px</strong> (16:9), Mobile: <strong>1920×1080px</strong> (16:9), Max <strong>10MB</strong></p>
          <p>• Posters: <strong>800×1000px</strong> recommended (4:5 ratio), Max <strong>10MB</strong></p>
          <p>• Supported formats: JPG, PNG, WebP</p>
        </div>
      </div>

      <LogoManager logo={siteLogo} onSave={async (url) => {
        await updateSetting.mutateAsync({ key: 'site_logo', value: url });
        toast.success('Logo updated!');
      }} />

      <SliderManager slides={slides} onSave={async (newSlides) => {
        await updateSetting.mutateAsync({ key: 'hero_slides', value: JSON.stringify(newSlides) });
        toast.success('Slider updated!');
      }} />

      <PosterManager posters={posters} onSave={async (newPosters) => {
        await updateSetting.mutateAsync({ key: 'homepage_posters', value: JSON.stringify(newPosters) });
        toast.success('Posters updated!');
      }} />

      <CategoryBannerManager banners={categoryBanners} onSave={async (newBanners) => {
        await updateSetting.mutateAsync({ key: 'homepage_category_banners', value: JSON.stringify(newBanners) });
        toast.success('Category banners updated!');
      }} />

      <VideoManager videos={videos} onSave={async (newVideos) => {
        await updateSetting.mutateAsync({ key: 'homepage_videos', value: JSON.stringify(newVideos) });
        toast.success('Videos updated!');
      }} />

      <FeaturedCategoriesManager items={featCats} onSave={async (newItems) => {
        await updateSetting.mutateAsync({ key: 'homepage_featured_categories', value: JSON.stringify(newItems) });
        toast.success('Featured categories updated!');
      }} />
    </div>
  );
};

type SlideType = { image: string; mobileImage?: string; title: string; topText: string; bottomText: string };
type PosterType = { image: string; link: string; subtitle: string; title: string };
type CategoryBannerType = { image: string; label: string; link: string; productIds?: string[] };
type FeaturedCatType = { image: string; label: string; link: string };

const FeaturedCategoriesManager = ({ items: initial, onSave }: {
  items: FeaturedCatType[];
  onSave: (items: FeaturedCatType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<FeaturedCatType[]>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setItems(initial); }, [JSON.stringify(initial)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addItem = () => setItems([...items, { image: '', label: '', link: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) =>
    setItems(items.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Featured Categories</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {items.length} category configured • Square image (600×600px) • Shown below video carousel
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addItem} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Category</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No featured categories.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it, i) => (
          <div key={i} className="border border-border p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Category {i + 1}</p>
              <button onClick={() => removeItem(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image (600×600, max 10MB)</label>
              <HomepageImageUpload value={it.image} onChange={(url) => updateItem(i, 'image', url)} folder="featured-category" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Label</label>
              <input value={it.label} onChange={e => updateItem(i, 'label', e.target.value)} className="luxury-input text-xs" placeholder="Baby Formula Milks" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Link</label>
              <input value={it.link} onChange={e => updateItem(i, 'link', e.target.value)} className="luxury-input text-xs" placeholder="/?category=Shirts" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

type VideoType = { youtubeId: string; title: string; date?: string; thumbnail?: string };

const VideoManager = ({ videos, onSave }: {
  videos: VideoType[];
  onSave: (videos: VideoType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<VideoType[]>(videos);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setItems(videos); }, [JSON.stringify(videos)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addVideo = () => setItems([...items, { youtubeId: '', title: '', date: '' }]);
  const removeVideo = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateVideo = (i: number, field: string, value: string) =>
    setItems(items.map((v, idx) => idx === i ? { ...v, [field]: value } : v));

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Homepage Videos (YouTube)</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {items.length} video configured • YouTube URL বা Video ID দিন (e.g. https://youtu.be/XXXXX or XXXXX)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addVideo} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Video</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No videos configured.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((v, i) => (
          <div key={i} className="border border-border p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Video {i + 1}</p>
              <button onClick={() => removeVideo(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">YouTube URL or Video ID</label>
              <input value={v.youtubeId} onChange={e => updateVideo(i, 'youtubeId', e.target.value)} className="luxury-input text-xs" placeholder="https://youtu.be/dQw4w9WgXcQ" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
              <input value={v.title} onChange={e => updateVideo(i, 'title', e.target.value)} className="luxury-input text-xs" placeholder="Cricketer Talks About..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Date (optional)</label>
              <input value={v.date || ''} onChange={e => updateVideo(i, 'date', e.target.value)} className="luxury-input text-xs" placeholder="22/01/2026" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Custom Thumbnail URL (optional)</label>
              <input value={v.thumbnail || ''} onChange={e => updateVideo(i, 'thumbnail', e.target.value)} className="luxury-input text-xs" placeholder="Auto: YouTube thumbnail" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SliderManager = ({ slides, onSave }: {
  slides: SlideType[];
  onSave: (slides: SlideType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<SlideType[]>(slides);
  const [saving, setSaving] = useState(false);

  // Always sync from DB when slides change
  useEffect(() => {
    setItems(slides);
  }, [JSON.stringify(slides)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addSlide = () => {
    setItems([...items, { image: '', mobileImage: '', title: '', topText: '', bottomText: '' }]);
  };

  const removeSlide = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Hero Slider</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {items.length} slide configured • Slide মুছে দিয়ে নতুন upload করুন
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addSlide} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Slide</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No slides configured. Default slides will be used.</p>
      )}

      {items.map((slide, i) => (
        <div key={i} className="border border-border p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Slide {i + 1}</p>
            <button onClick={() => removeSlide(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">🖥️ PC Image (1920×1080, max 10MB)</label>
                <HomepageImageUpload value={slide.image} onChange={(url) => updateSlide(i, 'image', url)} folder="hero" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">📱 Mobile Image (1920×1080, max 10MB)</label>
                <HomepageImageUpload value={slide.mobileImage || ''} onChange={(url) => updateSlide(i, 'mobileImage', url)} folder="hero-mobile" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
                <input value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="luxury-input text-xs" placeholder="e.g. Elegance" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Text</label>
                <textarea value={slide.topText} onChange={e => updateSlide(i, 'topText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Top text..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Bottom Text</label>
                <textarea value={slide.bottomText} onChange={e => updateSlide(i, 'bottomText', e.target.value)} className="luxury-input text-xs min-h-[50px]" placeholder="Bottom text..." />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PosterManager = ({ posters, onSave }: {
  posters: PosterType[];
  onSave: (posters: PosterType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<PosterType[]>(posters);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(posters);
  }, [JSON.stringify(posters)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addPoster = () => {
    setItems([...items, { image: '', link: '', subtitle: '', title: '' }]);
  };

  const removePoster = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updatePoster = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Homepage Posters</h3>
          <p className="text-[10px] text-muted-foreground mt-1">{items.length} poster configured • পুরানো ছবি মুছে নতুন upload করুন</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addPoster} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Poster</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No posters configured.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((poster, i) => (
          <div key={i} className="border border-border p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Poster {i + 1}</p>
              <button onClick={() => removePoster(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image (800×1000, max 10MB)</label>
              <HomepageImageUpload value={poster.image} onChange={(url) => updatePoster(i, 'image', url)} folder="poster" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Subtitle</label>
              <input value={poster.subtitle} onChange={e => updatePoster(i, 'subtitle', e.target.value)} className="luxury-input text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
              <input value={poster.title} onChange={e => updatePoster(i, 'title', e.target.value)} className="luxury-input text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Link</label>
              <input value={poster.link} onChange={e => updatePoster(i, 'link', e.target.value)} className="luxury-input text-xs" placeholder="e.g. /?category=Shirts" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomepageImageUpload = ({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!file.type.startsWith('image/') && !validExts.includes(ext)) { toast.error('শুধুমাত্র image file দিন (JPG, PNG, WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB! আপনার ছবি ' + (file.size / (1024 * 1024)).toFixed(1) + 'MB'); return; }

    setUploading(true);
    try {
      const publicUrl = await uploadImage(file, `homepage/${folder}`);
      onChange(publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    onChange('');
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
      {value ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img src={value} alt="" className="w-full max-w-[280px] h-36 object-cover border border-border" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 border border-destructive/30 transition-colors">
              <Trash2 size={11} /> Delete Image
            </button>
            <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 border border-border transition-colors">
              <Upload size={11} /> Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="w-full max-w-[280px] h-36 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="text-muted-foreground mb-1.5 animate-spin" />
              <span className="text-[10px] text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-muted-foreground mb-1.5" />
              <span className="text-[10px] text-muted-foreground">Click to upload</span>
              <span className="text-[9px] text-muted-foreground/60 mt-0.5">JPG, PNG, WebP • Max 10MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CategoryBannerManager = ({ banners, onSave }: {
  banners: CategoryBannerType[];
  onSave: (banners: CategoryBannerType[]) => Promise<void>;
}) => {
  const [items, setItems] = useState<CategoryBannerType[]>(banners);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setItems(banners); }, [JSON.stringify(banners)]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(items); } finally { setSaving(false); }
  };

  const addBanner = () => setItems([...items, { image: '', label: '', link: '', productIds: [] }]);
  const removeBanner = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateBanner = (i: number, field: string, value: any) =>
    setItems(items.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

  return (
    <div className="border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium tracking-wider uppercase">Category Banners (Homepage)</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            {items.length} banner configured • Recommended <strong>3 banners</strong>, size <strong>1600×500px</strong> (16:5), Max 10MB
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addBanner} className="luxury-button-outline text-[10px] py-2 px-3">+ Add Banner</button>
          <button onClick={handleSave} disabled={saving} className="luxury-button-primary text-[10px] py-2 px-3 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            Save
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">No category banners. Add up to 3 horizontal banners.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((banner, i) => (
          <div key={i} className="border border-border p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Banner {i + 1}</p>
              <button onClick={() => removeBanner(i)} className="inline-flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-2 py-1 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image (1600×500, max 10MB)</label>
              <HomepageImageUpload value={banner.image} onChange={(url) => updateBanner(i, 'image', url)} folder="category-banner" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Label (e.g. FULL SLEEVES)</label>
              <input value={banner.label} onChange={e => updateBanner(i, 'label', e.target.value)} className="luxury-input text-xs" placeholder="FULL SLEEVES" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Link (e.g. /?category=Shirts)</label>
              <input value={banner.link} onChange={e => updateBanner(i, 'link', e.target.value)} className="luxury-input text-xs" placeholder="/?category=Shirts" />
            </div>
            <BannerProductPicker
              selectedIds={banner.productIds || []}
              onChange={(ids) => updateBanner(i, 'productIds', ids)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHomepage;

const LogoManager = ({ logo, onSave }: { logo: string; onSave: (url: string) => Promise<void> }) => {
  const [current, setCurrent] = useState(logo);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCurrent(logo); }, [logo]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file, 'site');
      setCurrent(url);
      await onSave(url);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setCurrent('');
    await onSave('');
  };

  return (
    <div className="border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase">Site Logo (Header)</h3>
      </div>
      <p className="text-xs text-muted-foreground">Recommended: PNG/SVG, transparent background, height ~80px. Leave empty to show the brand text.</p>

      <div className="flex items-center gap-4">
        <div className="w-40 h-16 border border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
          {current ? (
            <img src={current} alt="Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-border hover:bg-secondary transition disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </button>
          {current && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-border text-destructive hover:bg-destructive/10 transition"
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
