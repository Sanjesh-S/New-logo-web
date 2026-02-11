'use client'

import { useState, useEffect } from 'react'
import { Product, updateProduct, createProduct, type ProductVariant } from '@/lib/firebase/database'
import { isFixedLensCamera } from '@/lib/utils/fixedLensCameras'

function variantIdFromLabel(label: string): string {
  return label.replace(/\s+/g, '').toLowerCase().replace(/gb|tb/gi, (m) => m.toLowerCase())
}

interface ProductFormModalProps {
    product?: Product | null
    isOpen: boolean
    onClose: () => void
    onProductSaved: () => void
}

// Icons
const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const PackageIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
)

const ImageIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

export default function ProductFormModal({
    product,
    isOpen,
    onClose,
    onProductSaved,
}: ProductFormModalProps) {
    const [loading, setLoading] = useState(false)
    const isEditing = !!product

    const initialFormState = {
        brand: '',
        modelName: '',
        category: 'Phone',
        basePrice: 0,
        imageUrl: '',
        variants: [] as ProductVariant[],
    }

    const [formData, setFormData] = useState(initialFormState)

    // Reset or Populate form when modal opens or product changes
    useEffect(() => {
        if (product) {
            const isCameraCategory = product.category === 'DSLR' || product.category === 'Camera'
            const isFixedLens = isCameraCategory && isFixedLensCamera(product.modelName || '')
            
            setFormData({
                brand: product.brand || '',
                modelName: product.modelName || '',
                category: product.category || 'Phone',
                basePrice: product.basePrice || 0,
                imageUrl: product.imageUrl || '',
                // Clear variants for fixed-lens cameras
                variants: (isFixedLens ? [] : (product.variants && product.variants.length > 0 ? [...product.variants] : [])),
            })
        } else {
            setFormData(initialFormState)
        }
    }, [product, isOpen])
    
    // Clear variants when model name changes and it's detected as fixed-lens
    useEffect(() => {
        const isCameraCategory = formData.category === 'DSLR' || formData.category === 'Camera'
        const isFixedLens = isCameraCategory && isFixedLensCamera(formData.modelName)
        
        if (isFixedLens && formData.variants.length > 0) {
            setFormData(prev => ({ ...prev, variants: [] }))
        }
    }, [formData.modelName, formData.category])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Check if this is a fixed-lens camera
            const isCameraCategory = formData.category === 'DSLR' || formData.category === 'Camera'
            const isFixedLens = isCameraCategory && isFixedLensCamera(formData.modelName)
            
            // Validate and prepare variants (clear for fixed-lens cameras)
            const validVariants = isFixedLens ? [] : formData.variants
                .filter(v => v.label.trim() && v.basePrice > 0)
                .map(v => ({
                    id: variantIdFromLabel(v.label) || v.id,
                    label: v.label.trim(),
                    basePrice: v.basePrice,
                }))
            const basePrice = validVariants.length > 0
              ? Math.max(...validVariants.map(v => v.basePrice))
              : Number(formData.basePrice)
            const productData = {
                brand: formData.brand,
                modelName: formData.modelName,
                category: formData.category,
                basePrice,
                imageUrl: formData.imageUrl,
                variants: validVariants.length > 0 ? validVariants : [],
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


    const categories = [
        { value: 'Phone', label: 'Phone', icon: '📱' },
        { value: 'Laptop', label: 'Laptop', icon: '💻' },
        { value: 'iPad', label: 'iPad', icon: '📲' },
        { value: 'DSLR', label: 'Camera (DSLR)', icon: '📷' },
        { value: 'Lens', label: 'Lens', icon: '🔭' },
        { value: 'Tablet', label: 'Tablet', icon: '📱' },
        { value: 'Smartwatch', label: 'Smartwatch', icon: '⌚' },
    ]

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div 
                className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                                <PackageIcon />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {isEditing ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                {isEditing && (
                                    <p className="text-brand-blue-200 text-sm">{product.modelName}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Image Preview */}
                        {formData.imageUrl && (
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                                    <img 
                                        src={formData.imageUrl} 
                                        alt="Product preview" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Brand & Model Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                    placeholder="e.g., Apple"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none cursor-pointer"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Model Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Model Name
                            </label>
                            <input
                                type="text"
                                value={formData.modelName}
                                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                placeholder="e.g., MacBook Air M1 2020"
                                required
                            />
                        </div>

                        {/* Pricing Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 bg-brand-blue-100 rounded-lg flex items-center justify-center text-brand-blue-600 text-xs">₹</span>
                                Price
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Product Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                                        <input
                                            type="number"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-white"
                                            required
                                            min="0"
                                        />
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    All price calculations and modifiers will be applied to this price
                                </p>
                            </div>
                        </div>

                        {/* Info message for fixed-lens cameras */}
                        {(() => {
                            const isCameraCategory = formData.category === 'DSLR' || formData.category === 'Camera'
                            const isFixedLens = isCameraCategory && isFixedLensCamera(formData.modelName)
                            return isFixedLens
                        })() && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 mb-1">Fixed-Lens Camera Detected</p>
                                        <p className="text-xs text-blue-700">
                                            This camera model has a fixed lens, so variant selection (Body Only / With Kit Lens) is not applicable. The product will use a single price.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Variants (Phone / iPad / DSLR / Camera) - Hidden for fixed-lens cameras */}
                        {(() => {
                            const isCameraCategory = formData.category === 'DSLR' || formData.category === 'Camera'
                            const isFixedLens = isCameraCategory && isFixedLensCamera(formData.modelName)
                            const showVariants = (formData.category === 'Phone' || formData.category === 'iPad' || formData.category === 'Lens') || (isCameraCategory && !isFixedLens)
                            return showVariants
                        })() && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    Variants {formData.category === 'DSLR' || formData.category === 'Camera' ? '(e.g. Body Only, With Kit Lens)' : formData.category === 'Lens' ? '(e.g. different focal lengths)' : '(e.g. storage: 256 GB, 512 GB)'}
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    {formData.category === 'DSLR' || formData.category === 'Camera' 
                                        ? 'Add camera variants (e.g., Body Only, With Kit Lens). Each variant has its own price on the product page.'
                                        : formData.category === 'Lens'
                                        ? 'Add lens variants (e.g., different focal lengths or mounts). Each variant has its own price on the product page.'
                                        : 'Add storage or other variants. Each variant has its own price on the product page.'}
                                </p>
                                {formData.variants.map((v, index) => (
                                    <div key={v.id} className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-white rounded-lg border border-gray-100">
                                        <input
                                            type="text"
                                            value={v.label}
                                            onChange={(e) => {
                                                const label = e.target.value
                                                const id = variantIdFromLabel(label) || v.id
                                                setFormData(prev => ({
                                                    ...prev,
                                                    variants: prev.variants.map((x, i) =>
                                                        i === index ? { ...x, label, id } : x
                                                    ),
                                                }))
                                            }}
                                            placeholder={formData.category === 'DSLR' || formData.category === 'Camera' ? "e.g. Body Only" : formData.category === 'Lens' ? "e.g. 50mm f/1.8" : "e.g. 256 GB"}
                                            className="flex-1 min-w-[80px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <div className="relative flex-shrink-0">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                            <input
                                                type="number"
                                                value={v.basePrice}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    variants: prev.variants.map((x, i) =>
                                                        i === index ? { ...x, basePrice: Number(e.target.value) || 0 } : x
                                                    ),
                                                }))}
                                                placeholder="Price"
                                                min="0"
                                                className="w-24 pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                variants: prev.variants.filter((_, i) => i !== index),
                                            }))}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                            aria-label="Remove variant"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        variants: [...prev.variants, {
                                            id: `variant-${Date.now()}`,
                                            label: '',
                                            basePrice: 0,
                                        }],
                                    }))}
                                    className="mt-2 px-3 py-2 text-sm font-medium text-brand-blue-700 bg-brand-blue-50 rounded-lg hover:bg-brand-blue-100"
                                >
                                    + Add variant
                                </button>
                            </div>
                        )}

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Image URL
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <ImageIcon />
                                </div>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">Optional: Add a product image URL</p>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue-900 to-brand-blue-700 rounded-xl hover:from-brand-blue-800 hover:to-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-blue-900/20 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {isEditing ? 'Update Product' : 'Save Product'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
