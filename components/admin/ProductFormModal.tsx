'use client'

import { useState, useEffect } from 'react'
import { Product, updateProduct, createProduct } from '@/lib/firebase/database'

interface ProductFormModalProps {
    product?: Product | null
    isOpen: boolean
    onClose: () => void
    onProductSaved: () => void
}

export default function ProductFormModal({
    product,
    isOpen,
    onClose,
    onProductSaved,
}: ProductFormModalProps) {
    const [loading, setLoading] = useState(false)
    const isEditing = !!product

    // Initial State
    const initialFormState = {
        brand: '',
        modelName: '',
        category: 'Phone',
        basePrice: 0,
        internalBasePrice: 0,
        imageUrl: '',
    }

    const [formData, setFormData] = useState(initialFormState)

    // Reset or Populate form when modal opens or product changes
    useEffect(() => {
        if (product) {
            setFormData({
                brand: product.brand || '',
                modelName: product.modelName || '',
                category: product.category || 'Phone',
                basePrice: product.basePrice || 0,
                internalBasePrice: product.internalBasePrice || (product.basePrice * 0.5),
                imageUrl: product.imageUrl || '',
            })
        } else {
            setFormData(initialFormState)
        }
    }, [product, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const productData = {
                brand: formData.brand,
                modelName: formData.modelName,
                category: formData.category,
                basePrice: Number(formData.basePrice),
                internalBasePrice: Number(formData.internalBasePrice),
                imageUrl: formData.imageUrl,
            }

            if (isEditing && product) {
                await updateProduct(product.id, productData)
            } else {
                await createProduct(productData)
            }

            onProductSaved()
            onClose()
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Failed to save product')
        } finally {
            setLoading(false)
        }
    }

    // Auto-calculate internal base price if not manually set
    const handleBasePriceChange = (value: number) => {
        const internal = value * 0.5
        setFormData(prev => ({
            ...prev,
            basePrice: value,
            // Only auto-update internal price if we are creating new or it matches the 50% logic
            internalBasePrice: prev.internalBasePrice === 0 || prev.internalBasePrice === prev.basePrice * 0.5 ? internal : prev.internalBasePrice
        }))
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {isEditing ? `Edit Product: ${product.modelName}` : 'Add New Product'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                        <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                        />
                    </div>

                    {/* Model Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Model Name</label>
                        <input
                            type="text"
                            value={formData.modelName}
                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                        >
                            <option value="Phone">Phone</option>
                            <option value="Laptop">Laptop</option>
                            <option value="iPad">iPad</option>
                            <option value="DSLR">Camera (DSLR)</option>
                            <option value="Lens">Lens</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Smartwatch">Smartwatch</option>
                        </select>
                    </div>

                    {/* Base Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Price (₹)</label>
                        <input
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => handleBasePriceChange(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                            min="0"
                        />
                    </div>

                    {/* Internal Base Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Internal Base Price (₹)</label>
                        <div className="text-xs text-gray-500 mb-1">Used for valuation calculations (Default: 50% of Display Price)</div>
                        <input
                            type="number"
                            value={formData.internalBasePrice}
                            onChange={(e) => setFormData({ ...formData, internalBasePrice: Number(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            required
                            min="0"
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Image URL</label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-lime focus:ring-brand-lime sm:text-sm p-2 border"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
                            {loading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
