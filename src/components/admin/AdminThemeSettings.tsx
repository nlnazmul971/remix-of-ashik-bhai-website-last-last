import { useEffect, useState } from 'react';
import { Save, Loader2, Palette, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateStoreSetting } from '@/hooks/useSupabase';
import { THEME_VARS, hexToHsl, hslToHex, applyThemeFromSettings } from '@/lib/colorUtils';

const AdminThemeSettings = () => {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSetting = useUpdateStoreSetting();
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const v of THEME_VARS) {
      const stored = (settings as any)[v.key];
      next[v.key] = stored && /^\d/.test(stored)
        ? hslToHex(stored)
        : hslToHex(v.defaultHsl);
    }
    setColors(prev => ({ ...next, ...prev }));
  }, [settings]);

  const handleChange = (key: string, hex: string) => {
    setColors(prev => ({ ...prev, [key]: hex }));
    // Live preview
    const hsl = hexToHsl(hex);
    const v = THEME_VARS.find(t => t.key === key);
    if (hsl && v) document.documentElement.style.setProperty(v.cssVar, hsl);
  };

  const handleSaveAll = async () => {
    try {
      for (const v of THEME_VARS) {
        const hex = colors[v.key];
        const hsl = hexToHsl(hex || '') || v.defaultHsl;
        await updateSetting.mutateAsync({ key: v.key, value: hsl });
      }
      toast.success('Theme colors saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save theme');
    }
  };

  const handleResetAll = async () => {
    try {
      for (const v of THEME_VARS) {
        await updateSetting.mutateAsync({ key: v.key, value: v.defaultHsl });
      }
      const reset: Record<string, string> = {};
      for (const v of THEME_VARS) reset[v.key] = hslToHex(v.defaultHsl);
      setColors(reset);
      applyThemeFromSettings(undefined);
      toast.success('Theme reset to defaults');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading theme...
      </div>
    );
  }

  return (
    <div className="border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light tracking-wide flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Palette size={18} /> Website Colors
          </h3>
          <p className="text-xs text-muted-foreground">
            Website এর color পরিবর্তন করুন। Live preview এ সাথে সাথে দেখা যাবে, Save চাপলে সবার জন্য apply হবে।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAll}
            disabled={updateSetting.isPending}
            className="luxury-button-outline inline-flex items-center gap-2 text-[10px] h-10 px-4"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSaveAll}
            disabled={updateSetting.isPending}
            className="luxury-button-primary inline-flex items-center gap-2 text-[10px] h-10 px-4"
          >
            {updateSetting.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEME_VARS.map(v => (
          <div key={v.key} className="flex items-center gap-3 border border-border p-3">
            <input
              type="color"
              value={colors[v.key] || hslToHex(v.defaultHsl)}
              onChange={e => handleChange(v.key, e.target.value)}
              className="h-12 w-14 cursor-pointer border border-border bg-transparent"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{v.label}</div>
              <input
                type="text"
                value={colors[v.key] || ''}
                onChange={e => handleChange(v.key, e.target.value)}
                className="luxury-input mt-1 h-8 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminThemeSettings;
