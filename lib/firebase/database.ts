import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore'
import { db } from './config'
import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('Database')

// Database Schema Types
export interface Valuation {
  id?: string
  orderId?: string // Custom Order ID (e.g., TN37WTDSLR1001)
  userId?: string
  category: 'cameras' | 'phones' | 'laptops'
  brand: string
  model: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  usage: 'light' | 'moderate' | 'heavy'
  accessories: string[]
  basePrice: number
  estimatedValue: number
  finalValue?: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  pickupAddress?: string
  pickupDate?: Date | Timestamp
  pickupTime?: string
  paymentMethod?: string
  state?: string
  pincode?: string
  answers?: Record<string, unknown>
}

export interface Device {
  id: string
  brand: string
  model: string
  category: 'cameras' | 'phones' | 'laptops'
  basePrice: number
  imageUrl?: string
  specifications?: Record<string, any>
  createdAt: Timestamp | Date
}

// Product variant (e.g. storage: 256 GB, 512 GB, 1 TB) – used for phones (iPhone, Samsung)
export interface ProductVariant {
  id: string
  label: string
  basePrice: number // Single price for the variant
}

// Products used for listing (backed by `products` collection in Firestore)
export interface Product {
  id: string
  brand: string
  category: string
  modelName: string
  basePrice: number // Single price - all calculations use this price
  imageUrl?: string
  pricingRules?: PricingRules // Product-specific override rules
  variants?: ProductVariant[] // Optional storage/variant options (phones)
}

export interface User {
  id: string
  email?: string
  name?: string
  phone?: string
  address?: string
  createdAt: Timestamp | Date
}

export interface UserPreferences {
  email?: string
  emailNotifications?: boolean
  smsNotifications?: boolean
  marketingEmails?: boolean
  updatedAt?: Timestamp | Date
}

// Helper to get db with type safety
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized. This function must be called on the client side.')
  }
  return db
}

// Valuation Operations
export async function createValuation(valuation: Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const valuationRef = collection(getDb(), 'valuations')
  const newValuation = {
    ...valuation,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  const docRef = await addDoc(valuationRef, newValuation)
  return docRef.id
}

export async function getValuation(id: string): Promise<Valuation | null> {
  try {
    // First try to fetch by document ID
    const docRef = doc(getDb(), 'valuations', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Valuation
    }
    
    // If not found by document ID, try to find by orderId field
    const valuationsRef = collection(getDb(), 'valuations')
    const q = query(valuationsRef, where('orderId', '==', id))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const valuationDoc = querySnapshot.docs[0]
      return { id: valuationDoc.id, ...valuationDoc.data() } as Valuation
    }
    
    return null
  } catch (error) {
    logger.error('Error fetching valuation:', error)
    return null
  }
}

