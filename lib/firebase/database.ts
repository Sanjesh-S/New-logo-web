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
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore'
import { db } from './config'
import { PricingRules, DEFAULT_PRICING_RULES } from '@/lib/types/pricing'

// Database Schema Types
export interface Valuation {
  id?: string
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
  pickupDate?: Date
  paymentMethod?: string
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

// Products used for listing (backed by `products` collection in Firestore)
export interface Product {
  id: string
  brand: string
  category: string
  modelName: string
  basePrice: number // Display price (boom price)
  internalBasePrice?: number // Internal base price for calculations
  imageUrl?: string
  pricingRules?: PricingRules // Product-specific override rules
}

export interface User {
  id: string
  email?: string
  name?: string
  phone?: string
  address?: string
  createdAt: Timestamp | Date
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
  const docRef = doc(getDb(), 'valuations', id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Valuation
  }
  return null
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
  const { limit: limitCount = 20, startAfter: startAfterDoc } = options
  const valuationsRef = collection(getDb(), 'valuations')
  
  let q = query(
    valuationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount + 1) // Fetch one extra to check if there's more
  )
  
  if (startAfterDoc) {
    q = query(
      valuationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(startAfterDoc),
      limit(limitCount + 1)
    )
  }
  
  const querySnapshot = await getDocs(q)
  const docs = querySnapshot.docs
  const hasMore = docs.length > limitCount
  const data = (hasMore ? docs.slice(0, limitCount) : docs).map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Valuation[]
  
  const lastDoc = hasMore ? docs[limitCount - 1] : docs[docs.length - 1]

  return {
    data,
    lastDoc,
    hasMore,
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
      const baseQuery = [
        where('category', '==', dbCategory),
        where('brand', '==', brand.trim()),
        orderBy('brand'),
        orderBy('model'),
        limit(limitCount + 1),
      ]
      
      if (startAfterDoc) {
        baseQuery.push(startAfter(startAfterDoc))
      }
      
      q = query(devicesRef, ...baseQuery)
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
    console.error('Error querying devices:', error)
    return []
  }

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Device[]
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

  // Try querying with the first category variation
  // If no results, we'll fall back to client-side filtering
  const q = query(
    productsRef,
    where('brand', '==', normalizedBrand),
    where('category', '==', dbCategoryVariations[0])
  )

  let snapshot
  try {
    snapshot = await getDocs(q)

    // If no results with first variation, try other category variations
    if (snapshot.empty && dbCategoryVariations.length > 1) {
      for (let i = 1; i < dbCategoryVariations.length; i++) {
        const altQ = query(
          productsRef,
          where('brand', '==', normalizedBrand),
          where('category', '==', dbCategoryVariations[i])
        )
        const altSnapshot = await getDocs(altQ)
        if (!altSnapshot.empty) {
          snapshot = altSnapshot
          break
        }
      }
    }

    // If still no results, try querying just by brand to see if products exist
    if (snapshot.empty) {
      console.log(`No products found for category variations ${dbCategoryVariations.join(', ')} and brand "${normalizedBrand}". Trying brand-only query...`)
      const brandOnlyQ = query(productsRef, where('brand', '==', normalizedBrand))
      const brandOnlySnapshot = await getDocs(brandOnlyQ)

      if (!brandOnlySnapshot.empty) {
        console.log(`Found ${brandOnlySnapshot.docs.length} products for brand "${normalizedBrand}" with categories:`,
          [...new Set(brandOnlySnapshot.docs.map(doc => doc.data().category))])
        // Use brand-only results and filter client-side
        snapshot = brandOnlySnapshot
      }
    }
  } catch (queryError) {
    console.error('Firestore query error:', queryError)
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

    return {
      id: docSnap.id,
      brand: data.brand,
      category: data.category,
      modelName,
      basePrice,
      imageUrl,
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

  const internalBasePrice =
    data.internalBasePrice ??
    (basePrice * 0.5) // Fallback to 50% of display price if not set

  const imageUrl = data.imageUrl ?? data.image

  const pricingRules = data.pricingRules as PricingRules | undefined

  return {
    id: productSnap.id,
    brand: data.brand,
    category: data.category,
    modelName,
    basePrice,
    internalBasePrice,
    imageUrl,
    pricingRules,
  } as Product
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

    const internalBasePrice =
      data.internalBasePrice ??
      (basePrice * 0.5)

    const imageUrl = data.imageUrl ?? data.image

    const pricingRules = data.pricingRules as PricingRules | undefined

    return {
      id: docSnap.id,
      brand: data.brand,
      category: data.category,
      modelName,
      basePrice,
      internalBasePrice,
      imageUrl,
      pricingRules,
    } as Product
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
    } else {
      // Seed default rules if not exists
      await setDoc(docRef, DEFAULT_PRICING_RULES)
      return DEFAULT_PRICING_RULES
    }
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return DEFAULT_PRICING_RULES
  }
}

