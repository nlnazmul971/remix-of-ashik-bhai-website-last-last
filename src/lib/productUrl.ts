// Helpers for SEO-friendly product URLs.
// URL pattern: /product/<slugified-name>-<uuid>
// We keep the UUID at the end so lookups remain stable even if the name changes.

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const slugify = (input: string): string => {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
};

export const productPath = (product: { id: string; name?: string | null } | null | undefined): string => {
  if (!product?.id) return '#';
  const slug = slugify(product.name || '');
  return slug ? `/product/${slug}` : `/product/${product.id}`;

};

// Extract a product UUID from a URL param that may be "slug-uuid", "uuid", or a bare slug.
export const extractProductId = (param: string | undefined | null): string => {
  if (!param) return '';
  const match = param.match(UUID_RE);
  return match ? match[0] : param;
};
