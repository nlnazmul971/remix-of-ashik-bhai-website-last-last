import { useEffect } from 'react';
import { useStoreSettings } from '@/hooks/useSupabase';
import { applyThemeFromSettings } from '@/lib/colorUtils';

/**
 * Mounts once at app root. Reads color theme values from store_settings
 * and applies them as CSS custom properties on :root.
 * Gracefully no-ops when the database is empty.
 */
const ThemeLoader = () => {
  const { data: settings } = useStoreSettings();
  useEffect(() => {
    applyThemeFromSettings(settings as Record<string, string> | undefined);
  }, [settings]);
  return null;
};

export default ThemeLoader;
