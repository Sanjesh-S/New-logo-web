import type { ProductVariant } from '@/lib/firebase/database'
import type { Product } from '@/lib/firebase/database'

function variantIdFromLabel(label: string): string {
  return label.replace(/\s+/g, '').toLowerCase().replace(/gb|tb/gi, (m) => m.toLowerCase())
}

/**
 * Random price within ±percent of base, minimum 1000
 */
function randomPrice(base: number, percent: number): number {
  const delta = base * (percent / 100)
  const min = Math.max(1000, base - delta)
  const max = base + delta
  return Math.round(min + Math.random() * (max - min))
}

/**
 * Product-specific variant rules: first matching rule wins.
 * Order matters: more specific (e.g. iPhone SE, Pro Max) before generic (e.g. iPhone).
 */
type VariantRule = { test: (cat: string, brand: string, model: string) => boolean; variants: string[] }

const PHONE = (c: string) => c.includes('phone') || c.includes('iphone')
const TABLET = (c: string) => c.includes('ipad') || c.includes('tablet')
const APPLE = (b: string) => b.includes('apple')
const SAMSUNG = (b: string) => b.includes('samsung')

const VARIANT_RULES: VariantRule[] = [
  // —— Apple iPhone (model-specific) ——
  { test: (c, b, m) => PHONE(c) && APPLE(b) && (m.includes('se') || m.includes(' iphone se')), variants: ['64 GB', '128 GB', '256 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('pro max'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && (m.includes('pro ') || m.endsWith(' pro')), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && (m.includes('plus') || m.includes(' plus')), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b), variants: ['128 GB', '256 GB', '512 GB'] },
  // —— Samsung phones (model-specific) ——
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('ultra') || m.includes('note')), variants: ['256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('galaxy s') || m.includes('galaxy z')), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('galaxy a') || m.includes('galaxy m') || m.includes('galaxy f')), variants: ['64 GB', '128 GB', '256 GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b), variants: ['128 GB', '256 GB', '512 GB'] },
  // —— Other phones ——
  { test: (c, b, m) => PHONE(c), variants: ['128 GB', '256 GB', '512 GB'] },
  // —— Apple iPad (model-specific) ——
  { test: (c, b, m) => TABLET(c) && APPLE(b) && (m.includes('pro ') || m.includes('ipad pro')), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => TABLET(c) && APPLE(b) && (m.includes('air') || m.includes(' ipad air')), variants: ['64 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => TABLET(c) && APPLE(b) && (m.includes('mini') || m.includes(' ipad mini')), variants: ['64 GB', '256 GB'] },
  { test: (c, b, m) => TABLET(c) && APPLE(b), variants: ['64 GB', '128 GB', '256 GB', '512 GB'] },
  // —— Other tablets ——
  { test: (c, b, m) => TABLET(c), variants: ['64 GB', '128 GB', '256 GB'] },
  // —— Laptops ——
  { test: (c, b, m) => c.includes('laptop'), variants: ['8 GB RAM', '16 GB RAM', '32 GB RAM'] },
  // —— Cameras ——
  { test: (c, b, m) => c.includes('camera') || c.includes('dslr'), variants: ['Body Only', 'With Kit Lens'] },
]

/**
 * Default variant labels per product (category, brand, model).
 * Used when seeding "Add variants to all products".
 */
export function getDefaultVariantLabels(product: Product): string[] {
  const cat = (product.category || '').toLowerCase()
  const brand = (product.brand || '').toLowerCase()
  const model = (product.modelName || '').toLowerCase()

  for (const rule of VARIANT_RULES) {
    if (rule.test(cat, brand, model)) return rule.variants
  }
  return []
}

/**
 * Build variants with random prices from product base price.
 * First variant ~85% of base, last ~120%, with small randomness.
 */
export function buildVariantsWithRandomPrices(
  product: Product,
  labels?: string[]
): ProductVariant[] {
  const list = labels && labels.length > 0 ? labels : getDefaultVariantLabels(product)
  if (list.length === 0) return []

  const base = product.basePrice || 50000
  const n = list.length
  const variants: ProductVariant[] = list.map((label, i) => {
    const ratio = n === 1 ? 1 : 0.85 + (i / (n - 1)) * 0.35
    const price = randomPrice(base * ratio, 6)
    return {
      id: variantIdFromLabel(label),
      label,
      basePrice: price,
    }
  })
  return variants
}

/**
 * Add variants to a product (for seeding). Returns updated product payload.
 */
export function addVariantsToProduct(product: Product): Partial<Product> {
  const variants = buildVariantsWithRandomPrices(product)
  if (variants.length === 0) return {}
  const basePrice = Math.max(...variants.map((v) => v.basePrice))
  const internalBasePrice = product.internalBasePrice ?? basePrice * 0.5
  return {
    variants,
    basePrice,
    internalBasePrice,
  }
}
