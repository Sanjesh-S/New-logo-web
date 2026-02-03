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
  // —— Apple iPhone (verified storage by model) ——
  { test: (c, b, m) => PHONE(c) && APPLE(b) && (m.includes('se') || m.includes(' iphone se')), variants: ['64 GB', '128 GB', '256 GB'] },
  // 16 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('16 pro max'), variants: ['256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('16 pro'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('16 plus'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 16'), variants: ['128 GB', '256 GB', '512 GB'] },
  // 15 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('15 pro max'), variants: ['256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('15 pro'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('15 plus'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 15'), variants: ['128 GB', '256 GB', '512 GB'] },
  // 14 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('14 pro max'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('14 pro'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('14 plus'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 14'), variants: ['128 GB', '256 GB', '512 GB'] },
  // 13 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('13 pro max'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('13 pro'), variants: ['128 GB', '256 GB', '512 GB', '1 TB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('13 mini'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 13'), variants: ['128 GB', '256 GB', '512 GB'] },
  // 12 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('12 pro max'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('12 pro'), variants: ['128 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('12 mini'), variants: ['64 GB', '128 GB', '256 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 12'), variants: ['64 GB', '128 GB', '256 GB'] },
  // 11 series
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('11 pro max'), variants: ['64 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('11 pro'), variants: ['64 GB', '256 GB', '512 GB'] },
  { test: (c, b, m) => PHONE(c) && APPLE(b) && m.includes('iphone 11'), variants: ['64 GB', '128 GB', '256 GB'] },
  // Fallback for other iPhones (older or future)
  { test: (c, b, m) => PHONE(c) && APPLE(b), variants: ['128 GB', '256 GB', '512 GB'] },
  // —— Samsung Galaxy (verified RAM + storage by model) ——
  // S24 series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s24 ultra'), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB', '12GB RAM + 1TB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('s24+') || m.includes('s24 +')), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s24'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  // S23 series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s23 ultra'), variants: ['8GB RAM + 256GB', '12GB RAM + 256GB', '12GB RAM + 512GB', '12GB RAM + 1TB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('s23+') || m.includes('s23 +')), variants: ['8GB RAM + 256GB', '8GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s23'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  // S22 series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s22 ultra'), variants: ['8GB RAM + 128GB', '12GB RAM + 256GB', '12GB RAM + 512GB', '12GB RAM + 1TB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('s22+') || m.includes('s22 +')), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s22'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  // S21 series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s21 ultra'), variants: ['12GB RAM + 128GB', '12GB RAM + 256GB', '16GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('s21+') || m.includes('s21 +')), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('s21'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  // Z Flip series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z flip 5'), variants: ['8GB RAM + 256GB', '8GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z flip 4'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB', '8GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z flip 3'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z flip'), variants: ['8GB RAM + 128GB', '8GB RAM + 256GB'] },
  // Z Fold series
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z fold 5'), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB', '12GB RAM + 1TB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z fold 4'), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z fold 3'), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB'] },
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && m.includes('z fold'), variants: ['12GB RAM + 256GB', '12GB RAM + 512GB'] },
  // Note / other Ultra
  { test: (c, b, m) => PHONE(c) && SAMSUNG(b) && (m.includes('note') || m.includes('ultra')), variants: ['8GB RAM + 256GB', '12GB RAM + 512GB', '12GB RAM + 1TB'] },
  // Galaxy A/M/F
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
  return {
    variants,
    basePrice,
  }
}
