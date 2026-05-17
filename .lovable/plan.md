## Ptex-Inspired Storefront Rebuild Plan

Ptexfashion.com er **layout, structure, typography vibe, spacing** match korbo, kintu **HIGHLIGHTS branding, logo, products, content** thakbe. 4 ti phase, prottek phase shesh hoile preview dekhe approve korle next phase e jabo.

---

### Design Tokens (apply once, phase 0)

- Font: Jost (Google Fonts) heading + body, weight 400/500/600
- Color tokens (HSL added to `index.css`):
  - `--background`: 0 0% 100%
  - `--foreground`: 0 0% 0%
  - `--primary`: 36 32% 43% (cream-brown #917749)
  - `--primary-foreground`: 0 0% 100%
  - `--muted`: 0 0% 96%
  - `--border`: 0 0% 93%
  - `--price-sale`: 0 75% 60%
- Spacing: container 1200px max, section gap 100/80/60/48 (desk/laptop/tab/mobile)
- Button radius 5px, input radius 5px

---

### Phase 1 — Header + Hero + Home sections

Files: `Header.tsx`, `Hero.tsx`, `Index.tsx`, new `AnnouncementBar.tsx`, `CategoryGrid.tsx`, `ProductCarousel.tsx`, `IconBoxRow.tsx`, `Footer.tsx`

Layout match:
```
[ announcement bar - dismissible, promo gradient strip ]
[ topbar: email | facebook | instagram .......... lang/currency ]
[ tagline strip: brand tagline center ]
[ main header: nav-left .... centered logo .... search|account|wishlist|cart ]
[ hero slider: full-bleed, prev/next arrows, dots, overlay heading+CTA ]
[ category grid: 3-up cards with hover zoom ]
[ "New Arrivals" product carousel - 4 visible desktop, swipeable ]
[ promo banner row: 2 split images with CTA ]
[ "Best Sellers" carousel ]
[ icon-box row: shipping / returns / support / payment ]
[ footer: 4 col + newsletter + social + payment icons ]
```

### Phase 2 — PLP (Collection page)

File: new `pages/Collection.tsx`, route `/collections/:slug`

Layout match:
- Breadcrumb (Home › Collection)
- Featured strip of repeated banners (ptex style horizontal scroll)
- Left filter sidebar (Availability, Size, Price slider with min/max inputs)
- Top bar: sort dropdown + grid density switcher (1/2/3/4/5 col icons)
- Product grid using existing `ProductCard` (already 3/4 ratio per memory)
- Load more / pagination

### Phase 3 — PDP (Product detail)

File: rewrite `pages/ProductDetail.tsx` layout

- Sticky image gallery left (thumbnails column + main image, vertical scroll)
- Right column: title, price, review stars, short desc, color swatch, size pills, qty stepper, ATC + Buy Now, wishlist heart, trust icons row, accordion (description / shipping / size chart / reviews)
- Sticky ATC bar on scroll mobile
- "You may also like" carousel
- Reviews block (existing data)

### Phase 4 — Cart drawer + Checkout

- Cart drawer: slide-in right, line items with qty steppers, subtotal, free-shipping progress bar, "View Cart" + "Checkout" buttons, upsell carousel
- Checkout page: 2-col layout (form left, order summary sticky right), shipping address → courier zone → payment method radio cards → place order

---

### Out of scope

- Backend logic changes (Supabase tables, RLS, edge functions stay as-is)
- Admin panel changes
- New product/order business rules
- Copying ptex's actual logo, product images, hero illustrations, or copy text

### How we'll work

1. I implement Phase 1 fully → you review preview → approve
2. Move to Phase 2 → same cycle
3. Phase 3, Phase 4

Approve korle ami Phase 1 (design tokens + header + hero + home sections) diye shuru korbo.