export async function updateValuation(id: string, updates: Partial<Valuation>): Promise<void> {
  const docRef = doc(getDb(), 'valuations', id)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

export interface PaginationOptions {
  limit?: number
  startAfter?: QueryDocumentSnapshot
}

export interface PaginatedResult<T> {
  data: T[]
  lastDoc?: QueryDocumentSnapshot
  hasMore: boolean
}

/**
 * Get user valuations with pagination support
 * 
 * @param userId - User ID to filter valuations
 * @param options - Pagination options (limit, startAfter)
 * @returns Paginated result with valuations data
 */
export async function getUserValuations(
  userId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<Valuation>> {
  // Validate userId to prevent querying with empty/invalid values
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { data: [], lastDoc: undefined, hasMore: false }
  }

  const { limit: limitCount = 20 } = options
  const valuationsRef = collection(getDb(), 'valuations')
  
  const q = query(
    valuationsRef,
    where('userId', '==', userId.trim()),
    limit(limitCount + 1)
  )
  
  try {
    const querySnapshot = await getDocs(q)
    logger.debug('Valuations query returned', { count: querySnapshot.docs.length })
    
    let data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Valuation[]
    
    // Sort client-side by createdAt descending
    data.sort((a, b) => {
      const aDate = a.createdAt instanceof Date 
        ? a.createdAt.getTime() 
        : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date 
        ? b.createdAt.getTime() 
        : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    
    const hasMore = data.length > limitCount
    if (hasMore) {
      data = data.slice(0, limitCount)
    }
    
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

    return {
      data,
      lastDoc,
      hasMore,
    }
  } catch (error: any) {
    logger.error('Error fetching valuations:', error?.message || error)
    return {
      data: [],
      lastDoc: undefined,
      hasMore: false,
    }
  }
}

/**
 * Get user valuations (legacy function for backward compatibility)
 */
export async function getUserValuationsLegacy(userId: string): Promise<Valuation[]> {
  const result = await getUserValuations(userId, { limit: 100 })
  return result.data
}

// Device Operations
/**
 * Get devices with pagination support
 * 
 * @param category - Device category
 * @param brand - Optional brand filter
 * @param options - Pagination options
 * @returns Paginated result with devices data
 */
export async function getDevices(
  category: string,
  brand?: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<Device>> {
  const { limit: limitCount = 50, startAfter: startAfterDoc } = options
  const devicesRef = collection(getDb(), 'devices')

  // Normalize category to match database values
  // Database uses: 'Phone', 'Laptop', 'iPad', 'Camera' (capitalized, singular)
  const normalizedCategory = category.toLowerCase().trim()
  let dbCategory = normalizedCategory

  // Map category variations to database values
  // Database uses 'DSLR' and 'Lens' for camera products
  if (normalizedCategory.includes('phone') || normalizedCategory.includes('iphone')) {
    dbCategory = 'Phone' // Try capitalized singular first
  } else if (normalizedCategory.includes('laptop')) {
    dbCategory = 'Laptop'
  } else if (normalizedCategory.includes('tablet') || normalizedCategory.includes('ipad')) {
    dbCategory = 'iPad'
  } else if (normalizedCategory.includes('camera')) {
    dbCategory = 'DSLR' // Database uses 'DSLR' for camera products
  }

  let q
  let querySnapshot

  try {
    if (brand) {
      const constraints: any[] = [
        where('category', '==', dbCategory),
        where('brand', '==', brand.trim()),
        orderBy('brand'),
        orderBy('model'),
        limit(limitCount + 1),
      ]
      
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc))
      }
      
      q = query(devicesRef, ...constraints)
    } else {
      q = query(devicesRef, where('category', '==', dbCategory))
    }

    querySnapshot = await getDocs(q)

    // If no results, try other variations (especially for cameras: DSLR, Lens, Camera)
    if (querySnapshot.empty) {
      let altCategory = dbCategory
      if (normalizedCategory.includes('camera')) {
        // Try Lens if DSLR didn't work, then Camera
        if (dbCategory === 'DSLR') {
          altCategory = 'Lens'
        } else if (dbCategory === 'Lens') {
          altCategory = 'Camera'
        } else {
          altCategory = 'DSLR'
        }
      } else if (normalizedCategory.includes('phone')) {
        altCategory = 'phone'
      } else if (normalizedCategory.includes('laptop')) {
        altCategory = 'laptop'
      } else if (normalizedCategory.includes('tablet') || normalizedCategory.includes('ipad')) {
        altCategory = 'ipad'
      }

      if (brand) {
        q = query(
          devicesRef,
          where('category', '==', altCategory),
          where('brand', '==', brand.trim())
        )
      } else {
        q = query(devicesRef, where('category', '==', altCategory))
      }
      querySnapshot = await getDocs(q)
    }
  } catch (error) {
    logger.error('Error querying devices:', error)
    return { data: [], hasMore: false }
  }

  const devices = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Device[]

  const hasMore = devices.length > limitCount
  const resultDevices = hasMore ? devices.slice(0, limitCount) : devices
  const lastDoc = hasMore ? querySnapshot.docs[limitCount - 1] : undefined

  return {
    data: resultDevices,
    lastDoc,
    hasMore,
  }
}

// Products helpers (for `products` collection)
export async function getProductsByBrand(
  category: string,
  brand: string
): Promise<Product[]> {
  const productsRef = collection(getDb(), 'products')

  // Normalize category to match database values
  const normalizedCategory = category.toLowerCase().trim()

  // Map category variations to database values
  // Database uses: 'Phone', 'Laptop', 'iPad', 'Camera' (capitalized, singular)
  // We need to query for both variations
  let dbCategoryVariations: string[] = []

  if (normalizedCategory.includes('phone') || normalizedCategory.includes('iphone')) {
    dbCategoryVariations = ['Phone', 'phone', 'phones', 'Phones']
  } else if (normalizedCategory.includes('laptop')) {
    dbCategoryVariations = ['Laptop', 'laptop', 'laptops', 'Laptops']
  } else if (normalizedCategory.includes('tablet') || normalizedCategory.includes('ipad')) {
    dbCategoryVariations = ['iPad', 'ipad', 'Tablet', 'tablet', 'tablets', 'Tablets']
  } else if (normalizedCategory.includes('camera')) {
    // Database uses 'DSLR' for camera products (exclude 'Lens' - lenses are separate)
    dbCategoryVariations = ['DSLR', 'dslr', 'Dslr', 'Camera', 'camera', 'cameras', 'Cameras']
  } else {
    dbCategoryVariations = [normalizedCategory, normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1)]
  }

  // Normalize brand (handle case sensitivity)
  const normalizedBrand = brand.trim()

  // Run queries for all category variations in PARALLEL for speed
  // This is much faster than sequential queries
  let snapshot
  try {
    // Create queries for top 3 category variations (to limit parallel requests)
    const queriesToRun = dbCategoryVariations.slice(0, 3).map(catVariation => 
      query(
        productsRef,
        where('brand', '==', normalizedBrand),
        where('category', '==', catVariation)
      )
    )
    
    // Run all queries in parallel
    const snapshots = await Promise.all(queriesToRun.map(q => getDocs(q)))
    
    // Find the first non-empty snapshot
    snapshot = snapshots.find(s => !s.empty) || snapshots[0]

    // If still no results, try querying just by brand (single query)
    if (snapshot.empty) {
      const brandOnlyQ = query(productsRef, where('brand', '==', normalizedBrand))
      snapshot = await getDocs(brandOnlyQ)
    }
  } catch (queryError) {
    logger.error('Firestore query error:', queryError)
    // If query fails, try a simpler query without category filter
    const fallbackQ = query(productsRef, where('brand', '==', normalizedBrand))
    snapshot = await getDocs(fallbackQ)
  }

  const products = snapshot.docs.map(docSnap => {
    const data: any = docSnap.data()

    const modelName =
      data.modelName ??
      data['Model Name'] ??
      data.name ??
      ''

    const basePrice =
      data.basePrice ??
      data.price ??
      data['Price (₹)'] ??
      0

    const imageUrl = data.imageUrl ?? data.image

    const variants = parseVariants(data.variants)

    return {
      id: docSnap.id,
      brand: data.brand,
      category: data.category,
      modelName,
      basePrice,
      imageUrl,
      variants,
    } as Product
  })

  // Additional client-side filtering to ensure category and brand match (fallback)
  // This handles case sensitivity issues and category variations
  // Database uses: 'Phone', 'Laptop', 'iPad', 'Camera' - we need to match these
  const filtered = products.filter(product => {
    const productCategory = product.category?.trim() || ''
    const productBrand = product.brand?.trim() || ''

    // Check category match - handle both database format ('Phone', 'Laptop', 'iPad', 'Camera') and our format ('phones', 'laptops', 'tablets', 'cameras')
    let categoryMatch = false
    const normalizedProductCategory = productCategory.toLowerCase()

    // More flexible matching - check if either contains the other
    if (normalizedCategory.includes('phone') || normalizedCategory.includes('iphone')) {
      categoryMatch = normalizedProductCategory.includes('phone') || normalizedProductCategory.includes('iphone')
    } else if (normalizedCategory.includes('laptop')) {
      categoryMatch = normalizedProductCategory.includes('laptop')
    } else if (normalizedCategory.includes('tablet') || normalizedCategory.includes('ipad')) {
      categoryMatch = normalizedProductCategory.includes('tablet') || normalizedProductCategory.includes('ipad')
    } else if (normalizedCategory.includes('camera')) {
      // For cameras, match 'camera', 'cameras', 'Camera', 'Cameras', 'DSLR'
      // Exclude 'Lens' - lenses are separate products
      categoryMatch = (normalizedProductCategory.includes('camera') ||
        productCategory.toLowerCase().includes('camera') ||
        productCategory.toLowerCase() === 'camera' ||
        productCategory.toLowerCase() === 'cameras' ||
        normalizedProductCategory === 'dslr' ||
        productCategory === 'DSLR' ||
        productCategory === 'dslr') &&
        // Explicitly exclude Lens
        normalizedProductCategory !== 'lens' &&
        productCategory !== 'Lens' &&
        productCategory !== 'lens'
    } else {
      // For other categories, try exact match or substring match
      categoryMatch = normalizedProductCategory === normalizedCategory ||
        normalizedProductCategory.includes(normalizedCategory) ||
        normalizedCategory.includes(normalizedProductCategory) ||
        productCategory.toLowerCase() === normalizedCategory
    }

    // Check brand match (case-insensitive)
    const brandMatch = productBrand.toLowerCase() === normalizedBrand.toLowerCase()

    return categoryMatch && brandMatch
  })

  // If no results after filtering, log details for debugging and try lenient matching
  if (filtered.length === 0 && products.length > 0) {
    const uniqueCategories = [...new Set(products.map(p => p.category))]
    console.warn(`No products found after filtering. Found ${products.length} products for brand "${normalizedBrand}". Categories:`, uniqueCategories)
    console.log(`Looking for category: "${normalizedCategory}" (normalized from "${category}")`)
    console.log(`Tried category variations:`, dbCategoryVariations)

    // Lenient fallback: if we're looking for cameras and products exist, match any product with 'camera' or 'dslr' in category
    // Exclude 'Lens' - lenses are separate products
    if (normalizedCategory.includes('camera')) {
      const lenientFiltered = products.filter(product => {
        const productCategory = (product.category || '').toLowerCase()
        const productBrand = (product.brand || '').toLowerCase()
        // Match camera or dslr categories, but exclude lens
        const isCameraRelated = (productCategory.includes('camera') ||
          productCategory === 'dslr' ||
          product.category === 'DSLR') &&
          productCategory !== 'lens' &&
          product.category !== 'Lens' &&
          product.category !== 'lens'
        return isCameraRelated && productBrand === normalizedBrand.toLowerCase()
      })
      if (lenientFiltered.length > 0) {
        console.log(`Using lenient camera filter: found ${lenientFiltered.length} products (excluding lenses)`)
        return lenientFiltered
      }
    }
  }

  return filtered
}

