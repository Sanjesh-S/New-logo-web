import {
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  Auth,
} from 'firebase/auth'
import { getAuth as getAuthFromConfig, auth } from './config'
import { createOrUpdateUser } from './database'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('FirebaseAuth')

// Helper to get auth with type safety
function getAuthInstance(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase auth can only be accessed on the client side.')
  }

  // Try to get auth instance - initialize if needed
  let authInstance = auth
  if (!authInstance) {
    authInstance = getAuthFromConfig()
  }

  if (!authInstance) {
    throw new Error('Firebase auth is not initialized. Please refresh the page and try again.')
  }

  return authInstance
}

// Setup reCAPTCHA verifier
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be set up on the client side')
  }

  // Get auth instance - ensure it's from the same app
  const authInstance = getAuthInstance()

  // Verify auth instance is valid
  if (!authInstance || !authInstance.app) {
    throw new Error('Firebase Auth instance is not properly initialized')
  }

  // Clear any existing verifier - handle errors gracefully
  const existingVerifier = (window as any).recaptchaVerifier
  if (existingVerifier) {
    try {
      // Check if verifier is still valid before clearing
      if (existingVerifier && typeof existingVerifier.clear === 'function') {
        existingVerifier.clear()
        // Cleared existing reCAPTCHA verifier
      }
    } catch (e: any) {
      // Ignore internal errors - verifier might already be cleared
      if (e?.code !== 'auth/internal-error') {
        console.warn('Error clearing existing reCAPTCHA verifier:', e)
      }
    } finally {
      delete (window as any).recaptchaVerifier
    }
  }

  // Ensure the container exists in the DOM
  const container = document.getElementById(containerId)
  if (!container) {
    // Create the container if it doesn't exist
    const newContainer = document.createElement('div')
    newContainer.id = containerId
    newContainer.style.display = 'none' // Hide it since we're using invisible reCAPTCHA
    document.body.appendChild(newContainer)
  }

  try {
    // Creating RecaptchaVerifier (removed sensitive logging)

    const recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
        // reCAPTCHA verified
      },
      'expired-callback': () => {
        // Response expired, ask user to solve reCAPTCHA again
        // reCAPTCHA expired - will retry
      },
    })

      ; (window as any).recaptchaVerifier = recaptchaVerifier
    // RecaptchaVerifier created successfully
    return recaptchaVerifier
  } catch (error: any) {
    // Log error without exposing sensitive details
    const logger = createLogger('FirebaseAuth')
    logger.error('Error creating RecaptchaVerifier', { error: error.message })
    throw new Error(`Failed to initialize reCAPTCHA: ${error.message || 'Unknown error'}`)
  }
}

// Send OTP to phone number
export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const authInstance = getAuthInstance()

    // Verify auth instance is properly configured
    if (!authInstance || !authInstance.app) {
      throw new Error('Firebase Auth is not properly initialized')
    }

    // Log OTP send attempt (without sensitive details)
    logger.info('Sending OTP', { phoneNumber: phoneNumber.substring(0, 3) + '****' })

    // Verify API key is set (use environment variable, not hardcoded value)
    if (!authInstance.app.options.apiKey) {
      throw new Error('Firebase API key is not configured. Please check your environment variables.')
    }

    const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, recaptchaVerifier)
    logger.info('OTP sent successfully')
    return confirmationResult
  } catch (error: any) {
    console.error('Error sending OTP:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Auth instance at error:', {
      appName: getAuthInstance()?.app?.name,
      projectId: getAuthInstance()?.app?.options?.projectId
    })

    // Provide more specific error messages
    if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key') {
      console.error('❌ API Key Error Details:')
      console.error('Current API Key (first 20 chars):', getAuthInstance()?.app?.options?.apiKey?.substring(0, 20))
      console.error('Project ID:', getAuthInstance()?.app?.options?.projectId)
      console.error('Auth Domain:', getAuthInstance()?.app?.options?.authDomain)
      throw new Error('Firebase API key is invalid. Please:\n1. Verify API key in GitHub Secrets matches Firebase Console\n2. Check API key restrictions in Google Cloud Console\n3. Wait for deployment to complete and clear browser cache\n4. Ensure API key has no extra spaces')
    } else if (error.code === 'auth/invalid-app-credential') {
      throw new Error('Firebase configuration error. Please verify:\n1. API key matches Firebase project\n2. Phone Authentication is enabled\n3. Authorized domains include localhost\n4. Try refreshing the page')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a moment and try again.')
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please enter a valid 10-digit mobile number.')
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later.')
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.')
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
    logger.error('Error verifying OTP', { errorCode: error.code })
    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-verification-code' || error.code === 'auth/code-expired') {
      throw new Error('Wrong OTP. Please try again.')
    }
    throw new Error(error.message || 'Invalid OTP code')
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    const authInstance = getAuthInstance()
    await firebaseSignOut(authInstance)
  } catch (error: any) {
    logger.error('Error signing out', { error: error.message })
    throw new Error(error.message || 'Failed to sign out')
  }
}

// Get current user
export function getCurrentUser(): User | null {
  try {
    const authInstance = getAuthInstance()
    return authInstance.currentUser
  } catch {
    return null
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  try {
    const authInstance = getAuthInstance()
    return onAuthStateChanged(authInstance, callback)
  } catch {
    // Return no-op unsubscribe if auth isn't available
    return () => { }
  }
}
