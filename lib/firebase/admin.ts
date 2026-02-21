import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App | undefined

function getAdminApp(): App {
  if (adminApp) return adminApp

  const existing = getApps()
  if (existing.length > 0) {
    adminApp = existing[0]
    return adminApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (clientEmail && privateKey && projectId) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  } else if (projectId) {
    adminApp = initializeApp({ projectId })
  } else {
    throw new Error(
      'Firebase Admin SDK requires at least FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID). ' +
      'For full functionality, also set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
    )
  }

  return adminApp
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp())
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}