export async function getProductById(productId: string): Promise<Product | null> {
  const productRef = doc(getDb(), 'products', productId)
  const productSnap = await getDoc(productRef)

  if (!productSnap.exists()) {
    return null
  }

  const data: any = productSnap.data()

  const modelName =
    data.modelName ??
    data['Model Name'] ??
    data.name ??
    ''

  const basePrice =
    data.basePrice ??
    data.price ??
    data['Price (₹)'] ??
    0

  const imageUrl = data.imageUrl ?? data.image

  const pricingRules = data.pricingRules as PricingRules | undefined

  const variants = parseVariants(data.variants)

  return {
    id: productSnap.id,
    brand: data.brand,
    category: data.category,
    modelName,
    basePrice,
    imageUrl,
    pricingRules,
    variants,
  } as Product
}

function parseVariants(raw: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out: ProductVariant[] = []
  for (const v of raw) {
    if (v && typeof v === 'object' && typeof (v as any).id === 'string' && typeof (v as any).label === 'string' && typeof (v as any).basePrice === 'number') {
      out.push({
        id: (v as any).id,
        label: (v as any).label,
        basePrice: Number((v as any).basePrice),
      })
    }
  }
  return out.length > 0 ? out : undefined
}

/**
 * Get lenses by brand
 * Queries products collection for lenses matching the specified brand
 * Future enhancement: Can filter by camera model compatibility when compatibility data is added
 */
export async function getLensesByBrand(brand: string): Promise<Product[]> {
  // Use existing getProductsByBrand function with 'Lens' category
  return getProductsByBrand('Lens', brand)
}

export async function getDevice(brand: string, model: string): Promise<Device | null> {
  const devicesRef = collection(getDb(), 'devices')
  const q = query(
    devicesRef,
    where('brand', '==', brand.toLowerCase()),
    where('model', '==', model)
  )
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Device
  }
  return null
}

// User Operations
export async function createOrUpdateUser(userId: string, userData: Partial<User>): Promise<void> {
  const userRef = doc(getDb(), 'users', userId)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    await updateDoc(userRef, userData)
  } else {
    await setDoc(userRef, {
      id: userId,
      ...userData,
      createdAt: Timestamp.now(),
    })
  }
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(getDb(), 'users', userId)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User
  }
  return null
}

// Admin Operations
export async function getAllProducts(): Promise<Product[]> {
  const productsRef = collection(getDb(), 'products')
  const snapshot = await getDocs(productsRef)

  return snapshot.docs.map(docSnap => {
    const data: any = docSnap.data()

    const modelName =
      data.modelName ??
      data['Model Name'] ??
      data.name ??
      ''

    const basePrice =
      data.basePrice ??
      data.price ??
      data['Price (₹)'] ??
      0

    const imageUrl = data.imageUrl ?? data.image

    const pricingRules = data.pricingRules as PricingRules | undefined

    const variants = parseVariants(data.variants)

    return {
      id: docSnap.id,
      brand: data.brand,
      category: data.category,
      modelName,
      basePrice,
      imageUrl,
      pricingRules,
      variants,
    } as Product
  })
}

function mapDocToProduct(docSnap: QueryDocumentSnapshot): Product {
  const data: any = docSnap.data()
  const modelName = data.modelName ?? data['Model Name'] ?? data.name ?? ''
  const basePrice = data.basePrice ?? data.price ?? data['Price (₹)'] ?? 0
  const imageUrl = data.imageUrl ?? data.image
  const pricingRules = data.pricingRules as PricingRules | undefined
  const variants = parseVariants(data.variants)
  return {
    id: docSnap.id,
    brand: data.brand,
    category: data.category,
    modelName,
    basePrice,
    imageUrl,
    pricingRules,
    variants,
  } as Product
}

/**
 * Subscribe to products list in real-time (for admin dashboard live updates)
 */
export function subscribeToProducts(onUpdate: (products: Product[]) => void): Unsubscribe {
  const productsRef = collection(getDb(), 'products')
  const q = query(productsRef)
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(mapDocToProduct)
    onUpdate(products)
  }, (error) => {
    logger.error('subscribeToProducts error:', error)
  })
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  const productsRef = collection(getDb(), 'products')
  const docRef = await addDoc(productsRef, product)
  return docRef.id
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(getDb(), 'products', id)
  await updateDoc(docRef, updates)
}

// Pricing Configuration
export async function getPricingRules(): Promise<PricingRules> {
  try {
    const docRef = doc(getDb(), 'settings', 'pricing')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as PricingRules
    }
    // No rules in Firebase: return zeros so price = basePrice until admin sets rules
    return ZERO_PRICING_RULES
  } catch (error) {
    logger.error('Error fetching pricing rules:', error)
    return ZERO_PRICING_RULES
  }
}

export async function savePricingRules(rules: PricingRules): Promise<void> {
  try {
    const docRef = doc(getDb(), 'settings', 'pricing')
    await setDoc(docRef, rules)
  } catch (error) {
    logger.error('Error saving pricing rules:', error)
    throw error
  }
}

export async function saveProductPricingRules(productId: string, rules: PricingRules): Promise<void> {
  try {
    const docRef = doc(getDb(), 'products', productId)
    await updateDoc(docRef, {
      pricingRules: rules
    })
  } catch (error) {
    logger.error('Error saving product pricing rules:', error)
    throw error
  }
}

// Product Pricing Collection Functions (productPricing collection)
export interface ProductPricingData {
  productId: string
  productBrand: string
  productName: string
  basePrice: number // Single price
  pricingRules: PricingRules
  variantRules?: Record<string, PricingRules> // Variant-specific pricing rules: variantId -> PricingRules
  powerOnPercentage?: number // Percentage for powerOn deduction (60-95), if set, overrides fixed amount
  updatedAt: Timestamp | Date
  updatedBy?: string
}

