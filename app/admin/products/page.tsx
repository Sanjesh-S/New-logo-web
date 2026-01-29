'use client'

import { useEffect, useState } from 'react'
import { getAllProducts, getAllPickupRequests, updatePickupRequest, getUserValuationsLegacy, type Product, type PickupRequest, type Valuation } from '@/lib/firebase/database'
import ProductFormModal from '@/components/admin/ProductFormModal'
import PricingCalculator from '@/components/admin/PricingCalculator'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export default function AdminProductsPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'calculator' | 'pickup' | 'cancelled' | 'analytics'>('products')
    const [products, setProducts] = useState<Product[]>([])
    const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
    const [cancelledRequests, setCancelledRequests] = useState<PickupRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [pickupLoading, setPickupLoading] = useState(false)
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
            // This helps with existing pickup requests created before valuationId was added
            const requestsWithValuationId = await Promise.all(
                activeRequests.map(async (request) => {
                    // If already has valuationId, return as is
                    if (request.valuationId) {
                        return request
                    }
                    
                    // Try to find matching valuation by phone number and product/price
                    try {
                        // Get all valuations (we'll filter client-side)
                        // Note: This is a simplified approach - in production you might want to query by phone
                        const customerPhone = request.customer?.phone?.replace(/\D/g, '') || request.userPhone?.replace(/\D/g, '') || ''
                        if (customerPhone.length === 10) {
                            // Try to find valuation by matching phone and approximate price/date
                            // For now, we'll just return the request as-is
                            // A more sophisticated matching could be added later
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
            // Refresh the list to show updated status
            await fetchPickupRequests()
        } catch (error) {
            console.error('Error updating status in Firebase:', error)
            alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }
    }

    const handleRemarksChange = async (requestId: string, remarks: string) => {
        try {
            await updatePickupRequest(requestId, { remarks })
            // Optionally refresh to show updated timestamp
            await fetchPickupRequests()
        } catch (error) {
            console.error('Error updating remarks:', error)
            alert('Failed to update remarks')
        }
    }

    const fetchCancelledRequests = async () => {
        try {
            setCancelledLoading(true)
            const data = await getAllPickupRequests()
            // Filter only cancelled requests
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-900"></div>
            </div>
        )
    }

    // Get unique categories for filter
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
                    {activeTab === 'products' && (
                        <button
                            onClick={handleAddNew}
                            className="bg-brand-blue-900 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-800 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Product
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`${activeTab === 'products'
                                    ? 'border-brand-blue-900 text-brand-blue-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Product List
                        </button>
                        <button
                            onClick={() => setActiveTab('calculator')}
                            className={`${activeTab === 'calculator'
                                    ? 'border-brand-blue-900 text-brand-blue-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Price Calculator
                        </button>
                        <button
                            onClick={() => setActiveTab('pickup')}
                            className={`${activeTab === 'pickup'
                                    ? 'border-brand-blue-900 text-brand-blue-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Pickup Requests
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`${activeTab === 'cancelled'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Cancelled Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`${activeTab === 'analytics'
                                    ? 'border-brand-blue-900 text-brand-blue-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Analytics
                        </button>
                    </nav>
                </div>
            </div>

            {activeTab === 'products' ? (
                <>
                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by name or brand..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Display Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Internal Base
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {product.imageUrl ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={product.imageUrl}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                                                No Img
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{product.modelName}</div>
                                                        <div className="text-sm text-gray-500">{product.brand}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₹{product.basePrice.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₹{product.internalBasePrice?.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="text-brand-blue-600 hover:text-brand-blue-900 font-medium"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                                No products found matching your search.
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
                </>
            ) : activeTab === 'calculator' ? (
                <PricingCalculator />
            ) : (
                <>
                    {/* Pickup Requests Table */}
                    {pickupLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-900"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Request ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pickup Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Remarks
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pickupRequests.map((request) => {
                                            const createdAt = request.createdAt instanceof Date 
                                                ? request.createdAt 
                                                : (request.createdAt as any)?.toDate?.() || new Date()
                                            
                                            // Handle different data structures
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
                                            
                                            // Use valuationId (Order ID) if available, otherwise use pickup request ID
                                            const orderId = request.valuationId || request.id
                                            const hasOrderId = !!request.valuationId
                                            return (
                                                <tr key={request.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`text-sm font-mono break-all ${hasOrderId ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                                            {orderId}
                                                        </div>
                                                        {hasOrderId && request.valuationId !== request.id && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                Request: {request.id.substring(0, 8)}...
                                                            </div>
                                                        )}
                                                        {!hasOrderId && (
                                                            <div className="text-xs text-yellow-600 mt-1 italic font-medium">
                                                                ⚠ No Order ID linked (Legacy request)
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {createdAt.toLocaleDateString('en-IN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {productName}
                                                        </div>
                                                        {request.device?.accessories && request.device.accessories.length > 0 && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Accessories: {request.device.accessories.join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{customerName}</div>
                                                        <div className="text-sm text-gray-500">{customerPhone}</div>
                                                        {customerEmail !== 'N/A' && (
                                                            <div className="text-sm text-gray-500">{customerEmail}</div>
                                                        )}
                                                        {(address || city || state) && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {address && `${address}, `}
                                                                {city && `${city}, `}
                                                                {state}
                                                                {pincode && ` - ${pincode}`}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            ₹{price.toLocaleString('en-IN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {pickupDate ? (
                                                            <>
                                                                <div className="text-sm text-gray-900">
                                                                    {pickupDate.toLocaleDateString('en-IN', { 
                                                                        weekday: 'short',
                                                                        day: 'numeric',
                                                                        month: 'short'
                                                                    })}
                                                                </div>
                                                                {request.pickupTime && (
                                                                    <div className="text-sm text-gray-500">{request.pickupTime}</div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-gray-400">Not set</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <select
                                                            value={status}
                                                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                            className={`text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-brand-blue-500 outline-none cursor-pointer ${
                                                                status === 'pending' 
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : status === 'hold'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : status === 'verification'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : status === 'reject'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : status === 'suspect'
                                                                    ? 'bg-pink-100 text-pink-800'
                                                                    : status === 'confirmed'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="hold">Hold</option>
                                                            <option value="verification">Verification</option>
                                                            <option value="reject">Reject</option>
                                                            <option value="suspect">Suspect</option>
                                                            <option value="confirmed">Confirmed</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <textarea
                                                            defaultValue={request.remarks || ''}
                                                            onBlur={(e) => handleRemarksChange(request.id, e.target.value)}
                                                            placeholder="Add remarks..."
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none resize-none"
                                                            rows={2}
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {pickupRequests.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                                    No pickup requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Cancelled Orders Tab */}
            {activeTab === 'cancelled' && (
                <>
                    {cancelledLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                                <h2 className="text-lg font-semibold text-red-800">Cancelled Orders</h2>
                                <p className="text-sm text-red-600 mt-1">Orders that have been cancelled by customers</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Pickup Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
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
                                                <tr key={request.id} className="hover:bg-red-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-mono text-gray-900">
                                                            {orderId?.substring(0, 12)}...
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{request.productName || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{customerName}</div>
                                                        <div className="text-sm text-gray-500">{customerPhone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            ₹{price.toLocaleString('en-IN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {pickupDate ? (
                                                            <>
                                                                <div className="text-sm text-gray-900">
                                                                    {pickupDate.toLocaleDateString('en-IN', { 
                                                                        weekday: 'short',
                                                                        day: 'numeric',
                                                                        month: 'short'
                                                                    })}
                                                                </div>
                                                                {request.pickupTime && (
                                                                    <div className="text-sm text-gray-500">{request.pickupTime}</div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-gray-400">Not set</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {cancelledDate ? (
                                                            <div className="text-sm text-red-600">
                                                                {cancelledDate.toLocaleDateString('en-IN', { 
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-400">N/A</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {cancelledRequests.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                                    No cancelled orders found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <AnalyticsDashboard />
            )}
        </div>
    )
}
