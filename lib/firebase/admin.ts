import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage, getDownloadURL } from 'firebase-admin/storage'

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
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET

  if (clientEmail && privateKey && projectId) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      ...(storageBucket && { storageBucket }),
    })
  } else if (projectId) {
    adminApp = initializeApp({ projectId, ...(storageBucket && { storageBucket }) })
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

export async function uploadToStorage(path: string, buffer: Buffer, contentType: string): Promise<string> {
  const storage = getStorage(getAdminApp())
  const configuredBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || ''
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''

  const bucketCandidates = [
    configuredBucket,
    `${projectId}.firebasestorage.app`,
    `${projectId}.appspot.com`,
  ].filter(Boolean)

  let lastError: unknown
  for (const bucketName of bucketCandidates) {
    try {
      const bucket = storage.bucket(bucketName)
      const file = bucket.file(path)
      await file.save(buffer, { contentType })
      return await getDownloadURL(file)
    } catch (err: any) {
      lastError = err
      const msg = err?.message || ''
      if (msg.includes('does not exist') || msg.includes('notFound') || err?.code === 404) {
        console.warn(`Bucket "${bucketName}" not found, trying next...`)
        continue
      }
      throw err
    }
  }
  console.error(`All bucket candidates failed: ${bucketCandidates.join(', ')}`)
  throw lastError
}