export async function saveProductPricingToCollection(
  productId: string,
  product: Product,
  pricingRules: PricingRules,
  updatedBy?: string,
  variantRules?: Record<string, PricingRules>,
  powerOnPercentage?: number | null
): Promise<void> {
  try {
    const productPricingRef = collection(getDb(), 'productPricing')
    
    // Check if document exists
    const q = query(productPricingRef, where('productId', '==', productId))
    const querySnapshot = await getDocs(q)
    
    const pricingData: ProductPricingData = {
      productId,
      productBrand: product.brand,
      productName: product.modelName,
      basePrice: product.basePrice,
      pricingRules,
      updatedAt: Timestamp.now(),
      updatedBy: updatedBy || 'admin',
    }
    
    // Add variant rules if provided
    if (variantRules && Object.keys(variantRules).length > 0) {
      pricingData.variantRules = variantRules
    }
    
    // Add powerOn percentage if provided
    if (powerOnPercentage !== undefined && powerOnPercentage !== null) {
      pricingData.powerOnPercentage = powerOnPercentage
    }

    if (!querySnapshot.empty) {
      // Update existing document
      const existingDoc = querySnapshot.docs[0]
      const docRef = doc(getDb(), 'productPricing', existingDoc.id)
      await updateDoc(docRef, pricingData as any)
    } else {
      // Create new document
      await addDoc(productPricingRef, pricingData)
    }
  } catch (error) {
    logger.error('Error saving product pricing to collection:', error)
    throw error
  }
}

export async function getProductPricingFromCollection(productId: string): Promise<ProductPricingData | null> {
  try {
    const productPricingRef = collection(getDb(), 'productPricing')
    const q = query(productPricingRef, where('productId', '==', productId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data()
      return {
        ...docData,
        productId: docData.productId,
        productBrand: docData.productBrand,
        productName: docData.productName,
        basePrice: docData.basePrice ?? docData.displayPrice ?? 0,
        pricingRules: docData.pricingRules,
        updatedAt: docData.updatedAt,
        updatedBy: docData.updatedBy,
      } as ProductPricingData
    }
    return null
  } catch (error) {
    logger.error('Error getting product pricing from collection:', error)
    return null
  }
}

/**
 * Find a product by brand and model name
 * Used by legacy calculate API endpoints
 */
export async function getProductByBrandAndModel(brand: string, model: string): Promise<Product | null> {
  try {
    const productsRef = collection(getDb(), 'products')
    const normalizedBrand = brand.trim()
    const normalizedModel = model.trim()
    
    // Query by brand first (case-insensitive matching)
    const brandQuery = query(productsRef, where('brand', '==', normalizedBrand))
    const brandSnapshot = await getDocs(brandQuery)
    
    if (brandSnapshot.empty) {
      return null
    }
    
    // Find product with matching model name (case-insensitive)
    const product = brandSnapshot.docs
      .map(docSnap => {
        const data: any = docSnap.data()
        const modelName =
          data.modelName ??
          data['Model Name'] ??
          data.name ??
          ''
        
        const basePrice =
          data.basePrice ??
          data.price ??
          data['Price (₹)'] ??
          0
        
        const imageUrl = data.imageUrl ?? data.image
        const pricingRules = data.pricingRules as PricingRules | undefined
        const variants = parseVariants(data.variants)
        
        return {
          id: docSnap.id,
          brand: data.brand,
          category: data.category,
          modelName,
          basePrice,
          imageUrl,
          pricingRules,
          variants,
        } as Product
      })
      .find(p => p.modelName.toLowerCase().trim() === normalizedModel.toLowerCase().trim())
    
    return product || null
  } catch (error) {
    logger.error('Error finding product by brand and model:', error)
    return null
  }
}

/**
 * Load pricing rules for a product (same priority as AssessmentWizard)
 * Priority: productPricing collection > product.pricingRules > global settings > ZERO_PRICING_RULES
 */
export async function loadPricingRulesForProduct(productId: string, product?: Product): Promise<PricingRules> {
  try {
    // First: productPricing collection (per-product rules set in Admin Pricing Calculator)
    const productPricingData = await getProductPricingFromCollection(productId)
    if (productPricingData?.pricingRules) {
      return productPricingData.pricingRules
    }
    
    // Second: product document's pricingRules field
    if (product?.pricingRules) {
      return product.pricingRules
    }
    
    // Third: global rules from Firebase (settings/pricing)
    return await getPricingRules()
  } catch (error) {
    logger.error('Error loading pricing rules for product:', error)
    // Fallback to zeros so price = basePrice until rules are set
    return ZERO_PRICING_RULES
  }
}

/**
 * Load full product pricing data including variant rules and powerOn percentage
 */
export async function loadProductPricingData(productId: string, variantId?: string): Promise<{ rules: PricingRules, powerOnPercentage?: number | null }> {
  try {
    const productPricingData = await getProductPricingFromCollection(productId)
    
    if (productPricingData) {
      // If variantId is provided and variant-specific rules exist, use those
      if (variantId && productPricingData.variantRules && productPricingData.variantRules[variantId]) {
        return {
          rules: productPricingData.variantRules[variantId],
          powerOnPercentage: productPricingData.powerOnPercentage
        }
      }
      
      // Otherwise use product-level rules
      if (productPricingData.pricingRules) {
        return {
          rules: productPricingData.pricingRules,
          powerOnPercentage: productPricingData.powerOnPercentage
        }
      }
    }
    
    // Fallback to product document or global rules
    const product = await getProductById(productId)
    if (product?.pricingRules) {
      return {
        rules: product.pricingRules,
        powerOnPercentage: null
      }
    }
    
    return {
      rules: await getPricingRules(),
      powerOnPercentage: null
    }
  } catch (error) {
    logger.error('Error loading product pricing data:', error)
    return {
      rules: ZERO_PRICING_RULES,
      powerOnPercentage: null
    }
  }
}

// Pickup Request interface - flexible to handle different structures
export type PickupRequestStatus =
  | 'pending' | 'confirmed' | 'assigned' | 'picked_up'
  | 'qc_review' | 'service_station' | 'showroom' | 'warehouse'
  | 'completed' | 'cancelled' | 'hold' | 'verification' | 'reject' | 'suspect'

export interface PickupRequest {
  id: string
  orderId?: string
  productName?: string
  price?: number
  valuationId?: string | null
  userId?: string
  customer?: {
    name: string
    phone: string
    email: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  pickupDate?: string
  pickupTime?: string
  status?: PickupRequestStatus
  remarks?: string
  assessmentAnswers?: Record<string, unknown>
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  rescheduled?: boolean
  rescheduledAt?: Timestamp | Date
  previousPickupDate?: string
  previousPickupTime?: string
  // Agent assignment fields
  assignedTo?: string
  assignedAgentName?: string
  assignedAt?: Timestamp | Date
  assignedByRole?: 'admin' | 'qc_team'
  assignedByName?: string
  // Source tracking
  source?: 'online_pickup' | 'showroom_walkin'
  // Legacy/alternative fields
  device?: {
    accessories?: string[]
    adjustedPrice?: number
    assessmentAnswers?: Record<string, any>
    [key: string]: any
  }
  state?: string
  userName?: string
  userPhone?: string
  userEmail?: string
  pickupAddress?: string
  [key: string]: any
}

/**
 * Get pickup requests by userId or phone number
 */
export async function getUserPickupRequests(userId: string, userPhone?: string): Promise<PickupRequest[]> {
  try {
    const pickupRequestsRef = collection(getDb(), 'pickupRequests')
    let allRequests: PickupRequest[] = []
    
    // Query by userId only (no ordering - to avoid index requirement)
    // We'll sort client-side instead
    try {
      const q = query(
        pickupRequestsRef,
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      
      logger.debug('Pickup requests query returned', { count: querySnapshot.docs.length })
      
      const userIdRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PickupRequest[]
      
      allRequests = [...userIdRequests]
    } catch (error: any) {
      logger.error('Error fetching pickup requests by userId:', error?.message || error)
    }
    
    // Sort client-side by date (descending - newest first)
    if (allRequests.length > 0) {
      allRequests.sort((a, b) => {
        const aDate = a.createdAt instanceof Date 
          ? a.createdAt.getTime() 
          : (a.createdAt as any)?.toDate?.()?.getTime() || 0
        const bDate = b.createdAt instanceof Date 
          ? b.createdAt.getTime() 
          : (b.createdAt as any)?.toDate?.()?.getTime() || 0
        return bDate - aDate
      })
    }
    
    return allRequests
  } catch (error) {
    logger.error('Error fetching user pickup requests:', error)
    return [] // Return empty array instead of throwing
  }
}

/**
 * Get a pickup request by ID (document ID or custom orderId)
 */
export async function getPickupRequest(id: string): Promise<PickupRequest | null> {
  try {
    // First try to fetch by document ID
    const docRef = doc(getDb(), 'pickupRequests', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PickupRequest
    }
    
    // If not found by document ID, try to find by orderId field
    const pickupRequestsRef = collection(getDb(), 'pickupRequests')
    const q = query(pickupRequestsRef, where('orderId', '==', id))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const pickupDoc = querySnapshot.docs[0]
      return { id: pickupDoc.id, ...pickupDoc.data() } as PickupRequest
    }
    
    return null
  } catch (error) {
    logger.error('Error fetching pickup request:', error)
    return null
  }
}

/**
 * Get all pickup requests from Firestore
 */
export async function getAllPickupRequests(): Promise<PickupRequest[]> {
  try {
    const pickupRequestsRef = collection(getDb(), 'pickupRequests')
    // Try to order by createdAt, but fallback if it fails (e.g., missing index)
    let querySnapshot
    try {
      const q = query(pickupRequestsRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // If ordering fails (e.g., missing index), get all documents without ordering
      console.warn('Could not order by createdAt, fetching all documents:', orderError)
      querySnapshot = await getDocs(query(pickupRequestsRef))
    }
    
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PickupRequest[]
    
    // Sort client-side if we couldn't order in Firestore
    if (requests.length > 0 && requests[0].createdAt) {
      requests.sort((a, b) => {
        const aDate = a.createdAt instanceof Date 
          ? a.createdAt.getTime() 
          : (a.createdAt as any)?.toDate?.()?.getTime() || 0
        const bDate = b.createdAt instanceof Date 
          ? b.createdAt.getTime() 
          : (b.createdAt as any)?.toDate?.()?.getTime() || 0
        return bDate - aDate // Descending order
      })
    }
    
    return requests
  } catch (error) {
    logger.error('Error fetching pickup requests:', error)
    throw error
  }
}

/**
 * Subscribe to pickup requests in real-time (for admin dashboard live updates)
 * Returns an unsubscribe function. Call it when the component unmounts.
 */
export function subscribeToPickupRequests(
  onUpdate: (requests: PickupRequest[]) => void
): Unsubscribe {
  const pickupRequestsRef = collection(getDb(), 'pickupRequests')
  let q
  try {
    q = query(pickupRequestsRef, orderBy('createdAt', 'desc'))
  } catch {
    q = query(pickupRequestsRef)
  }
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as PickupRequest[]
    if (requests.length > 0 && requests[0].createdAt) {
      requests.sort((a, b) => {
        const aDate = a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : (a.createdAt as any)?.toDate?.()?.getTime() || 0
        const bDate = b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : (b.createdAt as any)?.toDate?.()?.getTime() || 0
        return bDate - aDate
      })
    }
    onUpdate(requests)
  }, (error) => {
    logger.error('subscribeToPickupRequests error:', error)
  })
}

/**
 * Update a pickup request in Firestore
 */
export async function updatePickupRequest(id: string, updates: Partial<PickupRequest>): Promise<void> {
  try {
    const dbInstance = getDb()
    const docRef = doc(dbInstance, 'pickupRequests', id)
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    }
    
    await updateDoc(docRef, updateData)
  } catch (error) {
    logger.error('Error updating pickup request in Firestore:', error)
    throw error
  }
}

