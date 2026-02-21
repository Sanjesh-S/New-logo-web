'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const ShowroomContext = createContext<{ showroomId: string; showroomName: string } | null>(null)
export const useShowroom = () => useContext(ShowroomContext)

export default function ShowroomGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [showroomInfo, setShowroomInfo] = useState<{ showroomId: string; showroomName: string } | null>(null)

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
          if (data.synced && data.isActive && data.role === 'showroom_staff') {
            setAuthorized(true)
            setShowroomInfo({
              showroomId: data.showroomId || '',
              showroomName: data.showroomName || 'My Showroom',
            })
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!authorized || !showroomInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  return (
    <ShowroomContext.Provider value={showroomInfo}>
      {children}
    </ShowroomContext.Provider>
  )
}
