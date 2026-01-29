/**
 * Order ID Generator Utility
 * 
 * Format: {STATE}{RTO}{WT}{CATEGORY}{SEQUENCE}
 * Example: TN37WTDSLR1001
 * 
 * - First 2 letters: State code (e.g., TN)
 * - 3rd-4th letters: RTO number based on pincode (e.g., 37 for 641004)
 * - 5th-6th letters: "WT" (WorthyTen)
 * - 7th-10th letters: Category code
 * - 11th-14th letters: Sequential order number starting from 1001
 */

import { getFirestoreServer } from '@/lib/firebase/server'
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore'

/**
 * Map pincode to RTO number (Tamil Nadu)
 * RTO codes for Tamil Nadu districts
 */
const PINCODE_TO_RTO: Record<string, string> = {
  // Coimbatore - RTO 37
  '641001': '37', '641002': '37', '641003': '37', '641004': '37', '641005': '37',
  '641006': '37', '641007': '37', '641008': '37', '641009': '37', '641010': '37',
  '641011': '37', '641012': '37', '641013': '37', '641014': '37', '641015': '37',
  '641016': '37', '641017': '37', '641018': '37', '641019': '37', '641020': '37',
  '641021': '37', '641022': '37', '641023': '37', '641024': '37', '641025': '37',
  '641026': '37', '641027': '37', '641028': '37', '641029': '37', '641030': '37',
  '641031': '37', '641032': '37', '641033': '37', '641034': '37', '641035': '37',
  '641036': '37', '641037': '37', '641038': '37', '641039': '37', '641040': '37',
  '641041': '37', '641042': '37', '641043': '37', '641044': '37', '641045': '37',
  '641046': '37', '641047': '37', '641048': '37', '641049': '37', '641050': '37',
  // Chennai - RTO 01-10 (using 01 as default)
  '600001': '01', '600002': '01', '600003': '01', '600004': '01', '600005': '01',
  '600006': '01', '600007': '01', '600008': '01', '600009': '01', '600010': '01',
  '600011': '01', '600012': '01', '600013': '01', '600014': '01', '600015': '01',
  '600016': '01', '600017': '01', '600018': '01', '600019': '01', '600020': '01',
  '600021': '01', '600022': '01', '600023': '01', '600024': '01', '600025': '01',
  '600026': '01', '600027': '01', '600028': '01', '600029': '01', '600030': '01',
  '600031': '01', '600032': '01', '600033': '01', '600034': '01', '600035': '01',
  '600036': '01', '600037': '01', '600038': '01', '600039': '01', '600040': '01',
  '600041': '01', '600042': '01', '600043': '01', '600044': '01', '600045': '01',
  '600046': '01', '600047': '01', '600048': '01', '600049': '01', '600050': '01',
  '600051': '01', '600052': '01', '600053': '01', '600054': '01', '600055': '01',
  '600056': '01', '600057': '01', '600058': '01', '600059': '01', '600060': '01',
  '600061': '01', '600062': '01', '600063': '01', '600064': '01', '600065': '01',
  '600066': '01', '600067': '01', '600068': '01', '600069': '01', '600070': '01',
  '600071': '01', '600072': '01', '600073': '01', '600074': '01', '600075': '01',
  '600076': '01', '600077': '01', '600078': '01', '600079': '01', '600080': '01',
  '600081': '01', '600082': '01', '600083': '01', '600084': '01', '600085': '01',
  '600086': '01', '600087': '01', '600088': '01', '600089': '01', '600090': '01',
  '600091': '01', '600092': '01', '600093': '01', '600094': '01', '600095': '01',
  '600096': '01', '600097': '01', '600098': '01', '600099': '01', '600100': '01',
  // Madurai - RTO 45
  '625001': '45', '625002': '45', '625003': '45', '625004': '45', '625005': '45',
  '625006': '45', '625007': '45', '625008': '45', '625009': '45', '625010': '45',
  '625011': '45', '625012': '45', '625013': '45', '625014': '45', '625015': '45',
  '625016': '45', '625017': '45', '625018': '45', '625019': '45', '625020': '45',
  '625021': '45', '625022': '45', '625023': '45', '625024': '45', '625025': '45',
  // Trichy - RTO 39
  '620001': '39', '620002': '39', '620003': '39', '620004': '39', '620005': '39',
  '620006': '39', '620007': '39', '620008': '39', '620009': '39', '620010': '39',
  '620011': '39', '620012': '39', '620013': '39', '620014': '39', '620015': '39',
  '620016': '39', '620017': '39', '620018': '39', '620019': '39', '620020': '39',
  '620021': '39', '620022': '39', '620023': '39', '620024': '39', '620025': '39',
  // Salem - RTO 33
  '636001': '33', '636002': '33', '636003': '33', '636004': '33', '636005': '33',
  '636006': '33', '636007': '33', '636008': '33', '636009': '33', '636010': '33',
  '636011': '33', '636012': '33', '636013': '33', '636014': '33', '636015': '33',
  '636016': '33', '636017': '33', '636018': '33', '636019': '33', '636020': '33',
  // Tirunelveli - RTO 30
  '627001': '30', '627002': '30', '627003': '30', '627004': '30', '627005': '30',
  '627006': '30', '627007': '30', '627008': '30', '627009': '30', '627010': '30',
  '627011': '30', '627012': '30', '627013': '30', '627014': '30', '627015': '30',
  // Erode - RTO 31
  '638001': '31', '638002': '31', '638003': '31', '638004': '31', '638005': '31',
  '638006': '31', '638007': '31', '638008': '31', '638009': '31', '638010': '31',
  '638011': '31', '638012': '31', '638013': '31', '638014': '31', '638015': '31',
  // Vellore - RTO 23
  '632001': '23', '632002': '23', '632003': '23', '632004': '23', '632005': '23',
  '632006': '23', '632007': '23', '632008': '23', '632009': '23', '632010': '23',
  '632011': '23', '632012': '23', '632013': '23', '632014': '23', '632015': '23',
  // Tiruppur - RTO 38
  '641601': '38', '641602': '38', '641603': '38', '641604': '38', '641605': '38',
  '641606': '38', '641607': '38', '641608': '38', '641609': '38', '641610': '38',
  '641611': '38', '641612': '38', '641613': '38', '641614': '38', '641615': '38',
}