export async function checkIsSuperAdmin(user: { email?: string | null, phoneNumber?: string | null }): Promise<boolean> {
  try {
    // Validate inputs to prevent unexpected queries
    if (!user.email && !user.phoneNumber) {
      return false
    }

    const staffRef = collection(getDb(), 'staffUsers')

    // Check by email if available (normalize to lowercase for consistency)
    if (user.email && typeof user.email === 'string' && user.email.length <= 254) {
      const normalizedEmail = user.email.trim().toLowerCase()
      const qEmail = query(staffRef, where('email', '==', normalizedEmail))
      const snapshotEmail = await getDocs(qEmail)
      if (!snapshotEmail.empty) {
        const staffDoc = snapshotEmail.docs[0].data()
        if (staffDoc.role === 'superadmin' && staffDoc.isActive === true) return true
      }
    }

    // Check by phone number if available (validate format)
    if (user.phoneNumber && typeof user.phoneNumber === 'string' && user.phoneNumber.length <= 20) {
      const normalizedPhone = user.phoneNumber.trim()
      const qPhone = query(staffRef, where('phoneNumber', '==', normalizedPhone))
      const snapshotPhone = await getDocs(qPhone)
      if (!snapshotPhone.empty) {
        const staffDoc = snapshotPhone.docs[0].data()
        if (staffDoc.role === 'superadmin' && staffDoc.isActive === true) return true
      }
    }

    return false
  } catch (error: any) {
    logger.error('Error checking super admin status')
    return false
  }
}

// Saved Addresses Operations
export interface SavedAddress {
  id?: string
  userId: string
  name: string
  phone: string
  email?: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

/**
 * Get all saved addresses for a user
 */
export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    const addressesRef = collection(getDb(), 'savedAddresses')
    const q = query(addressesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedAddress[]
  } catch (error) {
    logger.error('Error fetching user addresses:', error)
    return []
  }
}

/**
 * Check if an address already exists for a user (to avoid duplicates)
 */
