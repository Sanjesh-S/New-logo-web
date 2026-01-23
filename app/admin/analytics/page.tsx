'use client'

import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import AdminGuard from '@/components/admin/AdminGuard'

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </AdminGuard>
  )
}