/**
 * Get RTO number from pincode
 * Returns default '37' (Coimbatore) if pincode not found
 */
export function getRTOFromPincode(pincode: string): string {
  const normalizedPincode = pincode.replace(/\D/g, '').padStart(6, '0').slice(0, 6)
  return PINCODE_TO_RTO[normalizedPincode] || '37' // Default to Coimbatore RTO 37
}

/**
 * Map category and brand to category code
 */
export function getCategoryCode(category: string, brand?: string): string {
  const normalizedCategory = category.toLowerCase()
  const normalizedBrand = brand?.toLowerCase() || ''

  // Camera/DSLR
  if (normalizedCategory === 'cameras' || normalizedCategory === 'camera' || normalizedCategory === 'dslr') {
    return 'DSLR'
  }

  // Apple Phones
  if (normalizedCategory === 'phones' && normalizedBrand.includes('apple')) {
    return 'IPNE'
  }

  // Samsung Phones
  if (normalizedCategory === 'phones' && normalizedBrand.includes('samsung')) {
    return 'SMSG'
  }

  // Apple Laptop
  if (normalizedCategory === 'laptops' && normalizedBrand.includes('apple')) {
    return 'MCBK'
  }

  // Apple Tablet
  if (normalizedCategory === 'tablets' && normalizedBrand.includes('apple')) {
    return 'IPAD'
  }

  // Default fallback based on category
  if (normalizedCategory === 'phones') {
    return 'IPNE' // Default to IPNE for other phones
  }
  if (normalizedCategory === 'laptops') {
    return 'MCBK' // Default to MCBK for other laptops
  }
  if (normalizedCategory === 'tablets') {
    return 'IPAD' // Default to IPAD for other tablets
  }

  return 'DSLR' // Default fallback
}

/**
 * Get state code from state name
 */
export function getStateCode(state: string): string {
  const normalizedState = state.toLowerCase().trim()
  
  const stateMap: Record<string, string> = {
    'tamil nadu': 'TN',
    'tamilnadu': 'TN',
    'tn': 'TN',
    'karnataka': 'KA',
    'kerala': 'KL',
    'andhra pradesh': 'AP',
    'telangana': 'TS',
    'maharashtra': 'MH',
    'delhi': 'DL',
    'gujarat': 'GJ',
    'rajasthan': 'RJ',
    'west bengal': 'WB',
    'uttar pradesh': 'UP',
    'punjab': 'PB',
    'haryana': 'HR',
    'odisha': 'OD',
    'assam': 'AS',
    'bihar': 'BR',
    'jharkhand': 'JH',
    'chhattisgarh': 'CG',
    'himachal pradesh': 'HP',
    'uttarakhand': 'UK',
    'goa': 'GA',
    'manipur': 'MN',
    'meghalaya': 'MG',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'sikkim': 'SK',
    'tripura': 'TR',
    'arunachal pradesh': 'AR',
    'ladakh': 'LA',
    'jammu and kashmir': 'JK',
    'puducherry': 'PY',
    'andaman and nicobar islands': 'AN',
    'dadra and nagar haveli and daman and diu': 'DH',
    'lakshadweep': 'LD',
  }

  return stateMap[normalizedState] || 'TN' // Default to Tamil Nadu
}

/**
 * Get next sequential order number (atomic increment)
 * This ensures ALL orders get sequential numbers: 1001, 1002, 1003, etc.
 */