export async function addressExists(userId: string, addressData: {
  address: string
  pincode: string
  phone: string
}): Promise<boolean> {
  try {
    const addressesRef = collection(getDb(), 'savedAddresses')
    const q = query(
      addressesRef,
      where('userId', '==', userId),
      where('address', '==', addressData.address),
      where('pincode', '==', addressData.pincode),
      where('phone', '==', addressData.phone)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    logger.error('Error checking if address exists:', error)
    return false
  }
}

/**
 * Save an address for a user (auto-save from pickup request)
 */
export async function saveAddress(addressData: SavedAddress): Promise<string> {
  try {
    const addressesRef = collection(getDb(), 'savedAddresses')
    
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      const existingAddresses = await getUserAddresses(addressData.userId)
      const updatePromises = existingAddresses
        .filter(addr => addr.isDefault && addr.id)
        .map(addr => updateDoc(doc(getDb(), 'savedAddresses', addr.id!), { isDefault: false }))
      
      await Promise.all(updatePromises)
    }
    
    const newAddress = {
      ...addressData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    
    const docRef = await addDoc(addressesRef, newAddress)
    return docRef.id
  } catch (error) {
    logger.error('Error saving address:', error)
    throw error
  }
}

/**
 * Update an address
 */
export async function updateAddress(addressId: string, updates: Partial<SavedAddress>): Promise<void> {
  try {
    const addressRef = doc(getDb(), 'savedAddresses', addressId)
    
    // If setting as default, unset other default addresses
    if (updates.isDefault) {
      const addressDoc = await getDoc(addressRef)
      if (addressDoc.exists()) {
        const addressData = addressDoc.data() as SavedAddress
        const existingAddresses = await getUserAddresses(addressData.userId)
        const updatePromises = existingAddresses
          .filter(addr => addr.isDefault && addr.id && addr.id !== addressId)
          .map(addr => updateDoc(doc(getDb(), 'savedAddresses', addr.id!), { isDefault: false }))
        
        await Promise.all(updatePromises)
      }
    }
    
    await updateDoc(addressRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    logger.error('Error updating address:', error)
    throw error
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<void> {
  try {
    const addressRef = doc(getDb(), 'savedAddresses', addressId)
    await deleteDoc(addressRef)
  } catch (error) {
    logger.error('Error deleting address:', error)
    throw error
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const userRef = doc(getDb(), 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        email: data.email,
        emailNotifications: data.emailNotifications ?? true,
        smsNotifications: data.smsNotifications ?? true,
        marketingEmails: data.marketingEmails ?? false,
        updatedAt: data.updatedAt,
      }
    }
    return null
  } catch (error) {
    logger.error('Error fetching user preferences:', error)
    throw error
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const userRef = doc(getDb(), 'users', userId)
    await updateDoc(userRef, {
      ...preferences,
      updatedAt: Timestamp.now(),
    })
    logger.info('User preferences saved successfully', { userId })
  } catch (error) {
    logger.error('Error saving user preferences:', error)
    throw error
  }
}

// ============================================================
// Staff Role System
// ============================================================

export type StaffRole = 'superadmin' | 'manager' | 'pickup_agent' | 'showroom_staff' | 'qc_team'

export interface StaffUser {
  id?: string
  name: string
  email?: string
  phoneNumber: string
  role: StaffRole
  isActive: boolean
  showroomId?: string
  showroomName?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  createdBy?: string
}

export interface StaffRoleResult {
  role: StaffRole
  isActive: boolean
  showroomId?: string
  showroomName?: string
  staffDoc: StaffUser
}

export async function checkStaffRole(user: { email?: string | null, phoneNumber?: string | null }): Promise<StaffRoleResult | null> {
  try {
    if (!user.email && !user.phoneNumber) return null
    const staffRef = collection(getDb(), 'staffUsers')

    if (user.email && typeof user.email === 'string' && user.email.length <= 254) {
      const normalizedEmail = user.email.trim().toLowerCase()
      const qEmail = query(staffRef, where('email', '==', normalizedEmail))
      const snap = await getDocs(qEmail)
      if (!snap.empty) {
        const data = snap.docs[0].data() as StaffUser
        return {
          role: data.role,
          isActive: data.isActive,
          showroomId: data.showroomId,
          showroomName: data.showroomName,
          staffDoc: { id: snap.docs[0].id, ...data },
        }
      }
    }

    if (user.phoneNumber && typeof user.phoneNumber === 'string' && user.phoneNumber.length <= 20) {
      const normalizedPhone = user.phoneNumber.trim()
      const qPhone = query(staffRef, where('phoneNumber', '==', normalizedPhone))
      const snap = await getDocs(qPhone)
      if (!snap.empty) {
        const data = snap.docs[0].data() as StaffUser
        return {
          role: data.role,
          isActive: data.isActive,
          showroomId: data.showroomId,
          showroomName: data.showroomName,
          staffDoc: { id: snap.docs[0].id, ...data },
        }
      }
    }

    return null
  } catch (error) {
    logger.error('Error checking staff role:', error)
    return null
  }
}

export async function getStaffByRole(role: StaffRole): Promise<StaffUser[]> {
  try {
    const staffRef = collection(getDb(), 'staffUsers')
    const q = query(staffRef, where('role', '==', role), where('isActive', '==', true))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffUser))
  } catch (error) {
    logger.error('Error fetching staff by role:', error)
    return []
  }
}

export async function getAllStaff(): Promise<StaffUser[]> {
  try {
    const staffRef = collection(getDb(), 'staffUsers')
    const snap = await getDocs(staffRef)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffUser))
  } catch (error) {
    logger.error('Error fetching all staff:', error)
    return []
  }
}

export async function createStaffMember(data: Omit<StaffUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const staffRef = collection(getDb(), 'staffUsers')
  const newStaff = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  const docRef = await addDoc(staffRef, newStaff)
  return docRef.id
}

export async function updateStaffMember(id: string, updates: Partial<StaffUser>): Promise<void> {
  const docRef = doc(getDb(), 'staffUsers', id)
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })
}

export async function deactivateStaffMember(id: string): Promise<void> {
  const docRef = doc(getDb(), 'staffUsers', id)
  await updateDoc(docRef, { isActive: false, updatedAt: Timestamp.now() })
}

// ============================================================
// Showrooms
// ============================================================

export interface Showroom {
  id?: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  isActive: boolean
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export async function getShowrooms(): Promise<Showroom[]> {
  try {
    const ref = collection(getDb(), 'showrooms')
    const snap = await getDocs(ref)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Showroom))
  } catch (error) {
    logger.error('Error fetching showrooms:', error)
    return []
  }
}

export async function getShowroom(id: string): Promise<Showroom | null> {
  try {
    const docRef = doc(getDb(), 'showrooms', id)
    const snap = await getDoc(docRef)
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Showroom
    return null
  } catch (error) {
    logger.error('Error fetching showroom:', error)
    return null
  }
}

export async function createShowroom(data: Omit<Showroom, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = collection(getDb(), 'showrooms')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  return docRef.id
}

export async function updateShowroom(id: string, updates: Partial<Showroom>): Promise<void> {
  const docRef = doc(getDb(), 'showrooms', id)
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })
}

// ============================================================
// Showroom Walk-Ins
// ============================================================

