'use client'

import { useState } from 'react'
import { Product, updateProduct } from '@/lib/firebase/database'

interface EditProductModalProps {
    product: Product
    isOpen: boolean
    onClose: () => void
    onProductUpdated: () => void
}

export default function EditProductModal({
    product,
    isOpen,
    onClose,
    onProductUpdated,
}: EditProductModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        basePrice: product.basePrice,
        internalBasePrice: product.internalBasePrice || product.basePrice * 0.5,
        imageUrl: product.imageUrl || '',
    })

    // Update form data when product changes
    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateProduct(product.id, {
                basePrice: Number(formData.basePrice),
                internalBasePrice: Number(formData.internalBasePrice),
                imageUrl: formData.imageUrl,
            })
            onProductUpdated()
            onClose()
        } catch (error) {
            console.error('Error updating product:', error)
            alert('Failed to update product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Edit Product: {product.modelName}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Price (₹)</label>
                        <input
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Internal Base Price (₹)</label>
                        <div className="text-xs text-gray-500 mb-1">Used for valuation calculations</div>
                        <input
                            type="number"
                            value={formData.internalBasePrice}
                            onChange={(e) => setFormData({ ...formData, internalBasePrice: Number(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image URL</label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
