import Link from 'next/link'
import AdminGuard from '@/components/admin/AdminGuard'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <Link href="/admin/products" className="flex-shrink-0 flex items-center cursor-pointer">
                                    <span className="text-xl font-bold text-brand-blue-900">Admin Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </AdminGuard>
    )
}