export interface ShowroomWalkIn {
  id?: string
  orderId?: string
  showroomId: string
  showroomName: string
  staffId: string
  staffName: string
  customer: {
    name: string
    phone: string
    email: string
    idProofType?: string
    idProofPhoto?: string
  }
  product: {
    name: string
    brand: string
    category: string
    serialNumber: string
  }
  manualPrice: number
  staffNotes: string
  devicePhotos: string[]
  status: 'pending_qc' | 'qc_review' | 'service_station' | 'showroom' | 'warehouse' | 'completed'
  source: 'showroom_walkin'
  provisionalReceiptId?: string
  finalReceiptId?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export async function createShowroomWalkIn(data: Omit<ShowroomWalkIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = collection(getDb(), 'showroomWalkIns')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  return docRef.id
}

export async function getShowroomWalkIns(showroomId?: string): Promise<ShowroomWalkIn[]> {
  try {
    const ref = collection(getDb(), 'showroomWalkIns')
    let q
    if (showroomId) {
      q = query(ref, where('showroomId', '==', showroomId))
    } else {
      q = query(ref)
    }
    const snap = await getDocs(q)
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShowroomWalkIn))
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return results
  } catch (error) {
    logger.error('Error fetching showroom walk-ins:', error)
    return []
  }
}

export async function getShowroomWalkIn(id: string): Promise<ShowroomWalkIn | null> {
  try {
    const docRef = doc(getDb(), 'showroomWalkIns', id)
    const snap = await getDoc(docRef)
    if (snap.exists()) return { id: snap.id, ...snap.data() } as ShowroomWalkIn

    const ref = collection(getDb(), 'showroomWalkIns')
    const q = query(ref, where('orderId', '==', id))
    const querySnap = await getDocs(q)
    if (!querySnap.empty) {
      const d = querySnap.docs[0]
      return { id: d.id, ...d.data() } as ShowroomWalkIn
    }
    return null
  } catch (error) {
    logger.error('Error fetching showroom walk-in:', error)
    return null
  }
}

export async function updateShowroomWalkIn(id: string, updates: Partial<ShowroomWalkIn>): Promise<void> {
  const docRef = doc(getDb(), 'showroomWalkIns', id)
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })
}

export function subscribeToShowroomWalkIns(
  onUpdate: (walkIns: ShowroomWalkIn[]) => void,
  showroomId?: string
): Unsubscribe {
  const ref = collection(getDb(), 'showroomWalkIns')
  const q = showroomId ? query(ref, where('showroomId', '==', showroomId)) : query(ref)
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShowroomWalkIn))
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    onUpdate(results)
  }, (error) => {
    logger.error('subscribeToShowroomWalkIns error:', error)
  })
}

// ============================================================
// Pickup Verifications
// ============================================================

export interface PickupVerification {
  id?: string
  orderId: string
  pickupRequestId: string
  agentId: string
  agentName: string
  devicePhotos: string[]
  customerIdProof: string
  serialNumber: string
  customerSignature?: string
  notes?: string
  status: 'submitted' | 'reviewed'
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export async function createPickupVerification(data: Omit<PickupVerification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = collection(getDb(), 'pickupVerifications')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  return docRef.id
}

export async function getPickupVerification(orderId: string): Promise<PickupVerification | null> {
  try {
    const ref = collection(getDb(), 'pickupVerifications')
    const q = query(ref, where('orderId', '==', orderId))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const d = snap.docs[0]
      return { id: d.id, ...d.data() } as PickupVerification
    }
    return null
  } catch (error) {
    logger.error('Error fetching pickup verification:', error)
    return null
  }
}

export async function updatePickupVerification(id: string, updates: Partial<PickupVerification>): Promise<void> {
  const docRef = doc(getDb(), 'pickupVerifications', id)
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })
}

// ============================================================
// QC Reviews
// ============================================================

export type QCDecision = 'service_station' | 'showroom' | 'warehouse'

export interface QCReview {
  id?: string
  orderId: string
  sourceType: 'pickup' | 'showroom_walkin'
  sourceId: string
  verificationId?: string
  reviewerId: string
  reviewerName: string
  decision: QCDecision
  targetShowroomId?: string
  notes?: string
  createdAt?: Timestamp | Date
}

export async function createQCReview(data: Omit<QCReview, 'id' | 'createdAt'>): Promise<string> {
  const ref = collection(getDb(), 'qcReviews')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now() })
  return docRef.id
}

export async function getQCReview(orderId: string): Promise<QCReview | null> {
  try {
    const ref = collection(getDb(), 'qcReviews')
    const q = query(ref, where('orderId', '==', orderId))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const d = snap.docs[0]
      return { id: d.id, ...d.data() } as QCReview
    }
    return null
  } catch (error) {
    logger.error('Error fetching QC review:', error)
    return null
  }
}

export async function getPendingPickupRequests(): Promise<PickupRequest[]> {
  try {
    const ref = collection(getDb(), 'pickupRequests')
    const q1 = query(ref, where('status', 'in', ['pending', 'confirmed']))
    const snap = await getDocs(q1)
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as PickupRequest))
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return results
  } catch (error) {
    logger.error('Error fetching pending pickup requests:', error)
    return []
  }
}

