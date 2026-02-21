'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [checkingRole, setCheckingRole] = useState(true)

    useEffect(() => {
        const verifyAdmin = async () => {
            if (loading) return

            if (!user) {
                router.replace('/')
                return
            }

            if (!user.email && !user.phoneNumber) {
                router.replace('/')
                return
            }

            try {
                const token = await user.getIdToken()
                const res = await fetch('/api/auth/staff-sync', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data.synced && data.isActive && (data.role === 'superadmin' || data.role === 'manager')) {
                        setAuthorized(true)
                    } else {
                        router.replace('/')
                    }
                } else {
                    router.replace('/')
                }
            } catch (error: any) {
                console.error('Admin check failed')
                router.replace('/')
            } finally {
                setCheckingRole(false)
            }
        }

        verifyAdmin()
    }, [user, loading, router])

    // Show loading spinner while checking
    if (loading || checkingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            </div>
        )
    }

    // If not authorized, show nothing (redirect is happening)
    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            </div>
        )
    }

    return <>{children}</>
}
