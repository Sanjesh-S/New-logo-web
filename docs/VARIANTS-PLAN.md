# Product Variants Plan – iPhone & Samsung (Cashify-style)

## Goal
- Show **variants** (e.g. storage: 256 GB, 512 GB, 1 TB) on the **product detail page** before "Get Exact Value", like Cashify.
- User **chooses a variant** → displayed price and assessment use that variant’s base price.
- **Admin**: set variants and base price per variant for each product (iPhone/Samsung); pricing modifiers stay per product.

---

## 1. Data model

### Product type (extend existing)
- Add optional **`variants`** on `Product`:
  - **`variants?: ProductVariant[]`**
  - **`ProductVariant`**: `{ id: string, label: string, basePrice: number, internalBasePrice?: number }`
- **`id`**: stable slug for the variant (e.g. `"256gb"`, `"512gb"`, `"1tb"`). Used in URL and assessment.
- **`label`**: display text (e.g. "256 GB", "512 GB", "1 TB").
- **`basePrice`**: display "Get Upto" price for this variant.
- **`internalBasePrice`**: optional; used for calculation; default `basePrice * 0.5` if omitted.

**When to use variants**
- Use for **phones** (iPhone, Samsung) where the same model has multiple storage/options.
- Other categories (cameras, laptops, tablets) can get variants later; same structure.

**Backward compatibility**
- If `variants` is missing or empty, product behaves as today: single `basePrice` / `internalBasePrice` on the product.

---

## 2. Product detail page (front-end)

### Where
- **`components/ProductDetail.tsx`** and **`app/product/page.tsx`** (only ProductDetail logic).

### Behaviour
1. **No variants** (current behaviour):
   - Show single "Get Upto" using `product.basePrice`.
   - "Get Exact Value" → assessment with current URL (no variant param).

2. **With variants** (`product.variants` exists and length > 0):
   - Show section **"Choose a variant"** (heading like Cashify).
   - Render one option per variant (e.g. "256 GB", "512 GB", "1 TB") as selectable buttons/cards.
   - **Default**: select first variant (or none and require selection before CTA).
   - **Selected variant**:
     - Drives displayed "Get Upto" price: use `variant.basePrice`.
     - "Get Exact Value" link: add **`variantId=<variant.id>`** to the assessment URL (e.g. `variantId=256gb`).
   - If no variant selected and you require it: disable "Get Exact Value" or show "Please select a variant".

### URL shape (assessment with variant)
- Current:  
  `/assessment?id=<productId>&category=...&brand=...&model=...`
- With variant:  
  `/assessment?id=<productId>&category=...&brand=...&model=...&variantId=256gb`

---

## 3. Assessment flow (use variant price)

### Where
- **`components/AssessmentWizard.tsx`**: reads product, computes price.
- **`app/assessment/page.tsx`**: passes search params (add `variantId`).

### Behaviour
1. Assessment page reads **`variantId`** from URL (e.g. `searchParams.get('variantId')`).
2. **AssessmentWizard** loads product via existing `getProductById(productId)`.
3. **If product has variants and `variantId` is present**:
   - Find `product.variants.find(v => v.id === variantId)`.
   - Use **variant’s** `basePrice` and `internalBasePrice` (or variant’s `basePrice * 0.5` if no internalBasePrice) for:
     - Initial displayed price.
     - `calculatePrice(internalBasePrice, answers, rules)`.
   - Optionally store `variantId` (and variant label) in submission payload (e.g. valuation/order) so order summary and backend know which variant was chosen.
4. **If no variant or no match**:
   - Use product’s `basePrice` / `internalBasePrice` as today (backward compatible).

### Order summary / valuation
- Add **`variantId`** (and if useful **`variantLabel`**) to the data you send to order-summary and to Firebase (e.g. valuation document or order payload) so admin and history show "iPhone 16 Pro Max – 256 GB".

---

## 4. Admin – Product form (set variants per product)

### Where
- **`components/admin/ProductFormModal.tsx`** (create/edit product).
- **`lib/firebase/database.ts`**: **createProduct** / **updateProduct** (and any type/interface for Product) must accept and persist **`variants`**.

### Behaviour
1. **When category is Phone** (or when "Show variants" is checked):
   - Show a **"Variants"** section:
     - List of variants: each row has **Label** (e.g. "256 GB"), **Base price (₹)**, optional **Internal base price (₹)**.
     - Buttons: **Add variant**, **Remove** per row.
   - Validation: if variants are enabled, at least one variant; each variant has label and basePrice > 0.
