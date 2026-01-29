'use client'

import { useEffect, useState } from 'react'
import { getAllProducts, getAllPickupRequests, updatePickupRequest, getUserValuationsLegacy, type Product, type PickupRequest, type Valuation } from '@/lib/firebase/database'
import ProductFormModal from '@/components/admin/ProductFormModal'
import PricingCalculator from '@/components/admin/PricingCalculator'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

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
    const [rescheduledRequests, setRescheduledRequests] = useState<PickupRequest[]>([])
    const [cancelledRequests, setCancelledRequests] = useState<PickupRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [pickupLoading, setPickupLoading] = useState(false)
    const [rescheduledLoading, setRescheduledLoading] = useState(false)
    const [cancelledLoading, setCancelledLoading] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const data = await getAllProducts()
            setProducts(data)
        } catch (error) {
            console.error('Error fetching products:', error)
            alert('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const fetchPickupRequests = async () => {
        try {
            setPickupLoading(true)
            const data = await getAllPickupRequests()
            
            // Filter out cancelled requests (they show in the Cancelled Orders tab)
            const activeRequests = data.filter(request => request.status !== 'cancelled')
            
            // Try to link pickup requests to valuations if valuationId is missing
            const requestsWithValuationId = await Promise.all(
                activeRequests.map(async (request) => {
                    if (request.valuationId) {
                        return request
                    }
                    
                    try {
                        const customerPhone = request.customer?.phone?.replace(/\D/g, '') || request.userPhone?.replace(/\D/g, '') || ''
                        if (customerPhone.length === 10) {
                            // Simplified matching - return as-is for now
                        }
                    } catch (error) {
                        console.warn('Error trying to match valuation:', error)
                    }
                    
                    return request
                })
            )
            
            setPickupRequests(requestsWithValuationId)
        } catch (error) {
            console.error('Error fetching pickup requests:', error)
            alert('Failed to load pickup requests')
        } finally {
            setPickupLoading(false)
        }
    }

    const handleStatusChange = async (requestId: string, newStatus: string) => {
        try {
            console.log('Updating status in Firebase:', requestId, newStatus)
            await updatePickupRequest(requestId, { status: newStatus as any })
            console.log('Status updated successfully in Firebase')
            await fetchPickupRequests()
        } catch (error) {
            console.error('Error updating status in Firebase:', error)
            alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
    }

    const handleRemarksChange = async (requestId: string, remarks: string) => {
        try {
            await updatePickupRequest(requestId, { remarks })
            await fetchPickupRequests()
        } catch (error) {
            console.error('Error updating remarks:', error)
            alert('Failed to update remarks')
        }
    }

    const fetchRescheduledRequests = async () => {
        try {
            setRescheduledLoading(true)
            const data = await getAllPickupRequests()
            // Filter for rescheduled requests that are not cancelled
            const rescheduled = data.filter(request => request.rescheduled === true && request.status !== 'cancelled')
            // Sort by rescheduledAt date (newest first)
            rescheduled.sort((a, b) => {
                const aDate = a.rescheduledAt instanceof Date 
                    ? a.rescheduledAt.getTime() 
                    : (a.rescheduledAt as any)?.toDate?.()?.getTime() || 0
                const bDate = b.rescheduledAt instanceof Date 
                    ? b.rescheduledAt.getTime() 
                    : (b.rescheduledAt as any)?.toDate?.()?.getTime() || 0
                return bDate - aDate
            })
            setRescheduledRequests(rescheduled)
        } catch (error) {
            console.error('Error fetching rescheduled requests:', error)
            alert('Failed to load rescheduled orders')
        } finally {
            setRescheduledLoading(false)
        }
    }

    const fetchCancelledRequests = async () => {
        try {
            setCancelledLoading(true)
            const data = await getAllPickupRequests()
            const cancelled = data.filter(request => request.status === 'cancelled')
            setCancelledRequests(cancelled)
        } catch (error) {
            console.error('Error fetching cancelled requests:', error)
            alert('Failed to load cancelled orders')
        } finally {
            setCancelledLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        if (activeTab === 'pickup') {
            fetchPickupRequests()
        } else if (activeTab === 'rescheduled') {
            fetchRescheduledRequests()
        } else if (activeTab === 'cancelled') {
            fetchCancelledRequests()
        }
    }, [activeTab])

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
        return matchesSearch && matchesCategory
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

    // Get unique categories for filter
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]

    // Calculate stats
    const pendingPickups = pickupRequests.filter(r => r.status === 'pending').length
    const completedPickups = pickupRequests.filter(r => r.status === 'completed').length
    const totalProducts = products.length

    const rescheduledCount = rescheduledRequests.length

    const tabs = [
        { id: 'products' as const, label: 'Product List', icon: PackageIcon, count: totalProducts },
        { id: 'calculator' as const, label: 'Price Calculator', icon: CalculatorIcon },
        { id: 'pickup' as const, label: 'Pickup Requests', icon: TruckIcon, count: pickupRequests.length, highlight: pendingPickups > 0 },
        { id: 'rescheduled' as const, label: 'Rescheduled', icon: CalendarIcon, count: rescheduledCount, warning: rescheduledCount > 0 },
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
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Products Management</h1>
                        <p className="text-brand-blue-200 mt-1">Manage your inventory, pricing, and pickup requests</p>
                    </div>
                    {activeTab === 'products' && (
                        <button
                            onClick={handleAddNew}
                            className="inline-flex items-center gap-2 bg-white text-brand-blue-900 px-5 py-2.5 rounded-xl hover:bg-brand-blue-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Product
                        </button>
                    )}
                    {activeTab === 'pickup' && (
                        <button
                            onClick={fetchPickupRequests}
                            className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
                        >
                            <RefreshIcon />
                            Refresh
                        </button>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Total Products</p>
                        <p className="text-2xl font-bold text-white mt-1">{totalProducts}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-brand-blue-200 text-sm">Active Pickups</p>
                        <p className="text-2xl font-bold text-white mt-1">{pickupRequests.length}</p>
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
                        onProductSaved={fetchProducts}
                    />
                </div>
            )}

            {activeTab === 'calculator' && <PricingCalculator />}

            {/* Pickup Requests Tab */}
            {activeTab === 'pickup' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {pickupLoading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
                            <p className="mt-4 text-gray-500 text-sm">Loading pickup requests...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Request ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Pickup Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pickupRequests.map((request) => {
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
                                        const orderId = request.valuationId || request.id
                                        const hasOrderId = !!request.valuationId
                                        const statusConfig = getStatusConfig(status)

                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-mono ${hasOrderId ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                                            {orderId?.substring(0, 16)}...
                                                        </div>
                                                        {!hasOrderId && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                Legacy
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
                                    {pickupRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <TruckIcon />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No pickup requests found</p>
                                                    <p className="text-gray-400 text-sm mt-1">New requests will appear here</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Rescheduled Orders Tab */}
            {activeTab === 'rescheduled' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <CalendarIcon />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-orange-800">Rescheduled Orders</h2>
                                    <p className="text-sm text-orange-600">Orders that have been rescheduled by customers</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchRescheduledRequests}
                                className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition-all duration-200 font-medium text-sm"
                            >
                                <RefreshIcon />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {rescheduledLoading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600"></div>
                            <p className="mt-4 text-gray-500 text-sm">Loading rescheduled orders...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">Request ID</th>
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
                                    {rescheduledRequests.map((request) => {
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
                                        const orderId = request.valuationId || request.id
                                        const statusConfig = getStatusConfig(status)

                                        return (
                                            <tr key={request.id} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-mono text-gray-700">
                                                            {orderId?.substring(0, 16)}...
                                                        </div>
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
                                    {rescheduledRequests.length === 0 && (
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
                    )}
                </div>
            )}

            {/* Cancelled Orders Tab */}
            {activeTab === 'cancelled' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircleIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-red-800">Cancelled Orders</h2>
                                <p className="text-sm text-red-600">Orders that have been cancelled by customers</p>
                            </div>
                        </div>
                    </div>

                    {cancelledLoading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
                            <p className="mt-4 text-gray-500 text-sm">Loading cancelled orders...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
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
                                        const orderId = request.valuationId || request.id

                                        return (
                                            <tr key={request.id} className="hover:bg-red-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-mono text-gray-700">
                                                        {orderId?.substring(0, 16)}...
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
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
        </div>
    )
}
