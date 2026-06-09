// Hex <-> HSL helpers for runtime theme customization.
// CSS variables in this project store HSL as "H S% L%" (without hsl()).

export const hexToHsl = (hex: string): string | null => {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const hslToHex = (hsl: string): string => {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; }
  else if (h < 120){ r = x; g = c; }
  else if (h < 180){ g = c; b = x; }
  else if (h < 240){ g = x; b = c; }
  else if (h < 300){ r = x; b = c; }
  else             { r = c; b = x; }
  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const THEME_VARS = [
  { key: 'theme_primary',        cssVar: '--primary',        label: 'Primary',          defaultHsl: '182 39% 76%' },
  { key: 'theme_accent',         cssVar: '--accent',         label: 'Accent / CTA',     defaultHsl: '38 45% 60%' },
  { key: 'theme_background',     cssVar: '--background',     label: 'Page Background',  defaultHsl: '210 17% 98%' },
  { key: 'theme_foreground',     cssVar: '--foreground',     label: 'Text Color',       defaultHsl: '210 24% 16%' },
  { key: 'theme_announce',       cssVar: '--announce',       label: 'Announcement Bar', defaultHsl: '182 39% 76%' },
  { key: 'theme_announce_text',  cssVar: '--announce-foreground', label: 'Announce Text', defaultHsl: '200 40% 18%' },
] as const;

export const applyThemeFromSettings = (settings: Record<string, string> | undefined) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const v of THEME_VARS) {
    const stored = settings?.[v.key];
    const hsl = stored && /^\d/.test(stored) ? stored : v.defaultHsl;
    root.style.setProperty(v.cssVar, hsl);
  }
};