2. **Variant id**: auto-generate from label for new variants (e.g. "256 GB" → id `"256gb"`), or let admin edit id once. Ensure uniqueness per product.
3. **Save**: send **`variants`** array in the product payload to Firebase (product document or subcollection). Prefer **array on product document** for simplicity (`product.variants`).
4. **When product has variants**:
   - Optionally set **product.basePrice** = first variant’s basePrice (or min/max) so listing page can show "From ₹X" or "Get Upto ₹X" without loading variants in list. Alternatively keep product.basePrice as "default" and only use variant prices on detail/assessment.

### iPhone vs Samsung
- Same UI: both are "Phone". Admin adds whatever variants per model (e.g. iPhone 16 Pro Max: 256 GB, 512 GB, 1 TB; Samsung S24: 128 GB, 256 GB, 512 GB). No separate "iPhone vs Samsung" logic in form; only category = Phone and variant list.

---

## 5. Admin – Pricing calculator (modifiers per product)

### Where
- **`components/admin/PricingCalculator.tsx`**.

### Behaviour
- **Pricing rules (modifiers)** remain **per product** (one set of rules per product id). They apply to **all variants** of that product; only the **base price** changes by variant (stored in `product.variants`).
- **No change** to how you save/load pricing rules: still by `productId`. Optionally show a short note when the selected product has variants: "This product has variants. Base prices are set in the Product form; modifiers below apply to all variants."
- **Optional later**: per-variant modifier overrides (e.g. different deduction for 1 TB). Not required for first version.

---

## 6. Firebase / backend

### Products collection
- **Product document** may include:
  - **`variants`**: array of `{ id, label, basePrice, internalBasePrice? }`.
- **Read**: **getProductById**, **getAllProducts**, **getProductsByBrand** (and any mapper) must read **`variants`** from the document and attach to `Product` so front-end and assessment see them.
- **Write**: **createProduct** / **updateProduct** must accept and write **`variants`** when provided.

### Valuations / orders
- Store **`variantId`** (and optionally **`variantLabel`**) in the valuation/order payload so you can display "iPhone 16 Pro Max – 256 GB" in admin and in order summary.

---

## 7. Implementation order

| Step | Task | Files / area |
|------|------|--------------|
| 1 | Extend **Product** type and **ProductVariant**; read/write **variants** in Firebase (getProductById, getAllProducts, createProduct, updateProduct, mapDocToProduct). | `lib/firebase/database.ts`, `Product` type |
| 2 | **ProductDetail**: if `product.variants?.length`, show "Choose a variant", selection state, display price from selected variant, link "Get Exact Value" with `variantId`. | `components/ProductDetail.tsx` |
| 3 | **Assessment page**: pass **variantId** from URL to AssessmentWizard. | `app/assessment/page.tsx` |
| 4 | **AssessmentWizard**: read **variantId**; if product has variants and variantId set, use variant’s base/internal price for calculation and display; pass variantId/variantLabel to order/valuation. | `components/AssessmentWizard.tsx` |
| 5 | **ProductFormModal**: for Phone (or toggle), add Variants section (add/remove rows, label + basePrice + optional internalBasePrice); save **variants** with product. | `components/admin/ProductFormModal.tsx` |
| 6 | **PricingCalculator**: optional note when selected product has variants; no change to save/load rules. | `components/admin/PricingCalculator.tsx` |
| 7 | **Order summary / valuation**: include **variantId** / **variantLabel** in payload and display. | Order summary component, Firebase valuation schema if needed |

---

## 8. Example variant sets (reference)

- **iPhone 16 Pro Max**: 256 GB, 512 GB, 1 TB.  
- **Samsung Galaxy S24 Ultra**: 256 GB, 512 GB, 1 TB.  
- **Samsung Galaxy S24 (normal)**: 128 GB, 256 GB.  

Admin configures these per product in the Product form; no hardcoding required.

---

## 9. Summary

- **One product document** per model (e.g. "iPhone 16 Pro Max") with optional **`variants`** array.
- **Product page**: "Choose a variant" → show variant price → "Get Exact Value" with **variantId**.
- **Assessment**: use **variantId** to pick base price from **product.variants**; same modifiers for all variants.
- **Admin**: Product form defines variants and base price per variant for iPhone/Samsung (and other phones); Pricing Calculator keeps one set of modifiers per product.

This gives you Cashify-style variant selection and per-variant pricing while reusing your existing assessment and pricing logic.
