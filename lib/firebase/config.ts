import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth as getFirebaseAuth, Auth } from 'firebase/auth'
import { RecaptchaVerifier } from 'firebase/auth'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('FirebaseConfig')

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check for missing variables only in browser (client-side)
if (typeof window !== 'undefined') {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    logger.error(
      'Missing required Firebase environment variables',
      { missingVars }
    )
    logger.error('Please set these in your .env.local file. See ENV_SETUP.md for reference.')
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase config
if (typeof window !== 'undefined') {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    logger.warn('Missing Firebase config fields', { missingFields })
  } else {
    logger.info('Firebase config loaded', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey,
    })
  }
}

// Initialize Firebase only on client side
// Use singleton pattern to ensure only one app instance
let firebaseApp: FirebaseApp | undefined = undefined

function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === 'undefined') return undefined
  
  try {
    const existingApps = getApps()
    
    // If no apps exist, initialize new one
    if (existingApps.length === 0) {
      logger.info('Initializing Firebase app', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        hasApiKey: !!firebaseConfig.apiKey,
        appId: firebaseConfig.appId
      })
      
      // Initialize exactly as Firebase console suggests
      firebaseApp = initializeApp(firebaseConfig)
      
      logger.info('Firebase app initialized successfully', {
        name: firebaseApp.name,
        projectId: firebaseApp.options.projectId,
        authDomain: firebaseApp.options.authDomain,
      })
      
      // Verify the config matches exactly
      const mismatches: string[] = []
      if (firebaseApp.options.projectId !== firebaseConfig.projectId) {
        mismatches.push(`projectId: expected ${firebaseConfig.projectId}, got ${firebaseApp.options.projectId}`)
      }
      if (firebaseApp.options.authDomain !== firebaseConfig.authDomain) {
        mismatches.push(`authDomain: expected ${firebaseConfig.authDomain}, got ${firebaseApp.options.authDomain}`)
      }
      if (firebaseApp.options.storageBucket !== firebaseConfig.storageBucket) {
        mismatches.push(`storageBucket: expected ${firebaseConfig.storageBucket}, got ${firebaseApp.options.storageBucket}`)
      }
      if (firebaseApp.options.apiKey !== firebaseConfig.apiKey) {
        mismatches.push('apiKey: mismatch')
      }
      
      if (mismatches.length > 0) {
        logger.error('Firebase config mismatches detected', { mismatches })
      } else {
        logger.info('All Firebase config values match')
      }
      
      return firebaseApp
    }
    
    // Use existing app - but verify it matches our config
    firebaseApp = existingApps[0]
    console.log('🔄 Using existing Firebase app:', {
      name: firebaseApp.name,
      options: {
        projectId: firebaseApp.options.projectId,
        authDomain: firebaseApp.options.authDomain,
        storageBucket: firebaseApp.options.storageBucket,
        apiKey: firebaseApp.options.apiKey?.substring(0, 15) + '...'
      }
    })
    
    // Check if existing app matches our config - if not, log warning but don't fail
    const configMatches = 
      firebaseApp.options.projectId === firebaseConfig.projectId &&
      firebaseApp.options.apiKey === firebaseConfig.apiKey &&
      firebaseApp.options.authDomain === firebaseConfig.authDomain &&
      firebaseApp.options.storageBucket === firebaseConfig.storageBucket
    
    if (!configMatches) {
      logger.error('CRITICAL: Existing Firebase app does NOT match current config!', {
        expectedProjectId: firebaseConfig.projectId,
        actualProjectId: firebaseApp.options.projectId,
        expectedAuthDomain: firebaseConfig.authDomain,
        actualAuthDomain: firebaseApp.options.authDomain,
      })
      logger.warn('This will cause auth errors! Please clear browser cache and hard refresh')
    }
    
    return firebaseApp
  } catch (error: any) {
    logger.error('Error initializing Firebase', { 
      error: error.message,
      projectId: firebaseConfig.projectId 
    })
    return undefined
  }
}

function getFirestoreInstance(): Firestore | undefined {
  const app = getFirebaseApp()
  if (!app) return undefined
  return getFirestore(app)
}

function getAuthInstance(): Auth | undefined {
  const app = getFirebaseApp()
  if (!app) return undefined
  return getFirebaseAuth(app)
}

// Export functions instead of initialized instances to ensure client-side only initialization
export function getApp(): FirebaseApp | undefined {
  return getFirebaseApp()
}

export function getDb(): Firestore | undefined {
  return getFirestoreInstance()
}

export function getAuth(): Auth | undefined {
  return getAuthInstance()
}

// For backward compatibility, export lazy-initialized instances
// These will be undefined during SSR but will be initialized on client
let appInstance: FirebaseApp | undefined
let dbInstance: Firestore | undefined
let authInstance: Auth | undefined

if (typeof window !== 'undefined') {
  appInstance = getFirebaseApp()
  dbInstance = getFirestoreInstance()
  authInstance = getAuthInstance()
}

export const app = appInstance
export const db = dbInstance
export const auth = authInstance
export { firebaseConfig }
export type { RecaptchaVerifier }