export async function getOrdersForQC(): Promise<Array<{ type: 'pickup' | 'showroom_walkin', data: PickupRequest | ShowroomWalkIn }>> {
  try {
    const results: Array<{ type: 'pickup' | 'showroom_walkin', data: PickupRequest | ShowroomWalkIn }> = []

    const pickupRef = collection(getDb(), 'pickupRequests')
    const pq = query(pickupRef, where('status', '==', 'picked_up'))
    const pickupSnap = await getDocs(pq)
    pickupSnap.docs.forEach(d => {
      results.push({ type: 'pickup', data: { id: d.id, ...d.data() } as PickupRequest })
    })

    const walkInRef = collection(getDb(), 'showroomWalkIns')
    const wq = query(walkInRef, where('status', '==', 'pending_qc'))
    const walkInSnap = await getDocs(wq)
    walkInSnap.docs.forEach(d => {
      results.push({ type: 'showroom_walkin', data: { id: d.id, ...d.data() } as ShowroomWalkIn })
    })

    results.sort((a, b) => {
      const aDate = a.data.createdAt instanceof Date ? a.data.createdAt.getTime() : (a.data.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.data.createdAt instanceof Date ? b.data.createdAt.getTime() : (b.data.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return results
  } catch (error) {
    logger.error('Error fetching orders for QC:', error)
    return []
  }
}

// ============================================================
// Receipts
// ============================================================

export type ReceiptType = 'provisional' | 'final'

export interface Receipt {
  id?: string
  orderId: string
  sourceType: 'pickup' | 'showroom_walkin'
  sourceId: string
  receiptType: ReceiptType
  receiptNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  productName: string
  brand: string
  category: string
  serialNumber: string
  agreedPrice: number
  showroomName?: string
  staffName: string
  qcDecision?: string
  qcNotes?: string
  date: string
  createdAt?: Timestamp | Date
  sentToCustomer: boolean
  sentToAdmin: boolean
}

export async function createReceipt(data: Omit<Receipt, 'id' | 'createdAt'>): Promise<string> {
  const ref = collection(getDb(), 'receipts')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now() })
  return docRef.id
}

export async function getReceiptsByOrder(orderId: string): Promise<Receipt[]> {
  try {
    const ref = collection(getDb(), 'receipts')
    const q = query(ref, where('orderId', '==', orderId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Receipt))
  } catch (error) {
    logger.error('Error fetching receipts:', error)
    return []
  }
}

export async function updateReceipt(id: string, updates: Partial<Receipt>): Promise<void> {
  const docRef = doc(getDb(), 'receipts', id)
  await updateDoc(docRef, updates)
}

// ============================================================
// Inventory
// ============================================================

export type InventoryLocation = 'service_station' | 'showroom' | 'warehouse'
export type InventoryStatus = 'in_stock' | 'in_repair' | 'sold' | 'transferred' | 'returned'

export interface InventoryItem {
  id?: string
  orderId: string
  sourceType: 'pickup' | 'showroom_walkin'
  sourceId: string
  sourceShowroomId?: string
  verificationId?: string
  qcReviewId: string
  serialNumber: string
  productName: string
  brand: string
  category: string
  condition: string
  currentLocation: InventoryLocation
  currentShowroomId?: string
  status: InventoryStatus
  agreedPrice: number
  devicePhotos: string[]
  qcDecision: string
  qcNotes: string
  stockInDate?: Timestamp | Date
  lastMovementDate?: Timestamp | Date
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export async function createInventoryItem(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = collection(getDb(), 'inventory')
  const now = Timestamp.now()
  const docRef = await addDoc(ref, {
    ...data,
    stockInDate: now,
    lastMovementDate: now,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function getInventoryItems(filters?: {
  location?: InventoryLocation
  status?: InventoryStatus
  category?: string
  brand?: string
}): Promise<InventoryItem[]> {
  try {
    const ref = collection(getDb(), 'inventory')
    let q = query(ref)

    if (filters?.location) {
      q = query(ref, where('currentLocation', '==', filters.location))
    }
    if (filters?.status) {
      q = query(ref, where('status', '==', filters.status))
    }

    const snap = await getDocs(q)
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))

    if (filters?.category) {
      items = items.filter(i => i.category === filters.category)
    }
    if (filters?.brand) {
      items = items.filter(i => i.brand === filters.brand)
    }

    items.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return items
  } catch (error) {
    logger.error('Error fetching inventory items:', error)
    return []
  }
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  try {
    const docRef = doc(getDb(), 'inventory', id)
    const snap = await getDoc(docRef)
    if (snap.exists()) return { id: snap.id, ...snap.data() } as InventoryItem
    return null
  } catch (error) {
    logger.error('Error fetching inventory item:', error)
    return null
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
  const docRef = doc(getDb(), 'inventory', id)
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })
}

export async function transferInventoryItem(
  id: string,
  toLocation: InventoryLocation,
  reason: string,
  performedBy: string,
  performedByName: string,
  notes?: string,
  targetShowroomId?: string
): Promise<void> {
  const item = await getInventoryItem(id)
  if (!item) throw new Error('Inventory item not found')

  const now = Timestamp.now()
  await updateDoc(doc(getDb(), 'inventory', id), {
    currentLocation: toLocation,
    currentShowroomId: targetShowroomId || null,
    lastMovementDate: now,
    updatedAt: now,
  })

  await createStockMovement({
    inventoryId: id,
    orderId: item.orderId,
    serialNumber: item.serialNumber,
    productName: item.productName,
    type: 'transfer',
    fromLocation: item.currentLocation,
    toLocation,
    reason,
    performedBy,
    performedByName,
    notes: notes || '',
  })
}

export async function stockOutItem(
  id: string,
  reason: string,
  performedBy: string,
  performedByName: string,
  notes?: string
): Promise<void> {
  const item = await getInventoryItem(id)
  if (!item) throw new Error('Inventory item not found')

  const status: InventoryStatus = reason === 'returned' ? 'returned' : 'sold'
  const now = Timestamp.now()
  await updateDoc(doc(getDb(), 'inventory', id), {
    status,
    lastMovementDate: now,
    updatedAt: now,
  })

  await createStockMovement({
    inventoryId: id,
    orderId: item.orderId,
    serialNumber: item.serialNumber,
    productName: item.productName,
    type: 'stock_out',
    fromLocation: item.currentLocation,
    toLocation: null,
    reason,
    performedBy,
    performedByName,
    notes: notes || '',
  })
}

export function subscribeToInventory(
  onUpdate: (items: InventoryItem[]) => void
): Unsubscribe {
  const ref = collection(getDb(), 'inventory')
  return onSnapshot(query(ref), (snapshot) => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
    items.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    onUpdate(items)
  }, (error) => {
    logger.error('subscribeToInventory error:', error)
  })
}

export async function getInventoryStats(): Promise<{
  total: number
  byLocation: Record<string, number>
  byStatus: Record<string, number>
}> {
  try {
    const items = await getInventoryItems()
    const byLocation: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    for (const item of items) {
      byLocation[item.currentLocation] = (byLocation[item.currentLocation] || 0) + 1
      byStatus[item.status] = (byStatus[item.status] || 0) + 1
    }
    return { total: items.length, byLocation, byStatus }
  } catch (error) {
    logger.error('Error fetching inventory stats:', error)
    return { total: 0, byLocation: {}, byStatus: {} }
  }
}

// ============================================================
// Stock Movements
// ============================================================

export type StockMovementType = 'stock_in' | 'stock_out' | 'transfer'

export interface StockMovement {
  id?: string
  inventoryId: string
  orderId: string
  serialNumber: string
  productName: string
  type: StockMovementType
  fromLocation: string | null
  toLocation: string | null
  reason: string
  performedBy: string
  performedByName: string
  notes?: string
  createdAt?: Timestamp | Date
}

export async function createStockMovement(data: Omit<StockMovement, 'id' | 'createdAt'>): Promise<string> {
  const ref = collection(getDb(), 'stockMovements')
  const docRef = await addDoc(ref, { ...data, createdAt: Timestamp.now() })
  return docRef.id
}

export async function getStockMovements(filters?: {
  inventoryId?: string
  type?: StockMovementType
}): Promise<StockMovement[]> {
  try {
    const ref = collection(getDb(), 'stockMovements')
    let q = query(ref)

    if (filters?.inventoryId) {
      q = query(ref, where('inventoryId', '==', filters.inventoryId))
    } else if (filters?.type) {
      q = query(ref, where('type', '==', filters.type))
    }

    const snap = await getDocs(q)
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as StockMovement))
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return results
  } catch (error) {
    logger.error('Error fetching stock movements:', error)
    return []
  }
}

export async function getItemMovementHistory(inventoryId: string): Promise<StockMovement[]> {
  return getStockMovements({ inventoryId })
}

// ============================================================
// Agent Assigned Orders
// ============================================================

export async function getAgentAssignedOrders(agentId: string): Promise<PickupRequest[]> {
  try {
    const ref = collection(getDb(), 'pickupRequests')
    const q = query(ref, where('assignedTo', '==', agentId))
    const snap = await getDocs(q)
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as PickupRequest))
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0
      return bDate - aDate
    })
    return results
  } catch (error) {
    logger.error('Error fetching agent assigned orders:', error)
    return []
  }
}
