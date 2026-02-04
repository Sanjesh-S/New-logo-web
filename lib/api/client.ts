/**
 * API Client for Firebase Cloud Functions
 * 
 * This client replaces direct calls to Next.js API routes with Firebase Functions calls.
 */

const getFunctionsUrl = (): string => {
  // Use environment variable if set, otherwise construct from project
  if (process.env.NEXT_PUBLIC_FUNCTIONS_URL) {
    return process.env.NEXT_PUBLIC_FUNCTIONS_URL
  }
  
  // Construct URL from Firebase project ID
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const region = process.env.NEXT_PUBLIC_FUNCTION_REGION || 'us-central1'
  
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required. Set NEXT_PUBLIC_FUNCTIONS_URL or NEXT_PUBLIC_FIREBASE_PROJECT_ID in your environment variables.')
  }
  
  return `https://${region}-${projectId}.cloudfunctions.net`
}

interface ApiError {
  error: string
  message?: string
  details?: unknown
}

/**
 * Make a request to a Firebase Cloud Function
 */
async function callFunction<T>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH'
    body?: unknown
    query?: Record<string, string>
  } = {}
): Promise<T> {
  const { method = 'GET', body, query } = options

  const functionsUrl = getFunctionsUrl()
  let url = `${functionsUrl}/${functionName}`
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query)
    url += `?${params.toString()}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  
  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Unknown error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.message || error.error || 'API request failed')
  }

  return response.json()
}

/**
 * Calculate device value
 */
export async function calculatePrice(params: {
  brand: string
  model: string
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  usage?: 'light' | 'moderate' | 'heavy'
  accessories?: string[]
}) {
  return callFunction<{
    success: boolean
    basePrice: number
    estimatedValue: number
    breakdown: {
      basePrice: number
      conditionMultiplier: number
      usageMultiplier: number
      accessoriesTotal: number
    }
  }>('calculate', {
    method: 'POST',
    body: params,
  })
}

/**
 * Create a valuation
 * Tries Next.js API first (custom Order ID); falls back to Firebase when static export (e.g. GitHub Pages).
 */
export async function createValuation(data: {
  category: 'cameras' | 'phones' | 'laptops'
  brand: string
  model: string
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  usage?: 'light' | 'moderate' | 'heavy'
  accessories?: string[]
  basePrice?: number
  estimatedValue?: number
  userId?: string
  productId?: string
  variantId?: string
  variantLabel?: string
  answers?: Record<string, unknown>
  pickupAddress?: string
  userName?: string
  userPhone?: string
  state?: string
  pincode?: string
}) {
  // Try Next.js API first (supports custom Order ID when deployed with server)
  try {
    const response = await fetch('/api/valuations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    // 404 = API route not available (static export); fallback to Firebase without parsing body
    if (response.status === 404) {
      return callFunction<{ success: boolean; id: string; message: string }>('valuations', {
        method: 'POST',
        body: data,
      })
    }

    const responseData = await response.json().catch(() => ({}))
    if (response.ok) {
      return responseData
    }

    const errorMsg = responseData.error || responseData.details || `API route failed: ${response.statusText}`
    const error = new Error(errorMsg)
    ;(error as any).response = responseData
    throw error
  } catch (err: any) {
    // Network error or fetch failed (e.g. static export, no server) → use Firebase
    if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
      return callFunction<{ success: boolean; id: string; message: string }>('valuations', {
        method: 'POST',
        body: data,
      })
    }
    throw err
  }
}

/**
 * Get a valuation by ID
 */
export async function getValuation(id: string) {
  return callFunction<{
    valuation: {
      id: string
      [key: string]: unknown
    }
  }>('valuations', {
    method: 'GET',
    query: { id },
  })
}

/**
 * Get valuations for a user
 */
export async function getUserValuations(userId: string) {
  return callFunction<{
    valuations: Array<{
      id: string
      [key: string]: unknown
    }>
  }>('valuations', {
    method: 'GET',
    query: { userId },
  })
}

/**
 * Update a valuation
 */
export async function updateValuation(id: string, updates: {
  status?: 'pending' | 'approved' | 'rejected' | 'completed'
  finalValue?: number
  [key: string]: unknown
}) {
  return callFunction<{
    success: boolean
    message: string
  }>('valuations', {
    method: 'PATCH',
    body: { id, ...updates },
  })
}

/**
 * Create a pickup request
 * Uses Firebase Cloud Function - all notifications are handled server-side
 */
export async function createPickupRequest(data: {
  productName: string
  price: number
  customer: {
    name: string
    phone: string
    email: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  pickupDate: string
  pickupTime: string
  userId?: string | null
  valuationId?: string | null
  category?: string
  brand?: string
  assessmentAnswers?: Record<string, unknown>
}) {
  // Use Firebase Function - notifications are handled server-side in Firebase Functions
  return callFunction<{
    success: boolean
    id: string
  }>('pickupRequests', {
    method: 'POST',
    body: data,
  })
}

/**
 * Schedule a pickup
 */
export async function schedulePickup(data: {
  valuationId: string
  pickupDate: string
  pickupTime: string
}) {
  return callFunction<{
    success: boolean
    message: string
    data: {
      valuationId: string
      pickupDate: string
      pickupTime: string
    }
  }>('schedulePickup', {
    method: 'POST',
    body: data,
  })
}

/**
 * Get devices
 * In development/localhost, uses Firestore directly to avoid CORS issues
 * In production, uses Firebase Cloud Functions
 */
export async function getDevices(params: {
  category?: string
  brand?: string
  model?: string
}) {
  // In development/localhost, use Firestore directly to avoid CORS issues
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     process.env.NODE_ENV === 'development')
  
  if (isDevelopment && params.category) {
    try {
      // Use Firestore directly in development
      const { getDevices: getDevicesFromDb } = await import('@/lib/firebase/database')
      const result = await getDevicesFromDb(
        params.category,
        params.brand,
        { limit: 1000 } // Get all devices in development
      )
      
      // Convert to expected format
      const devices = Array.isArray(result) ? result : (result.data || [])
      
      if (params.model) {
        // Filter by model if specified
        const device = devices.find((d: any) => 
          d.model?.toLowerCase() === params.model?.toLowerCase()
        )
        return { device, devices: device ? [device] : [] }
      }
      
      return { devices }
    } catch (error) {
      // If Firestore fails, fall back to Firebase Functions
      console.warn('Firestore direct access failed, falling back to Cloud Functions:', error)
    }
  }
  
  // Use Firebase Cloud Functions (production or fallback)
  return callFunction<{
    devices?: Array<{ id: string; [key: string]: unknown }>
    device?: { id: string; [key: string]: unknown }
  }>('devices', {
    method: 'GET',
    query: params as Record<string, string>,
  })
}

/**
 * Send Telegram notification (internal use)
 */
export async function sendTelegramNotification(data: {
  productName: string
  price: number
  customer: {
    name: string
    phone: string
    email: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  pickupDate: string
  pickupTime: string
  requestId: string
}) {
  return callFunction<{
    success: boolean
  }>('telegramNotify', {
    method: 'POST',
    body: data,
  })
}

/**
 * Send WhatsApp notification (internal use)
 */
export async function sendWhatsAppNotification(data: {
  productName: string
  price: number
  customer: {
    name: string
    phone: string
    email: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  pickupDate: string
  pickupTime: string
  requestId: string
}) {
  return callFunction<{
    success: boolean
    messageSid?: string
  }>('whatsappNotify', {
    method: 'POST',
    body: data,
  })
}

/**
 * Send email confirmation (internal use)
 */
export async function sendEmailConfirmation(data: {
  productName: string
  price: number
  customer: {
    name: string
    phone: string
    email: string
    address: string
    landmark?: string
    city: string
    state: string
    pincode: string
  }
  pickupDate: string
  pickupTime: string
  requestId: string
}) {
  return callFunction<{
    success: boolean
    emailId?: string
  }>('emailConfirm', {
    method: 'POST',
    body: data,
  })
}
