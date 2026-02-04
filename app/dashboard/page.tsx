'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'

import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { Package, MapPin, Settings, User, Clock, CheckCircle, XCircle, AlertCircle, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import OrderHistory from '@/components/Dashboard/OrderHistory'
import ActiveOrders from '@/components/Dashboard/ActiveOrders'
import AddressBook from '@/components/Dashboard/AddressBook'
import AccountSettings from '@/components/Dashboard/AccountSettings'
import ReferralProgram from '@/components/ReferralProgram'

type Tab = 'orders' | 'active' | 'addresses' | 'settings' | 'referral'

function DashboardContent() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('active')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const tabs = [
    { id: 'active' as Tab, label: 'Active Orders', icon: Clock },
    { id: 'addresses' as Tab, label: 'Saved Addresses', icon: MapPin },
    { id: 'referral' as Tab, label: 'Referral Program', icon: Gift },
    { id: 'orders' as Tab, label: 'Order History', icon: Package },
    { id: 'settings' as Tab, label: 'Account Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.phoneNumber || user.displayName || 'User'}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? 'border-brand-blue-600 text-brand-blue-900 bg-brand-blue-50'
                        : 'border-transparent text-gray-600 hover:text-brand-blue-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              {activeTab === 'orders' && <OrderHistory />}
              {activeTab === 'active' && <ActiveOrders />}
              {activeTab === 'addresses' && <AddressBook />}
              {activeTab === 'referral' && <ReferralProgram />}
              {activeTab === 'settings' && <AccountSettings />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </>
  )
}
