import {
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  Auth,
} from 'firebase/auth'
import { auth } from './config'
import { createOrUpdateUser } from './database'

// Helper to get auth with type safety
function getAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase auth is not initialized. This function must be called on the client side.')
  }
  return auth
}

// Setup reCAPTCHA verifier
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  // Clear any existing verifier
  const existingVerifier = (window as any).recaptchaVerifier
  if (existingVerifier) {
    existingVerifier.clear()
  }

  const recaptchaVerifier = new RecaptchaVerifier(getAuth(), containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber
    },
    'expired-callback': () => {
      // Response expired, ask user to solve reCAPTCHA again
      console.error('reCAPTCHA expired')
    },
  })

    ; (window as any).recaptchaVerifier = recaptchaVerifier
  return recaptchaVerifier
}

// Send OTP to phone number
export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(getAuth(), phoneNumber, recaptchaVerifier)
    return confirmationResult
  } catch (error: any) {
    console.error('Error sending OTP:', error)
    throw new Error(error.message || 'Failed to send OTP')
  }
}

// Verify OTP code
export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> {
  try {
    const result = await confirmationResult.confirm(code)
    const user = result.user

    // Create or update user in Firestore
    if (user.phoneNumber) {
      await createOrUpdateUser(user.uid, {
        id: user.uid,
        phone: user.phoneNumber,
      })
    }

    return user
  } catch (error: any) {
    console.error('Error verifying OTP:', error)
    throw new Error(error.message || 'Invalid OTP code')
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(getAuth())
  } catch (error: any) {
    console.error('Error signing out:', error)
    throw new Error(error.message || 'Failed to sign out')
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const authInstance = auth
  if (!authInstance) {
    // Return no-op unsubscribe if auth isn't available
    return () => { }
  }
  return onAuthStateChanged(authInstance, callback)
}
