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
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const verifyAdmin = async () => {
            // Don't check until initial auth load is done
            if (loading) return

            if (!user) {
                router.push('/')
                return
            }

            // Check if we have at least one identifier
            if (!user.email && !user.phoneNumber) {
                setAuthorized(false)
                setCheckingRole(false)
                return
            }

            try {
                setErrorMsg('')
                console.log('Verifying admin for:', { email: user.email, phone: user.phoneNumber, uid: user.uid })

                const isAdmin = await checkIsSuperAdmin({
                    email: user.email,
                    phoneNumber: user.phoneNumber
                })

                console.log('Admin check result:', isAdmin)

                if (isAdmin) {
                    setAuthorized(true)
                } else {
                    setAuthorized(false)
                }
            } catch (error: any) {
                console.error('Admin check failed:', error)
                setErrorMsg(error.message || 'Unknown error occurred')
                setAuthorized(false)
            } finally {
                setCheckingRole(false)
            }
        }

        verifyAdmin()
    }, [user, loading, router])

    if (loading || checkingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-900"></div>
            </div>
        )
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
                <div className="text-sm text-gray-500 mb-6 max-w-md text-center">
                    <p className="font-medium">Logged in as:</p>
                    <p>Phone: {user?.phoneNumber || 'N/A'}</p>
                    <p>Email: {user?.email || 'N/A'}</p>
                    <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        <strong>User UID:</strong> {user?.uid}
                    </div>

                    {errorMsg && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-left text-xs font-mono">
                            <strong>Debug Error:</strong><br />
                            {errorMsg}
                        </div>
                    )}

                    <p className="mt-4 text-xs text-gray-400">
                        Ensure your staff profile exists and its <strong>Document ID</strong> matches the UID above to fix permission errors.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-brand-blue-900 text-white rounded hover:bg-brand-blue-800 transition-colors"
                >
                    Return Home
                </button>
            </div>
        )
    }

    return <>{children}</>
}
