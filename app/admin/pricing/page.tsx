'use client'

import PricingConfig from '@/components/admin/PricingConfig'
import AdminGuard from '@/components/admin/AdminGuard'

export default function AdminPricingPage() {
    return (
        <AdminGuard>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Pricing Configuration</h1>
                </div>

                <PricingConfig />
            </div>
        </AdminGuard>
    )
}
