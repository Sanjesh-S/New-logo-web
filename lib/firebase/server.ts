/**
 * Firebase Server-Side Initialization
 * 
 * This module provides Firebase initialization for server-side code (API routes).
 * It centralizes Firebase configuration and ensures environment variables are used.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

// Validate and get Firebase configuration from environment variables
function getFirebaseConfig() {
  const requiredEnvVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Check for missing required environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
      'Please set these in your .env.local file. See .env.example for reference.'
    )
  }

  return {
    apiKey: requiredEnvVars.apiKey!,
    authDomain: requiredEnvVars.authDomain!,
    projectId: requiredEnvVars.projectId!,
    storageBucket: requiredEnvVars.storageBucket!,
    messagingSenderId: requiredEnvVars.messagingSenderId!,
    appId: requiredEnvVars.appId!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
}

let firebaseApp: FirebaseApp | undefined = undefined

/**
 * Get or initialize Firebase app instance (server-side only)
 * Uses singleton pattern to ensure only one app instance exists
 */
export function getFirebaseAppServer(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
    return firebaseApp
  }

  const config = getFirebaseConfig()
  firebaseApp = initializeApp(config, 'server')
  return firebaseApp
}

/**
 * Get Firestore instance for server-side use
 */
export function getFirestoreServer(): Firestore {
  const app = getFirebaseAppServer()
  return getFirestore(app)
}
