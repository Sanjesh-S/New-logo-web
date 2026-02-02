 # How Prices Are Calculated

This document describes how trade-in / valuation prices are calculated in the WorthyTen app.

---

## 1. Main flow (assessment-based pricing)

The **primary** price calculation is used when a user goes through the **Assessment Wizard** (select product → answer questions → get quote).

### 1.1 Formula

```
finalPrice = internalBasePrice + totalModifier
```

- **internalBasePrice**: The “starting” value for the device. Comes from the product:
  - `product.internalBasePrice` if set, otherwise  
  - `product.basePrice * 0.5` (50% of display/base price).
- **totalModifier**: Sum of all **per-answer modifiers** from pricing rules (can be positive or negative). Each assessment answer (e.g. “Power on: Yes”, “Body condition: Good”) maps to a modifier value; unanswered questions do not affect the total.
- **finalPrice** is never negative: `Math.max(0, finalPrice)`.

**Implementation:** `lib/pricing/modifiers.ts` → `calculatePrice(internalBasePrice, answers, rules)`.

### 1.2 Where the numbers come from

| Input | Source |
|-------|--------|
| **Product** (basePrice, internalBasePrice) | Firestore `products` collection. Each product has `basePrice` (display) and optional `internalBasePrice`. |
| **Pricing rules** (modifiers per answer) | Loaded in this order: 1) `productPricing` collection (by productId), 2) product’s `pricingRules` field, 3) global `settings/pricing`, 4) fallback `DEFAULT_PRICING_RULES` in `lib/types/pricing.ts`. |
| **Answers** | User’s choices in the Assessment Wizard (e.g. powerOn, bodyCondition, accessories). |

### 1.3 Modifier types (summary)

- **Yes/No questions**: e.g. powerOn, cameraFunction, waterDamage → each maps to a `{ yes: number, no: number }` (often `yes: 0`, `no: negative`).
- **Single-select conditions**: e.g. lensCondition, bodyCondition, displayCondition, bodyPhysicalCondition, rubberGripsCondition, sensorViewfinderCondition, errorCodesCondition, fungusDustCondition, focusFunctionality, rubberRingCondition, lensErrorStatus, age → one modifier per option.
- **Multi-select (additive)**: e.g. displayCondition, bodyCondition, functionalIssues, accessories → sum of modifiers for each selected option. For functionalIssues, “No issues” overrides other selections.
- **Accessories / age**: Additive bonuses or deductions from the rules.

Exact keys and structure are in `lib/types/pricing.ts` (`PricingRules`) and `lib/pricing/modifiers.ts` (which answer IDs map to which rule).

### 1.4 Flow in the app

1. User selects a product → product (and optionally product-specific pricing) is loaded from Firestore.
2. Assessment Wizard loads pricing rules (productPricing → product.pricingRules → global → default).
3. On every answer change, `calculatePrice(internalBasePrice, answers, pricingRules)` runs and updates the shown price.
4. On submit, that **calculated price** is sent as `estimatedValue` when creating the valuation (API or Firebase function). The API does **not** recalculate; it stores the client-provided `basePrice` and `estimatedValue`.

---

## 2. Product base prices (admin / Firestore)

- **basePrice**: Shown to the user as the “starting” or “boom” price (e.g. on product cards, admin products list).
- **internalBasePrice**: Used only for the assessment formula above. If missing, it is set to `basePrice * 0.5` (and in admin ProductFormModal, default internal is often `basePrice * 0.75` when editing).
- These are set in the **Admin** → Products → Add/Edit Product (and stored in the `products` collection).

---

## 3. Legacy / simple calculate API (not used by Assessment Wizard)

There is a separate, **simpler** calculation used by the `/api/calculate` route and Firebase `calculate` function:

- **Input**: brand, model, condition, usage, accessories (high-level only).
- **Logic**:  
  - Base price from a **hardcoded** map `BASE_PRICES[brand][model]` (see `app/api/calculate/route.ts` and `functions/src/calculate.ts`).  
  - Then: `value = basePrice * CONDITION_MULTIPLIERS[condition] * USAGE_MULTIPLIERS[usage]` plus fixed amounts for accessories (box, battery, lens).
- **Output**: `basePrice`, `estimatedValue`.

This path is **not** used when the user goes through the Assessment Wizard; the wizard uses only the modifier-based calculation in §1.

---

## 4. Where each price appears

| Place | What is shown |
|-------|----------------|
| Product card / search / product detail | `product.basePrice` (display price). |
| Assessment Wizard (live quote) | `calculatePrice(internalBasePrice, answers, pricingRules)` → becomes `estimatedValue`. |
| Order summary / success | `estimatedValue` from the created valuation (or from URL params if client-side redirect). |
| Admin products list | `product.basePrice` and often a second column (e.g. internal or calculated); admin Pricing Calculator can use `internalBasePrice` or `basePrice * 0.75`. |
| Valuations (Firestore / API) | `basePrice`, `estimatedValue` (and optional `finalValue`) are stored as provided by the client when creating the valuation. |

---

## 5. Files reference

| File | Role |
|------|------|
| `lib/pricing/modifiers.ts` | **Core formula**: `calculatePrice(internalBasePrice, answers, rules)` – adds modifiers to internal base. |
| `lib/types/pricing.ts` | `PricingRules` type and `DEFAULT_PRICING_RULES` fallback. |
| `components/AssessmentWizard.tsx` | Loads product + pricing rules, calls `calculatePrice` on answer change, submits `estimatedValue` to create valuation. |
| `lib/firebase/database.ts` | Products (basePrice, internalBasePrice, pricingRules), productPricing collection, getPricingRules, getProductById. |
| `app/api/valuations/route.ts` | POST accepts `basePrice`, `estimatedValue` from client and stores them (no server-side price calculation). |
| `functions/src/valuations.ts` | Same: stores client-sent `basePrice` and `estimatedValue`. |
| `app/api/calculate/route.ts` | Legacy simple calculation (brand/model/condition/usage/accessories). |
| `functions/src/calculate.ts` | Same legacy logic for Firebase. |

---

## 6. Changing how prices are calculated

- **Change the formula (e.g. multipliers, min/max, rounding):**  
  Edit `lib/pricing/modifiers.ts` → `calculatePrice`. All assessment-based quotes use this.

- **Change default modifier values:**  
  Edit `DEFAULT_PRICING_RULES` in `lib/types/pricing.ts`. Used only when no product-specific or global rules exist in Firebase.

- **Change per-product or global rules:**  
  Use Admin → Pricing (productPricing collection or global settings) or product’s `pricingRules` in Firestore.

- **Change internal base vs display price:**  
  Admin → Products → set `basePrice` and `internalBasePrice` per product. If `internalBasePrice` is unset, the app uses `basePrice * 0.5` for the assessment formula.
