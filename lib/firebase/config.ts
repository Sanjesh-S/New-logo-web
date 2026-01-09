import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth as getFirebaseAuth, Auth } from 'firebase/auth'
import { RecaptchaVerifier } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7qOY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "worthyten-otp-a925d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "worthyten-otp-a925d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "worthyten-otp-a925d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1067702314639",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1067702314639:web:0bb2a39181720c306572fa",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-WBXQ5SM16Y",
}

// Validate Firebase config
if (typeof window !== 'undefined') {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    console.warn('Missing Firebase config fields:', missingFields)
  } else {
    console.log('Firebase config loaded:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey
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
      console.log('🔵 Initializing Firebase app with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        apiKey: firebaseConfig.apiKey?.substring(0, 15) + '...',
        appId: firebaseConfig.appId
      })
      
      // Initialize exactly as Firebase console suggests
      firebaseApp = initializeApp(firebaseConfig)
      
      console.log('✅ Firebase app initialized successfully:', {
        name: firebaseApp.name,
        options: {
          projectId: firebaseApp.options.projectId,
          authDomain: firebaseApp.options.authDomain,
          storageBucket: firebaseApp.options.storageBucket,
          apiKey: firebaseApp.options.apiKey?.substring(0, 15) + '...',
          appId: firebaseApp.options.appId
        }
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
        console.error('❌ Firebase config mismatches detected:', mismatches)
      } else {
        console.log('✅ All Firebase config values match')
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
      console.error('❌ CRITICAL: Existing Firebase app does NOT match current config!')
      console.error('Expected config:', {
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey?.substring(0, 15) + '...',
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket
      })
      console.error('Actual app config:', {
        projectId: firebaseApp.options.projectId,
        apiKey: firebaseApp.options.apiKey?.substring(0, 15) + '...',
        authDomain: firebaseApp.options.authDomain,
        storageBucket: firebaseApp.options.storageBucket
      })
      console.error('⚠️ This will cause auth errors! Please:')
      console.error('1. Clear browser cache completely')
      console.error('2. Hard refresh (Ctrl+Shift+R)')
      console.error('3. Or restart the dev server')
    }
    
    return firebaseApp
  } catch (error: any) {
    console.error('❌ Error initializing Firebase:', error)
    console.error('Firebase config being used:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      apiKey: firebaseConfig.apiKey?.substring(0, 15) + '...',
      appId: firebaseConfig.appId
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
