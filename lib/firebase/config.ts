import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
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

// Initialize Firebase only on client side
function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === 'undefined') return undefined
  
  if (!getApps().length) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

function getFirestoreInstance(): Firestore | undefined {
  const app = getFirebaseApp()
  if (!app) return undefined
  return getFirestore(app)
}

function getAuthInstance(): Auth | undefined {
  const app = getFirebaseApp()
  if (!app) return undefined
  return getAuth(app)
}

// Lazy initialization - will be undefined during SSR/build
const app = getFirebaseApp()
const db = getFirestoreInstance()
const auth = getAuthInstance()

export { app, db, auth, firebaseConfig }
export type { RecaptchaVerifier }
