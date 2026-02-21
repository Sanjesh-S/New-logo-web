'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function QCGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    const verify = async () => {
      if (loading) return
      if (!user) { router.replace('/'); return }

      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/auth/staff-sync', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.synced && data.isActive && (data.role === 'qc_team' || data.role === 'superadmin' || data.role === 'manager')) {
            setAuthorized(true)
          } else {
            router.replace('/')
          }
        } else {
          router.replace('/')
        }
      } catch {
        router.replace('/')
      } finally {
        setCheckingRole(false)
      }
    }
    verify()
  }, [user, loading, router])

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  return <>{children}</>
}
