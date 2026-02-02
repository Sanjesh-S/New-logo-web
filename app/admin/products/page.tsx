'use client'

import { useEffect, useState } from 'react'
import { subscribeToProducts, subscribeToPickupRequests, updatePickupRequest, updateProduct, type Product, type PickupRequest } from '@/lib/firebase/database'
import { addVariantsToProduct } from '@/lib/utils/productVariants'
import ProductFormModal from '@/components/admin/ProductFormModal'
import PricingCalculator from '@/components/admin/PricingCalculator'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import AssessmentViewModal from '@/components/admin/AssessmentViewModal'

// Icons
const PackageIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
)

const CalculatorIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
)

const TruckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
)

const XCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
)

const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

// Calendar Icon for Rescheduled
const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

export default function AdminProductsPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'calculator' | 'pickup' | 'rescheduled' | 'cancelled' | 'analytics'>('products')
    const [products, setProducts] = useState<Product[]>([])
    const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [pickupReady, setPickupReady] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [liveIndicator, setLiveIndicator] = useState(true)
    const [assessmentModalRequest, setAssessmentModalRequest] = useState<PickupRequest | null>(null)
    const [addingVariants, setAddingVariants] = useState(false)
    const [variantsMessage, setVariantsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Filters (Product List)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    // Filters (Pickup Requests / Rescheduled / Cancelled)
    const [pickupStatusFilter, setPickupStatusFilter] = useState<string>('All')
    const [pickupSearchTerm, setPickupSearchTerm] = useState('')

    // Real-time: active pickup requests (exclude cancelled; used for stats and Pickup tab)
    const activePickupRequests = pickupRequests.filter((r) => r.status !== 'cancelled')
    const rescheduledRequests = pickupRequests.filter((r) => r.rescheduled === true && r.status !== 'cancelled')
    const cancelledRequests = pickupRequests.filter((r) => r.status === 'cancelled')

    // Sort rescheduled by rescheduledAt (newest first)
    const rescheduledSorted = [...rescheduledRequests].sort((a, b) => {
        const aDate = a.rescheduledAt instanceof Date ? a.rescheduledAt.getTime() : (a.rescheduledAt as any)?.toDate?.()?.getTime() || 0
        const bDate = b.rescheduledAt instanceof Date ? b.rescheduledAt.getTime() : (b.rescheduledAt as any)?.toDate?.()?.getTime() || 0
        return bDate - aDate
    })

    // Real-time subscription: products (updates Total Products and list instantly)
    useEffect(() => {
        const unsubscribe = subscribeToProducts((data) => {
            setProducts(data)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Real-time subscription: pickup requests (updates Pending, Active Pickups, Completed, tab counts instantly)
    useEffect(() => {
        const unsubscribe = subscribeToPickupRequests((data) => {
            setPickupRequests(data)
            setPickupReady(true)
        })
        return () => unsubscribe()
    }, [])

    // Optional: pulse "Live" indicator every few seconds to show real-time is active
    useEffect(() => {
        const t = setInterval(() => setLiveIndicator((v) => !v), 2000)
        return () => clearInterval(t)
    }, [])

    // Prevent scroll jumping on refresh: scroll to top and disable browser scroll restoration on this page
    useEffect(() => {
        if (typeof window === 'undefined') return
        window.history.scrollRestoration = 'manual'
        window.scrollTo(0, 0)
    }, [])

    const handleStatusChange = async (requestId: string, newStatus: string) => {
        try {
            await updatePickupRequest(requestId, { status: newStatus as any })
            // State updates automatically via real-time subscription
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
    }

    const handleRemarksChange = async (requestId: string, remarks: string) => {
        try {
            await updatePickupRequest(requestId, { remarks })
            // State updates automatically via real-time subscription
        } catch (error) {
            console.error('Error updating remarks:', error)
            alert('Failed to update remarks')
        }
    }

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Filter pickup requests by status and search (Order ID, product, customer name/phone/email)
    const filteredActivePickupRequests = activePickupRequests.filter((request) => {
        const status = request.status || 'pending'
        const matchesStatus = pickupStatusFilter === 'All' || status === pickupStatusFilter
        if (!matchesStatus) return false
        const q = pickupSearchTerm.trim().toLowerCase()
        if (!q) return true
        const orderId = (request.orderId || request.valuationId || request.id || '').toLowerCase()
        const productName = (request.productName || request.device?.productName || '').toLowerCase()
        const customerName = (request.customer?.name || request.userName || '').toLowerCase()
        const customerPhone = (request.customer?.phone || request.userPhone || '').toLowerCase()
        const customerEmail = (request.customer?.email || request.userEmail || '').toLowerCase()
        return orderId.includes(q) || productName.includes(q) || customerName.includes(q) || customerPhone.includes(q) || customerEmail.includes(q)
    })

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    const handleCloseModal = () => {
        setIsFormOpen(false)
        setEditingProduct(null)
    }

    const handleAddVariantsToAll = async (overwriteExisting = false) => {
        const toProcess = overwriteExisting
            ? products
            : products.filter((p) => !p.variants || p.variants.length === 0)
        if (toProcess.length === 0) {
            setVariantsMessage({ type: 'success', text: overwriteExisting ? 'No products to update.' : 'All products already have variants.' })
            setTimeout(() => setVariantsMessage(null), 3000)
            return
        }
        setAddingVariants(true)
        setVariantsMessage(null)
        let updated = 0
        let failed = 0
        try {
            for (const product of toProcess) {
                const updates = addVariantsToProduct(product)
                if (updates.variants && updates.variants.length > 0) {
                    try {
                        await updateProduct(product.id, updates)
                        updated++
                    } catch {
                        failed++
                    }
                }
            }
            setVariantsMessage({
                type: failed > 0 ? 'error' : 'success',
                text: failed > 0
                    ? `Updated variants for ${updated} products. ${failed} failed.`
                    : overwriteExisting
                    ? `Re-applied default variants to ${updated} products.`
                    : `Added variants to ${updated} products.`,
            })
        } catch (e) {
            setVariantsMessage({ type: 'error', text: 'Failed: ' + (e instanceof Error ? e.message : 'Unknown error') })
        } finally {
            setAddingVariants(false)
            setTimeout(() => setVariantsMessage(null), 5000)
        }
    }

    // Get unique categories for filter
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]

    // Stats from real-time data (update instantly when new requests arrive)
    const pendingPickups = activePickupRequests.filter((r) => r.status === 'pending').length
    const completedPickups = activePickupRequests.filter((r) => r.status === 'completed').length
    const totalProducts = products.length

    const tabs = [
        { id: 'products' as const, label: 'Product List', icon: PackageIcon, count: totalProducts },
        { id: 'calculator' as const, label: 'Price Calculator', icon: CalculatorIcon },
        { id: 'pickup' as const, label: 'Pickup Requests', icon: TruckIcon, count: activePickupRequests.length, highlight: pendingPickups > 0 },
        { id: 'rescheduled' as const, label: 'Rescheduled', icon: CalendarIcon, count: rescheduledSorted.length, warning: rescheduledSorted.length > 0 },
        { id: 'cancelled' as const, label: 'Cancelled Orders', icon: XCircleIcon, count: cancelledRequests.length, danger: true },
        { id: 'analytics' as const, label: 'Analytics', icon: ChartIcon },
    ]

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { bg: string; text: string; dot: string }> = {
            pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
            completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
            hold: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
            verification: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
            reject: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
            suspect: { bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500' },
            confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
        }
        return configs[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col justify-center items-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
                </div>
                <p className="mt-4 text-gray-500 text-sm">Loading products...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Products Management</h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${liveIndicator ? 'animate-pulse' : ''}`} />
                                Live
                            </span>
                        </div>
                        <p className="text-brand-blue-200 mt-1">Manage your inventory, pricing, and pickup requests — updates instantly</p>
                    </div>
                    {activeTab === 'products' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => handleAddVariantsToAll(false)}
                                disabled={addingVariants || products.length === 0}
                                className="inline-flex items-center gap-2 bg-brand-lime text-brand-blue-900 px-5 py-2.5 rounded-xl hover:bg-brand-lime-400 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingVariants ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Adding…
                                    </>
                                ) : (
                                    <>
                                        <PackageIcon />
                                        Add variants to all
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleAddVariantsToAll(true)}
                                disabled={addingVariants || products.length === 0}
                                title="Re-apply correct default variants (128/256/512/1 TB for iPhone, etc.) to every product. Overwrites existing variants."
                                className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Fix variants (re-apply all)
                            </button>
                            <button
                                onClick={handleAddNew}
                                className="inline-flex items-center gap-2 bg-white text-brand-blue-900 px-5 py-2.5 rounded-xl hover:bg-brand-blue-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Product
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Stats — update in real time when new requests arrive */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Total Products</p>
                        <p className="text-2xl font-bold text-white mt-1">{totalProducts}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Active Pickups</p>
                        <p className="text-2xl font-bold text-white mt-1">{activePickupRequests.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-amber-300 mt-1">{pendingPickups}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Completed</p>
                        <p className="text-2xl font-bold text-emerald-300 mt-1">{completedPickups}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5">
                <nav className="flex flex-wrap gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                                    isActive
                                        ? tab.danger
                                            ? 'bg-red-500 text-white shadow-md'
                                            : tab.warning
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-brand-blue-900 text-white shadow-md'
                                        : tab.danger
                                        ? 'text-red-600 hover:bg-red-50'
                                        : tab.warning
                                        ? 'text-orange-600 hover:bg-orange-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Icon />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : tab.danger
                                            ? 'bg-red-100 text-red-600'
                                            : tab.warning
                                            ? 'bg-orange-100 text-orange-700'
                                            : tab.highlight
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    {variantsMessage && (
                        <div className={`rounded-xl border p-4 ${variantsMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {variantsMessage.text}
                        </div>
                    )}
                    {/* Filters Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or brand..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white transition-all"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Internal Base</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                        {product.imageUrl ? (
                                                            <img className="h-full w-full object-cover" src={product.imageUrl} alt="" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                                                                <PackageIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{product.modelName}</div>
                                                        <div className="text-sm text-gray-500">{product.brand}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">₹{product.basePrice.toLocaleString('en-IN')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600">₹{product.internalBasePrice?.toLocaleString('en-IN')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50 rounded-lg transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="text-gray-400 mb-2">
                                                    <PackageIcon />
                                                </div>
                                                <p className="text-gray-500">No products found matching your search.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <ProductFormModal
                        isOpen={isFormOpen}
                        product={editingProduct}
                        onClose={handleCloseModal}
                        onProductSaved={() => {}}
                    />
                </div>
            )}

            {activeTab === 'calculator' && <PricingCalculator />}

            {/* Pickup Requests Tab — real-time list */}
            {activeTab === 'pickup' && (
                <div className="space-y-4">
                    {/* Pickup filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Order ID, product, customer name, phone or email..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all"
                                    value={pickupSearchTerm}
                                    onChange={(e) => setPickupSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={pickupStatusFilter}
                                    onChange={(e) => setPickupStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white transition-all"
                                >
                                    <option value="All">All statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="hold">Hold</option>
                                    <option value="verification">Verification</option>
                                    <option value="reject">Reject</option>
                                    <option value="suspect">Suspect</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {!pickupReady ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
                            <p className="mt-4 text-gray-500 text-sm">Connecting to live updates...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Pickup Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Assessment</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredActivePickupRequests.map((request) => {
                                        const createdAt = request.createdAt instanceof Date 
                                            ? request.createdAt 
                                            : (request.createdAt as any)?.toDate?.() || new Date()
                                        
                                        const productName = request.productName || request.device?.productName || 'N/A'
                                        const price = request.price || request.device?.adjustedPrice || 0
                                        const customerName = request.customer?.name || request.userName || 'N/A'
                                        const customerPhone = request.customer?.phone || request.userPhone || 'N/A'
                                        const customerEmail = request.customer?.email || request.userEmail || 'N/A'
                                        const address = request.customer?.address || request.pickupAddress || ''
                                        const city = request.customer?.city || ''
                                        const state = request.customer?.state || request.state || ''
                                        const pincode = request.customer?.pincode || ''
                                        const pickupDate = request.pickupDate ? new Date(request.pickupDate) : null
                                        const status = request.status || 'pending'
                                        const statusConfig = getStatusConfig(status)

                                        // Prefer custom Order ID (TN/state format); fallback to Firebase doc id
                                        const isCustomOrderId = (id: string | null | undefined) =>
                                            id && /^[A-Z]{2}\d/.test(id)
                                        const displayOrderId =
                                            request.orderId ||
                                            (isCustomOrderId(request.valuationId) ? request.valuationId : null) ||
                                            request.id
                                        const isLegacy = !request.orderId && !isCustomOrderId(request.valuationId)

                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-mono ${isLegacy ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                            {displayOrderId}
                                                        </div>
                                                        {isLegacy && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                Legacy (Firebase ID)
                                                            </span>
                                                        )}
                                                        <div className="text-xs text-gray-400">
                                                            {createdAt.toLocaleDateString('en-IN')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 text-sm">{productName}</div>
                                                    {request.device?.accessories && request.device.accessories.length > 0 && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            + {request.device.accessories.length} accessories
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-gray-900 text-sm">{customerName}</div>
                                                        <div className="text-sm text-gray-500">{customerPhone}</div>
                                                        {customerEmail !== 'N/A' && (
                                                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{customerEmail}</div>
                                                        )}
                                                        {(address || city || state) && (
                                                            <div className="text-xs text-gray-400 truncate max-w-[180px]">
                                                                {city && `${city}, `}{state}{pincode && ` - ${pincode}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">
                                                        ₹{price.toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {pickupDate ? (
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-gray-900 text-sm">
                                                                {pickupDate.toLocaleDateString('en-IN', { 
                                                                    weekday: 'short',
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                            {request.pickupTime && (
                                                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                                    {request.pickupTime}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">Not scheduled</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={status}
                                                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                        className={`text-xs font-semibold rounded-lg px-3 py-1.5 border ${statusConfig.bg} ${statusConfig.text} focus:ring-2 focus:ring-brand-blue-500 outline-none cursor-pointer transition-all`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="hold">Hold</option>
                                                        <option value="verification">Verification</option>
                                                        <option value="reject">Reject</option>
                                                        <option value="suspect">Suspect</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssessmentModalRequest(request)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50 rounded-lg transition-all border border-brand-blue-200"
                                                    >
                                                        <ChartIcon />
                                                        {(request.assessmentAnswers && Object.keys(request.assessmentAnswers).length > 0) ||
                                                        (request.device?.assessmentAnswers && Object.keys(request.device.assessmentAnswers).length > 0) ||
                                                        (!!request.valuationId && String(request.valuationId).trim() !== '')
                                                            ? 'View assessment'
                                                            : 'No data'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <textarea
                                                        defaultValue={request.remarks || ''}
                                                        onBlur={(e) => handleRemarksChange(request.id, e.target.value)}
                                                        placeholder="Add remarks..."
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none resize-none transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                                        rows={2}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredActivePickupRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <TruckIcon />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">
                                                        {pickupSearchTerm.trim() || pickupStatusFilter !== 'All'
                                                            ? 'No requests match your filters'
                                                            : 'No pickup requests'}
                                                    </p>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {pickupSearchTerm.trim() || pickupStatusFilter !== 'All'
                                                            ? 'Try changing search or status filter'
                                                            : 'New requests appear here instantly'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Rescheduled Orders Tab — real-time */}
            {activeTab === 'rescheduled' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <CalendarIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-orange-800">Rescheduled Orders</h2>
                                <p className="text-sm text-orange-600">Updates in real time</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Order ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Previous Pickup</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">New Pickup</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Rescheduled On</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rescheduledSorted.map((request) => {
                                        const customerName = request.customer?.name || request.userName || 'N/A'
                                        const customerPhone = request.customer?.phone || request.userPhone || 'N/A'
                                        const customerEmail = request.customer?.email || request.userEmail || 'N/A'
                                        const price = request.price || request.device?.adjustedPrice || 0
                                        const productName = request.productName || request.device?.productName || 'N/A'
                                        const previousPickupDate = request.previousPickupDate ? new Date(request.previousPickupDate) : null
                                        const newPickupDate = request.pickupDate ? new Date(request.pickupDate) : null
                                        const rescheduledAt = request.rescheduledAt 
                                            ? (request.rescheduledAt instanceof Date 
                                                ? request.rescheduledAt 
                                                : (request.rescheduledAt as any)?.toDate?.() || new Date())
                                            : null
                                        const status = request.status || 'pending'
                                        const statusConfig = getStatusConfig(status)
                                        const isCustomOrderIdResched = (id: string | null | undefined) => id && /^[A-Z]{2}\d/.test(id)
                                        const displayOrderIdResched = request.orderId || (isCustomOrderIdResched(request.valuationId) ? request.valuationId : null) || request.id
                                        const isLegacyResched = !request.orderId && !isCustomOrderIdResched(request.valuationId)

                                        return (
                                            <tr key={request.id} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-mono ${isLegacyResched ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                            {displayOrderIdResched}
                                                        </div>
                                                        {isLegacyResched && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Legacy</span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                            <CalendarIcon />
                                                            Rescheduled
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 text-sm">{productName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-gray-900 text-sm">{customerName}</div>
                                                        <div className="text-sm text-gray-500">{customerPhone}</div>
                                                        {customerEmail !== 'N/A' && (
                                                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{customerEmail}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">
                                                        ₹{price.toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {previousPickupDate ? (
                                                        <div className="space-y-1">
                                                            <div className="text-sm text-gray-500 line-through">
                                                                {previousPickupDate.toLocaleDateString('en-IN', { 
                                                                    weekday: 'short',
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                            {request.previousPickupTime && (
                                                                <div className="text-xs text-gray-400 line-through">
                                                                    {request.previousPickupTime}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {newPickupDate ? (
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-orange-700 text-sm">
                                                                {newPickupDate.toLocaleDateString('en-IN', { 
                                                                    weekday: 'short',
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                            {request.pickupTime && (
                                                                <div className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block">
                                                                    {request.pickupTime}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {rescheduledAt ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-lg">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            <span className="text-sm text-orange-700">
                                                                {rescheduledAt.toLocaleDateString('en-IN', { 
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={status}
                                                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                        className={`text-xs font-semibold rounded-lg px-3 py-1.5 border ${statusConfig.bg} ${statusConfig.text} focus:ring-2 focus:ring-brand-blue-500 outline-none cursor-pointer transition-all`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="hold">Hold</option>
                                                        <option value="verification">Verification</option>
                                                        <option value="reject">Reject</option>
                                                        <option value="suspect">Suspect</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                {rescheduledSorted.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-medium">No rescheduled orders</p>
                                                <p className="text-gray-400 text-sm mt-1">All orders are on their original schedule</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cancelled Orders Tab — real-time */}
            {activeTab === 'cancelled' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircleIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-red-800">Cancelled Orders</h2>
                                <p className="text-sm text-red-600">Updates in real time</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Pickup</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cancelled On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {cancelledRequests.map((request) => {
                                        const customerName = request.customer?.name || request.userName || 'N/A'
                                        const customerPhone = request.customer?.phone || request.userPhone || 'N/A'
                                        const price = request.price || 0
                                        const pickupDate = request.pickupDate ? new Date(request.pickupDate) : null
                                        const cancelledDate = request.updatedAt 
                                            ? (request.updatedAt as any).toDate?.() || new Date(request.updatedAt as any)
                                            : null
                                        const isCustomOrderIdCanc = (id: string | null | undefined) => id && /^[A-Z]{2}\d/.test(id)
                                        const displayOrderIdCanc = request.orderId || (isCustomOrderIdCanc(request.valuationId) ? request.valuationId : null) || request.id
                                        const isLegacyCanc = !request.orderId && !isCustomOrderIdCanc(request.valuationId)

                                        return (
                                            <tr key={request.id} className="hover:bg-red-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-mono ${isLegacyCanc ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                            {displayOrderIdCanc}
                                                        </div>
                                                        {isLegacyCanc && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Legacy</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 text-sm">{request.productName || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 text-sm">{customerName}</div>
                                                    <div className="text-sm text-gray-500">{customerPhone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900">
                                                        ₹{price.toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {pickupDate ? (
                                                        <div className="space-y-1">
                                                            <div className="text-sm text-gray-700">
                                                                {pickupDate.toLocaleDateString('en-IN', { 
                                                                    weekday: 'short',
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                            {request.pickupTime && (
                                                                <div className="text-xs text-gray-500">{request.pickupTime}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {cancelledDate ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-100 rounded-lg">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                            <span className="text-sm text-red-700">
                                                                {cancelledDate.toLocaleDateString('en-IN', { 
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {cancelledRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No cancelled orders</p>
                                                    <p className="text-gray-400 text-sm mt-1">Great! All orders are active</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && <AnalyticsDashboard />}

            {/* Assessment view modal */}
            <AssessmentViewModal
                isOpen={!!assessmentModalRequest}
                onClose={() => setAssessmentModalRequest(null)}
                assessmentAnswers={
                    assessmentModalRequest?.assessmentAnswers ||
                    (assessmentModalRequest?.device?.assessmentAnswers as Record<string, unknown> | undefined)
                }
                valuationId={assessmentModalRequest?.valuationId ?? undefined}
                orderId={
                    assessmentModalRequest
                        ? (assessmentModalRequest.orderId ||
                            (/^[A-Z]{2}\d/.test(assessmentModalRequest.valuationId || '')
                                ? assessmentModalRequest.valuationId || undefined
                                : undefined) ||
                            assessmentModalRequest.id)
                        : undefined
                }
                productName={assessmentModalRequest?.productName || assessmentModalRequest?.device?.productName}
            />
        </div>
    )
}
