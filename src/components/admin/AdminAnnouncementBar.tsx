import { useEffect, useState } from 'react';
import { Save, Loader2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';

const AdminAnnouncementBar = () => {
  const { data: s = {}, isLoading } = useStoreSettings();
  const update = useUpdateStoreSetting();
  const [text, setText] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(s['announcement_text'] || 'SUMMER SALE | 20% OFF on orders above 2000 BDT');
    setEnabled(s['announcement_enabled'] !== 'false');
  }, [s]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({ key: 'announcement_text', value: text });
      await update.mutateAsync({ key: 'announcement_enabled', value: enabled ? 'true' : 'false' });
      toast.success('Announcement bar updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border p-6 space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-light tracking-wide flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Megaphone size={18} /> Announcement Bar
        </h3>
        <p className="text-xs text-muted-foreground">Header-er upore je banner ta show hoy seta edit korun.</p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground tracking-wider uppercase block mb-1.5">Message</label>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          className="luxury-input"
          placeholder="SUMMER SALE | 20% OFF on orders above 2000 BDT"
          disabled={isLoading}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <span>Show announcement bar</span>
      </label>

      {enabled && text && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground tracking-wider uppercase">Preview</div>
          <div
            className="w-full text-[11px] sm:text-[12px] tracking-[0.05em] font-medium py-2 px-4 text-center"
            style={{ backgroundColor: 'hsl(var(--announce))', color: 'hsl(var(--announce-foreground))' }}
          >
            {text} <span className="ml-1">🏷️</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || isLoading}
        className="luxury-button-primary inline-flex h-11 items-center justify-center gap-2 px-6 text-[10px] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Changes
      </button>
    </div>
  );
};

export default AdminAnnouncementBar;
