'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkIsSuperAdmin } from '@/lib/firebase/database'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [checkingRole, setCheckingRole] = useState(true)

    useEffect(() => {
        const verifyAdmin = async () => {
            // Don't check until initial auth load is done
            if (loading) return

            if (!user) {
                // Not logged in - redirect to home
                router.replace('/')
                return
            }

            // Check if we have at least one identifier
            if (!user.email && !user.phoneNumber) {
                // No identifier - redirect to home
                router.replace('/')
                return
            }

            try {
                const isAdmin = await checkIsSuperAdmin({
                    email: user.email,
                    phoneNumber: user.phoneNumber
                })

                if (isAdmin) {
                    setAuthorized(true)
                } else {
                    // Not an admin - redirect to home immediately
                    router.replace('/')
                }
            } catch (error: any) {
                // Error checking admin status - redirect to home
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
