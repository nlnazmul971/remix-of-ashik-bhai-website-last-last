export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const calcReadingTime = (html: string) => {
  const text = (html || '').replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

export const extractTOC = (html: string): { id: string; text: string; level: number }[] => {
  if (!html) return [];
  const matches = Array.from(html.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi));
  return matches.map((m) => {
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    return { id: slugify(text), text, level: Number(m[1]) };
  });
};

export const injectHeadingIds = (html: string) => {
  if (!html) return '';
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_full, lvl, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    const id = slugify(text);
    if (/id\s*=/.test(attrs)) return `<h${lvl}${attrs}>${inner}</h${lvl}>`;
    return `<h${lvl} id="${id}"${attrs}>${inner}</h${lvl}>`;
  });
};
