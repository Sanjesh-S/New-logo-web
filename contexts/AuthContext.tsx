'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { User } from 'firebase/auth'
import { getCurrentUser, onAuthStateChange } from '@/lib/firebase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)
  const loadingStillTrueRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    loadingStillTrueRef.current = true

    // Check current user immediately to reduce initial loading time
    try {
      const currentUser = getCurrentUser()
      if (isMountedRef.current && currentUser) {
        setUser(currentUser)
        // Don't set loading to false yet, wait for auth state listener
      }
    } catch (err) {
      console.error('Error getting current user:', err)
    }

    let unsubscribe: (() => void) | undefined

    try {
      unsubscribe = onAuthStateChange((authUser) => {
        if (!isMountedRef.current) return
        loadingStillTrueRef.current = false
        setUser(authUser)
        setLoading(false)
        setError(null)
      })
    } catch (err) {
      console.error('Error setting up auth state listener:', err)
      if (isMountedRef.current) {
        loadingStillTrueRef.current = false
        setError(err instanceof Error ? err : new Error('Failed to initialize auth'))
        setLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading state (use ref to avoid stale closure)
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && loadingStillTrueRef.current) {
        loadingStillTrueRef.current = false
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => {
      isMountedRef.current = false
      clearTimeout(timeoutId)
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe()
        } catch (err) {
          console.error('Error unsubscribing from auth state:', err)
        }
      }
    }
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = {
    user,
    loading,
    isAuthenticated: !loading && !!user,
    error,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}