async function getNextOrderNumber(): Promise<number> {
  const db = getFirestoreServer()
  const counterRef = doc(db, 'counters', 'orderId')

  console.log('Starting getNextOrderNumber - checking counter document...')
  
  // First, try simple read/write approach (faster, works if no concurrent requests)
  try {
    const counterDoc = await getDoc(counterRef)
    let currentNumber = 1000
    
    if (counterDoc.exists()) {
      const data = counterDoc.data()
      currentNumber = data?.count || 1000
      console.log('Current counter value:', currentNumber)
    } else {
      console.log('Counter document does not exist, initializing to 1000...')
      currentNumber = 1000
    }

    const nextNumber = currentNumber + 1
    console.log('Setting counter to:', nextNumber)
    await setDoc(counterRef, { count: nextNumber })
    console.log('Counter updated successfully to:', nextNumber)
    return nextNumber
  } catch (simpleError: any) {
    console.error('Simple counter update failed, trying transaction approach:', {
      message: simpleError?.message,
      code: simpleError?.code,
    })
    // Fall through to transaction approach
  }

  // Retry logic for transaction conflicts
  const maxRetries = 5
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Transaction attempt ${attempt + 1}/${maxRetries}`)
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef)
        console.log('Counter document exists:', counterDoc.exists())
        
        let nextNumber: number
        
        if (counterDoc.exists()) {
          const data = counterDoc.data()
          const currentNumber = data?.count || 1000
          console.log('Current counter value:', currentNumber)
          // Increment and update atomically
          nextNumber = currentNumber + 1
          transaction.update(counterRef, { count: nextNumber })
          console.log('Incremented to:', nextNumber)
        } else {
          // Initialize counter if it doesn't exist
          // Set to 1001 (first order number) directly
          console.log('Initializing counter to 1001')
          nextNumber = 1001
          transaction.set(counterRef, { count: nextNumber })
        }
        
        return nextNumber
      })
    } catch (error: any) {
      lastError = error
      console.error(`Transaction error (attempt ${attempt + 1}/${maxRetries}):`, {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      })
      
      // If it's a transaction conflict, retry
      if (error.code === 'failed-precondition' || error.code === 'aborted' || error.code === 'unavailable' || error.message?.includes('transaction')) {
        // Wait a bit before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 10
        console.log(`Retrying after ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      // For permission errors, don't retry
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firestore security rules')
        throw new Error('Permission denied: Check Firestore security rules for counters collection')
      }
      
      // If it's not a transaction conflict, wait a bit before retrying
      const waitTime = Math.pow(2, attempt) * 10
      console.log(`Non-transaction error, retrying after ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // If all retries failed, try non-transactional approach as last resort
  console.log('All transaction attempts failed, trying non-transactional approach...')
  try {
    const counterDoc = await getDoc(counterRef)
    let currentNumber = 1000
    
    if (counterDoc.exists()) {
      const data = counterDoc.data()
      currentNumber = data?.count || 1000
      console.log('Fallback: Current counter value:', currentNumber)
    } else {
      console.log('Fallback: Initializing counter to 1000')
      await setDoc(counterRef, { count: 1000 })
      currentNumber = 1000
    }

    const nextNumber = currentNumber + 1
    console.log('Fallback: Setting counter to:', nextNumber)
    await setDoc(counterRef, { count: nextNumber })
    return nextNumber
  } catch (fallbackError: any) {
    console.error('Fallback counter update failed:', {
      message: fallbackError?.message,
      code: fallbackError?.code,
      stack: fallbackError?.stack,
    })
    const errorMessage = `Failed to get sequential order number after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}. Fallback error: ${fallbackError?.message || 'Unknown error'}`
    throw new Error(errorMessage)
  }
}

/**
 * Generate custom Order ID
 * 
 * @param state - State name (e.g., "Tamil Nadu")
 * @param pincode - 6-digit pincode
 * @param category - Product category (cameras, phones, laptops, tablets)
 * @param brand - Product brand (optional, used for category code determination)
 * @returns Generated Order ID (e.g., "TN37WTDSLR1001")
 */
export async function generateOrderId(
  state: string,
  pincode: string,
  category: string,
  brand?: string
): Promise<string> {
  try {
    const stateCode = getStateCode(state)
    const rtoNumber = getRTOFromPincode(pincode)
    const categoryCode = getCategoryCode(category, brand)
    
    console.log('Generating Order ID components:', { stateCode, rtoNumber, categoryCode, category, brand })
    
    const orderNumber = await getNextOrderNumber()
    console.log('Got order number:', orderNumber)

    // Format: {STATE}{RTO}{WT}{CATEGORY}{SEQUENCE}
    // Example: TN37WTDSLR1001
    const orderId = `${stateCode}${rtoNumber}WT${categoryCode}${orderNumber.toString().padStart(4, '0')}`
    console.log('Generated Order ID:', orderId)
    
    return orderId
  } catch (error: any) {
    console.error('Error in generateOrderId:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      state,
      pincode,
      category,
      brand,
    })
    throw error
  }
}