export async function savePricingRules(rules: PricingRules): Promise<void> {
  try {
    const docRef = doc(getDb(), 'settings', 'pricing')
    await setDoc(docRef, rules)
  } catch (error) {
    console.error('Error saving pricing rules:', error)
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
    console.error('Error saving product pricing rules:', error)
    throw error
  }
}

// Product Pricing Collection Functions (productPricing collection)
export interface ProductPricingData {
  productId: string
  productBrand: string
  productName: string
  displayPrice: number
  internalBasePrice: number
  pricingRules: PricingRules
  updatedAt: Timestamp | Date
  updatedBy?: string
}

export async function saveProductPricingToCollection(
  productId: string,
  product: Product,
  pricingRules: PricingRules,
  updatedBy?: string
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
      displayPrice: product.basePrice,
      internalBasePrice: product.internalBasePrice || product.basePrice * 0.5,
      pricingRules,
      updatedAt: Timestamp.now(),
      updatedBy: updatedBy || 'admin',
    }

    if (!querySnapshot.empty) {
      // Update existing document
      const existingDoc = querySnapshot.docs[0]
      const docRef = doc(getDb(), 'productPricing', existingDoc.id)
      await updateDoc(docRef, pricingData)
    } else {
      // Create new document
      await addDoc(productPricingRef, pricingData)
    }
  } catch (error) {
    console.error('Error saving product pricing to collection:', error)
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
        displayPrice: docData.displayPrice,
        internalBasePrice: docData.internalBasePrice,
        pricingRules: docData.pricingRules,
        updatedAt: docData.updatedAt,
        updatedBy: docData.updatedBy,
      } as ProductPricingData
    }
    return null
  } catch (error) {
    console.error('Error getting product pricing from collection:', error)
    return null
  }
}

// Pickup Request interface - flexible to handle different structures
export interface PickupRequest {
  id: string
  productName?: string
  price?: number
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
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'hold' | 'verification' | 'reject' | 'suspect'
  remarks?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
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
  [key: string]: any // Allow any other fields
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
    console.error('Error fetching pickup requests:', error)
    throw error
  }
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
    
    console.log('Updating pickup request in Firestore:', id, updateData)
    await updateDoc(docRef, updateData)
    console.log('Pickup request updated successfully in Firestore')
  } catch (error) {
    console.error('Error updating pickup request in Firestore:', error)
    throw error
  }
}

export async function checkIsSuperAdmin(user: { email?: string | null, phoneNumber?: string | null }): Promise<boolean> {
  try {
    const staffRef = collection(getDb(), 'staffUsers')

    // Check by email if available
    if (user.email) {
      const qEmail = query(staffRef, where('email', '==', user.email))
      const snapshotEmail = await getDocs(qEmail)
      if (!snapshotEmail.empty) {
        const staffDoc = snapshotEmail.docs[0].data()
        if (staffDoc.role === 'superadmin' && staffDoc.isActive === true) return true
      }
    }

    // Check by phone number if available
    if (user.phoneNumber) {
      const qPhone = query(staffRef, where('phoneNumber', '==', user.phoneNumber))
      const snapshotPhone = await getDocs(qPhone)
      if (!snapshotPhone.empty) {
        const staffDoc = snapshotPhone.docs[0].data()
        if (staffDoc.role === 'superadmin' && staffDoc.isActive === true) return true
      }
    }

    return false
  } catch (error: any) {
    console.error('Error checking super admin status:', error)
    throw error
  }
}
