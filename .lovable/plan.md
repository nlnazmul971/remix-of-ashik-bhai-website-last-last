# PTex Fashion — Pixel-perfect Clone Plan

Video reference থেকে যা ধরা পড়েছে: এটা **Shopify Dawn-style clean kids' fashion store**, আমাদের current luxury/boutique direction থেকে আলাদা। নিচে phase-wise সব change।

## Visual Identity (সবার আগে)

- **Color**: Gold/khaki brown `#917749` already আছে — রেখে দিচ্ছি (video এর সাথে match)
- **Font**: System sans (Helvetica/Inter feel), heading slightly serif-leaning। `Jost` কে replace করে `Inter` + `Lora` (headings) দিব
- **Background**: pure white, accent cream `#fdf8f3`
- **Border radius**: nearly 0 (Dawn-style)

## Phase A — Header & Top chrome

```
┌─ Orange banner: "SUMMER SALE | 20% OFF on orders above 2000 BDT" ─┐
├─ TopBar: ✉ email | f Facebook | ◯ Instagram ────────────────────┤
├─ Main: [Logo PTex centered] [Search bar full-width below] ──────┤
│        Popular Searches: Rompers · Bodysuits · T-shirt · Tank Top │
├─ Nav: Home  New Arrivals  Infant▾  Boy▾  Girl▾  Women▾  Seasonal▾│
```

- Search bar কে **icon থেকে full-width input** এ convert করব (header এর ভিতরেই)
- "Popular Searches" row যোগ
- Nav dropdown simple white panel (যেমন আছে কিন্তু left-aligned)

## Phase B — Homepage sections (top to bottom)

1. **Hero**: existing slider রাখব, কিন্তু "Summer Drop" style decorative big-typography banner
2. **Category grid** (3-col): Infant / Boy / Girl / Women circles or cards
3. **New Arrivals** carousel (product cards, Dawn style — square image, name, price below, no hover overlay)
4. **Decorative "Hell Summer" band** (repeating poster strip)
5. **Close Look slider** — left image + right zoomed fabric grid
6. **Best Selling** with `This Month / Previous Month` tab switcher, 4-col grid
7. **Our Products, Your Words** — 3-col review carousel with stars + reviewer name + tiny product thumb
8. **Shop The Look** — 2-col lifestyle photos linking to collections
9. **Care Guide** banner — left image + right text + "Learn More" button
10. **About PTex Fashion** — centered paragraph
11. **Footer** (existing OK, slight tweak)

## Phase C — Product Card redesign

Current card: 3/4 aspect + glassmorphism overlay buttons (luxury style).
Target (Dawn style):
- Square image (1:1), no overlay, no hover quick-buttons by default
- Only heart icon top-right on hover
- Title (2-line clamp) below image, simple
- Price `Tk 200.00` below title
- On hover: subtle 3 quick-action icons (wishlist, compare, quick-view) appear top-right
- "Select options" button slides up from bottom on hover

## Phase D — PDP (Product Detail)

```
Breadcrumb: 🏠 Home › Infant › Tops › Product Name

[vertical thumb column] [main image]    [right info panel]
                                        Title (large)
                                        Tk 200.00
                                        Size: 1-2 years
                                        [1-2 Years][2-4 Years][4-6 Years]
                                        Quantity [- 1 +]  [Add to cart]
                                        [          Buy it now (gold)        ]

Tabs: Size Chart | Product description | Shipping & Return
... content ...

Customer Reviews (stars + "Be the first to write a review")

You may also like — 4 product cards
```

## Phase E — Cart Drawer

Right slide-in drawer:
- Green success banner "✓ Product added to cart successfully"
- Item: thumb + name + size + price + qty stepper + Remove
- Note textarea toggle
- Subtotal
- "Check out" (gold solid)
- "View Cart" link

## Phase F — Checkout (Shopify-style 2-column)

```
[ Logo center ]                          [ 🛒 ]
─────────────────────────────────────────────
| LEFT (form)                | RIGHT (summary)
| Contact  [Sign in]         | thumb + name + size  Tk 200
|   email                    | Subtotal       Tk 200
|   ☐ Email me news          | Shipping       Tk 70
| Delivery                   | Total      BDT Tk 270
|   Country: Bangladesh      |
|   First/Last name          |
|   Address                  |
|   Apt (optional)           |
|   City / Postal            |
|   Phone                    |
|   ☐ Save for next time     |
| Shipping method            |
|   ◉ Inside Dhaka  Tk 70    |
|   ○ Outside Dhaka Tk 120   |
| Payment                    |
|   ◉ Cash on Delivery       |
| Billing                    |
|   ◉ Same as shipping       |
|   ○ Use different          |
| [   Complete order (blue)  ]
| Refund · Shipping · Privacy · Terms · Contact
```

Current checkout বদলে Shopify-clone 2-column করব।

## Phase G — Cleanup

- Phase 1 এ যোগ করা `IconBoxRow` সরিয়ে দিব (video তে নাই)
- Luxury overlay/glass effects সরাব
- "Jost" → Inter + Lora swap
- Mock data video এর সাথে align (kids' clothing names)

---

## Technical notes

- শুধু **frontend/presentation** change, backend untouched
- Existing hooks (`useProducts`, `useStoreSettings`, `useCart`) intact
- ProductCard একদম rewrite হবে
- New components: `HomeCategoryGrid`, `BestSellingTabs`, `ReviewsCarousel`, `ShopTheLook`, `CareGuide`, `AboutSection`, `PopularSearches`
- Checkout পুরো rewrite

## Order of execution

আমি step-by-step এক phase করে করব আর confirm নিব।
**Start: Phase A (header + top chrome)** — এটা সবচেয়ে visible, এটা ঠিক হলে বাকি pieces fit হবে।

Confirm করলেই Phase A start করি।
