Plan:

1. Update the tracking payload builder so it correctly reads cart items shaped like `{ product, quantity, size, color }`.
   - Right now `buildFbContent()` checks `it.product_id`, `it.id`, `it.name`, etc. before safely using nested `it.product` data.
   - For cart/checkout/purchase items, product data is mostly inside `it.product`, so server events can end up with only `value` and `currency`.

2. Send Facebook CAPI fields in multiple compatible locations:
   - Top-level: `content_ids`, `content_name`, `content_category`, `content_type`, `contents`, `num_items`
   - Inside `ecommerce`: same FB fields as backup
   - Keep GA4 `ecommerce.items` as-is for browser/GTM compatibility

3. Add event-name aliases if needed for GTM/sGTM mapping:
   - Keep existing app events like `view_item`, `begin_checkout`, `purchase`
   - Add Meta-friendly event labels such as `ViewContent`, `InitiateCheckout`, `Purchase` in payload fields so tag mapping can read either format

4. Verify by testing the dataLayer output locally in code/preview:
   - Product view should include product ID/name/category
   - Add to cart should include product ID/name/category/quantity
   - Checkout and purchase should include all cart products and `num_items`

After this, if Events Manager still shows only 2 parameters, the remaining issue will be GTM/sGTM tag mapping—not the website payload.