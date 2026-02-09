'use client'

import { useState, useEffect } from 'react'
import { getAllProducts, type Product, getPricingRules, savePricingRules, saveProductPricingRules, getProductById, saveProductPricingToCollection, getProductPricingFromCollection } from '@/lib/firebase/database'
import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'
import { getCurrentUser } from '@/lib/firebase/auth'
import ProductFormModal from './ProductFormModal'

// Icons
const SaveIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

const ChevronUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
)

interface CollapsibleSectionProps {
    title: string
    description?: string
    children: React.ReactNode
    defaultOpen?: boolean
    badge?: string
    badgeColor?: string
}

function CollapsibleSection({ title, description, children, defaultOpen = false, badge, badgeColor = 'bg-brand-blue-100 text-brand-blue-700' }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    {badge && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                            {badge}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-100">
                    {description && (
                        <p className="text-sm text-gray-500 mt-4 mb-4">{description}</p>
                    )}
                    <div className="mt-4">{children}</div>
                </div>
            )}
        </div>
    )
}

interface PricingInputProps {
    label: string
    value: number
    onChange: (value: number) => void
    description?: string
    onBulkUpdate?: (productIds: string[]) => void
    category?: string
    brand?: string
    allProducts?: Product[]
}

interface BulkUpdateModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (selectedProductIds: string[]) => void
    products: Product[]
    category?: string
    brand?: string
    fieldLabel: string
    currentValue: number
}

interface PowerOnInputProps {
    label: string
    value: number
    onChange: (value: number) => void
    percentage: number | null
    onPercentageChange: (percentage: number | null) => void
    description?: string
}

function PowerOnInput({ label, value, onChange, percentage, onPercentageChange, description }: PowerOnInputProps) {
    const [displayValue, setDisplayValue] = useState<string>(value.toString())
    const [usePercentage, setUsePercentage] = useState<boolean>(percentage !== null)
    
    // Sync display value when prop value changes
    useEffect(() => {
        if (!usePercentage) {
            setDisplayValue(value.toString())
        }
    }, [value, usePercentage])
    
    // Sync percentage state
    useEffect(() => {
        setUsePercentage(percentage !== null)
    }, [percentage])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        setDisplayValue(inputValue)
        
        if (inputValue === '' || inputValue === '-') {
            onChange(0)
        } else {
            const numValue = parseInt(inputValue, 10)
            if (!isNaN(numValue)) {
                onChange(numValue)
            }
        }
    }
    
    const handleBlur = () => {
        if (displayValue === '' || displayValue === '-') {
            setDisplayValue('0')
            onChange(0)
        } else {
            const numValue = parseInt(displayValue, 10)
            if (isNaN(numValue)) {
                setDisplayValue('0')
                onChange(0)
            } else {
                setDisplayValue(numValue.toString())
            }
        }
    }
    
    const handlePercentageToggle = (usePercent: boolean) => {
        setUsePercentage(usePercent)
        if (usePercent) {
            // Switch to percentage mode - set default to 75% if not set
            onPercentageChange(percentage || 75)
        } else {
            // Switch to fixed amount mode
            onPercentageChange(null)
        }
    }
    
    const percentageOptions = []
    for (let i = 60; i <= 95; i += 5) {
        percentageOptions.push(i)
    }
    
    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
            
            {/* Toggle between percentage and fixed amount */}
            <div className="flex gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => handlePercentageToggle(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${
                        !usePercentage
                            ? 'bg-brand-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Fixed Amount
                </button>
                <button
                    type="button"
                    onClick={() => handlePercentageToggle(true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${
                        usePercentage
                            ? 'bg-brand-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Percentage
                </button>
            </div>
            
            {usePercentage ? (
                <div>
                    <select
                        value={percentage || 75}
                        onChange={(e) => onPercentageChange(parseInt(e.target.value, 10))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white"
                    >
                        {percentageOptions.map(percent => (
                            <option key={percent} value={percent}>{percent}%</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Deduction will be {percentage || 75}% of base price</p>
                </div>
            ) : (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={displayValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-white"
                    />
                </div>
            )}
        </div>
    )
}

function BulkUpdateModal({ isOpen, onClose, onConfirm, products, category, brand, fieldLabel, currentValue }: BulkUpdateModalProps) {
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
    
    // Filter products by category and brand
    const filteredProducts = products.filter(p => {
        const matchesCategory = !category || category === 'All' || p.category === category
        const matchesBrand = !brand || brand === 'All' || p.brand === brand
        return matchesCategory && matchesBrand
    }).sort((a, b) => a.modelName.localeCompare(b.modelName))
    
    const handleToggleProduct = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(productId)) {
                newSet.delete(productId)
            } else {
                newSet.add(productId)
            }
            return newSet
        })
    }
    
    const handleSelectAll = () => {
        if (selectedProductIds.size === filteredProducts.length) {
            setSelectedProductIds(new Set())
        } else {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
        }
    }
    
    const handleConfirm = () => {
        if (selectedProductIds.size > 0) {
            onConfirm(Array.from(selectedProductIds))
            setSelectedProductIds(new Set())
            onClose()
        }
    }
    
    if (!isOpen) return null
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Bulk Update: {fieldLabel}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Select products to apply value: <strong>₹{currentValue.toLocaleString('en-IN')}</strong>
                    </p>
                    {category && category !== 'All' && (
                        <p className="text-xs text-gray-500 mt-1">
                            Category: <strong>{category}</strong>
                            {brand && brand !== 'All' && <> • Brand: <strong>{brand}</strong></>}
                        </p>
                    )}
                </div>
                
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <button
                        onClick={handleSelectAll}
                        className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                    >
                        {selectedProductIds.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-600">
                        {selectedProductIds.size} of {filteredProducts.length} selected
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No products found for the selected category and brand.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.map(product => (
                                <label
                                    key={product.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.has(product.id)}
                                        onChange={() => handleToggleProduct(product.id)}
                                        className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900">{product.modelName}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {product.brand} • {product.category}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedProductIds.size === 0}
                        className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Apply to {selectedProductIds.size} Product{selectedProductIds.size !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    )
}

function PricingInput({ label, value, onChange, description, onBulkUpdate, category, brand, allProducts }: PricingInputProps) {
    const [displayValue, setDisplayValue] = useState<string>(value.toString())
    const [showBulkModal, setShowBulkModal] = useState(false)
    
    // Sync display value when prop value changes (from external updates)
    useEffect(() => {
        setDisplayValue(value.toString())
    }, [value])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        setDisplayValue(inputValue)
        
        // Allow empty string, otherwise parse as number
        if (inputValue === '' || inputValue === '-') {
            onChange(0)
        } else {
            const numValue = parseInt(inputValue, 10)
            if (!isNaN(numValue)) {
                onChange(numValue)
            }
        }
    }
    
    const handleBlur = () => {
        // On blur, ensure we have a valid number (default to 0 if empty)
        if (displayValue === '' || displayValue === '-') {
            setDisplayValue('0')
            onChange(0)
        } else {
            const numValue = parseInt(displayValue, 10)
            if (isNaN(numValue)) {
                setDisplayValue('0')
                onChange(0)
            } else {
                setDisplayValue(numValue.toString())
            }
        }
    }
    
    const handleBulkConfirm = (selectedProductIds: string[]) => {
        if (onBulkUpdate) {
            onBulkUpdate(selectedProductIds)
        }
    }
    
    return (
        <>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {onBulkUpdate && allProducts && (
                        <button
                            type="button"
                            onClick={() => setShowBulkModal(true)}
                            className="ml-2 p-1.5 text-gray-500 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded transition-colors"
                            title="Apply to multiple products"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
                {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={displayValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-white"
                    />
                </div>
            </div>
            
            {onBulkUpdate && allProducts && (
                <BulkUpdateModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    onConfirm={handleBulkConfirm}
                    products={allProducts}
                    category={category}
                    brand={brand}
                    fieldLabel={label}
                    currentValue={value}
                />
            )}
        </>
    )
}

export default function PricingCalculator() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [selectedBrand, setSelectedBrand] = useState<string>('All')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null) // null = product-level rules, string = variant-specific rules
    const [pricingRules, setPricingRules] = useState<PricingRules>(ZERO_PRICING_RULES)
    const [variantRules, setVariantRules] = useState<Record<string, PricingRules>>({}) // variantId -> PricingRules
    const [powerOnPercentage, setPowerOnPercentage] = useState<number | null>(null) // null = use fixed amount, number = percentage (60-95)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const productsData = await getAllProducts()
                setProducts(productsData)
            } catch (error) {
                console.error('Error loading products:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        const loadProductRules = async () => {
            if (!selectedProduct) {
                try {
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                } catch (error) {
                    console.error('Error loading global rules:', error)
                    setPricingRules(ZERO_PRICING_RULES)
                }
                return
            }

            try {
                const productPricingData = await getProductPricingFromCollection(selectedProduct.id)
                if (productPricingData?.pricingRules) {
                    setPricingRules(productPricingData.pricingRules)
                    // Load variant-specific rules if they exist
                    if (productPricingData.variantRules) {
                        setVariantRules(productPricingData.variantRules)
                    }
                    // Load powerOn percentage if set
                    if (productPricingData.powerOnPercentage !== undefined) {
                        setPowerOnPercentage(productPricingData.powerOnPercentage)
                    }
                    // Reset variant selection when loading new product
                    setSelectedVariantId(null)
                    return
                }

                const productWithRules = await getProductById(selectedProduct.id)
                if (productWithRules?.pricingRules) {
                    setPricingRules(productWithRules.pricingRules)
                } else {
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                }
                // Reset variant selection and variant rules when loading new product
                setSelectedVariantId(null)
                setVariantRules({})
                setPowerOnPercentage(null)
            } catch (error) {
                console.error('Error loading product rules:', error)
                try {
                    setPricingRules(await getPricingRules())
                } catch (e) {
                    console.error('Error loading global rules:', e)
                    setPricingRules(ZERO_PRICING_RULES)
                }
                setSelectedVariantId(null)
                setVariantRules({})
                setPowerOnPercentage(null)
            }
        }
        loadProductRules()
    }, [selectedProduct])

    // Update pricing rules when variant selection changes
    useEffect(() => {
        if (selectedVariantId && variantRules[selectedVariantId]) {
            // Load variant-specific rules
            setPricingRules(variantRules[selectedVariantId])
        } else if (selectedProduct) {
            // Load product-level rules
            const loadProductRules = async () => {
                try {
                    const productPricingData = await getProductPricingFromCollection(selectedProduct.id)
                    if (productPricingData?.pricingRules) {
                        setPricingRules(productPricingData.pricingRules)
                    } else {
                        const productWithRules = await getProductById(selectedProduct.id)
                        if (productWithRules?.pricingRules) {
                            setPricingRules(productWithRules.pricingRules)
                        } else {
                            const globalRules = await getPricingRules()
                            setPricingRules(globalRules)
                        }
                    }
                } catch (error) {
                    console.error('Error loading product rules:', error)
                }
            }
            loadProductRules()
        }
    }, [selectedVariantId, variantRules, selectedProduct])

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]
    const brands = selectedCategory === 'All' 
        ? ['All', ...Array.from(new Set(products.map(p => p.brand))).sort()]
        : ['All', ...Array.from(new Set(products.filter(p => p.category === selectedCategory).map(p => p.brand))).sort()]

    const filteredProducts = products
        .filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
            const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand
            return matchesCategory && matchesBrand
        })
        .sort((a, b) => a.modelName.localeCompare(b.modelName))

    const handleQuestionUpdate = (questionKey: keyof PricingRules['questions'], field: 'yes' | 'no', value: number) => {
        setPricingRules(prev => ({
            ...prev,
            questions: {
                ...prev.questions,
                [questionKey]: {
                    ...prev.questions[questionKey],
                    [field]: value
                }
            }
        }))
    }

    const handleConditionUpdate = (conditionType: string, key: string, value: number) => {
        setPricingRules(prev => ({
            ...prev,
            [conditionType]: {
                ...(prev as any)[conditionType],
                [key]: value
            }
        }))
    }

    // Helper function to get bulk update props for PricingInput
    const getBulkUpdateProps = (conditionType: string, key: string, currentValue: number) => {
        if (!selectedProduct) return {}
        return {
            onBulkUpdate: (productIds: string[]) => handleBulkConditionUpdate(conditionType, key, currentValue, productIds),
            category: selectedProduct.category,
            brand: selectedProduct.brand,
            allProducts: products
        }
    }

    // Helper function to get bulk update props for question inputs
    const getBulkQuestionProps = (questionKey: keyof PricingRules['questions'], field: 'yes' | 'no', currentValue: number) => {
        if (!selectedProduct) return {}
        return {
            onBulkUpdate: (productIds: string[]) => handleBulkQuestionUpdate(questionKey, field, currentValue, productIds),
            category: selectedProduct.category,
            brand: selectedProduct.brand,
            allProducts: products
        }
    }

    // Bulk update handlers
    const handleBulkQuestionUpdate = async (questionKey: keyof PricingRules['questions'], field: 'yes' | 'no', value: number, productIds: string[]) => {
        setSaving(true)
        setSaveMessage(null)
        try {
            const currentUser = getCurrentUser()
            const updatedBy = currentUser?.email || 'admin'
            
            // Update pricing rules for each selected product
            for (const productId of productIds) {
                const product = products.find(p => p.id === productId)
                if (!product) continue
                
                // Load existing pricing rules for the product
                let existingRules: PricingRules = ZERO_PRICING_RULES
                try {
                    const productPricingData = await getProductPricingFromCollection(productId)
                    if (productPricingData?.pricingRules) {
                        existingRules = productPricingData.pricingRules
                    } else {
                        const productData = await getProductById(productId)
                        if (productData?.pricingRules) {
                            existingRules = productData.pricingRules
                        }
                    }
                } catch (error) {
                    console.error(`Error loading rules for product ${productId}:`, error)
                }
                
                // Update the specific question field
                const updatedRules: PricingRules = {
                    ...existingRules,
                    questions: {
                        ...existingRules.questions,
                        [questionKey]: {
                            ...existingRules.questions[questionKey],
                            [field]: value
                        }
                    }
                }
                
                // Save updated rules
                await saveProductPricingRules(productId, updatedRules)
                await saveProductPricingToCollection(productId, product, updatedRules, updatedBy)
            }
            
            setSaveMessage({ 
                type: 'success', 
                text: `Updated "${questionKey}" for ${productIds.length} product${productIds.length !== 1 ? 's' : ''}!` 
            })
            setTimeout(() => setSaveMessage(null), 3000)
        } catch (error) {
            console.error('Error in bulk update:', error)
            setSaveMessage({ type: 'error', text: 'Failed to update products' })
            setTimeout(() => setSaveMessage(null), 3000)
        } finally {
            setSaving(false)
        }
    }

    const handleBulkConditionUpdate = async (conditionType: string, key: string, value: number, productIds: string[]) => {
        setSaving(true)
        setSaveMessage(null)
        try {
            const currentUser = getCurrentUser()
            const updatedBy = currentUser?.email || 'admin'
            
            // Update pricing rules for each selected product
            for (const productId of productIds) {
                const product = products.find(p => p.id === productId)
                if (!product) continue
                
                // Load existing pricing rules for the product
                let existingRules: PricingRules = ZERO_PRICING_RULES
                try {
                    const productPricingData = await getProductPricingFromCollection(productId)
                    if (productPricingData?.pricingRules) {
                        existingRules = productPricingData.pricingRules
                    } else {
                        const productData = await getProductById(productId)
                        if (productData?.pricingRules) {
                            existingRules = productData.pricingRules
                        }
                    }
                } catch (error) {
                    console.error(`Error loading rules for product ${productId}:`, error)
                }
                
                // Update the specific condition field
                const updatedRules: PricingRules = {
                    ...existingRules,
                    [conditionType]: {
                        ...(existingRules as any)[conditionType],
                        [key]: value
                    }
                }
                
                // Save updated rules
                await saveProductPricingRules(productId, updatedRules)
                await saveProductPricingToCollection(productId, product, updatedRules, updatedBy)
            }
            
            setSaveMessage({ 
                type: 'success', 
                text: `Updated "${conditionType}.${key}" for ${productIds.length} product${productIds.length !== 1 ? 's' : ''}!` 
            })
            setTimeout(() => setSaveMessage(null), 3000)
        } catch (error) {
            console.error('Error in bulk update:', error)
            setSaveMessage({ type: 'error', text: 'Failed to update products' })
            setTimeout(() => setSaveMessage(null), 3000)
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveMessage(null)
        try {
            if (!selectedProduct) {
                await savePricingRules(pricingRules)
                setSaveMessage({ type: 'success', text: 'Global default pricing rules saved. Products without their own rules will use these.' })
            } else {
                const currentUser = getCurrentUser()
                const updatedBy = currentUser?.email || 'admin'
                
                // If variant is selected, save variant-specific rules
                if (selectedVariantId) {
                    const updatedVariantRules = {
                        ...variantRules,
                        [selectedVariantId]: pricingRules
                    }
                    setVariantRules(updatedVariantRules)
                    // Save with variant rules and powerOn percentage
                    await saveProductPricingRules(selectedProduct.id, pricingRules)
                    await saveProductPricingToCollection(
                        selectedProduct.id, 
                        selectedProduct, 
                        pricingRules, 
                        updatedBy,
                        updatedVariantRules,
                        powerOnPercentage
                    )
                    const variant = selectedProduct.variants?.find(v => v.id === selectedVariantId)
                    setSaveMessage({ type: 'success', text: `Pricing rules saved for ${selectedProduct.modelName} - ${variant?.label || selectedVariantId}!` })
                } else {
                    // Save product-level rules with variant rules and powerOn percentage
                    await saveProductPricingRules(selectedProduct.id, pricingRules)
                    await saveProductPricingToCollection(
                        selectedProduct.id, 
                        selectedProduct, 
                        pricingRules, 
                        updatedBy,
                        variantRules,
                        powerOnPercentage
                    )
                    setSaveMessage({ type: 'success', text: `Pricing rules saved for ${selectedProduct.modelName}!` })
                }
            }
            setTimeout(() => setSaveMessage(null), 3000)
        } catch (error) {
            console.error('Error saving pricing rules:', error)
            setSaveMessage({ type: 'error', text: 'Failed to save pricing rules' })
            setTimeout(() => setSaveMessage(null), 3000)
        } finally {
            setSaving(false)
        }
    }

    const handleVariantSelect = (variantId: string | null) => {
        // Save current rules before switching
        if (selectedVariantId && selectedProduct) {
            const updatedVariantRules = {
                ...variantRules,
                [selectedVariantId]: pricingRules
            }
            setVariantRules(updatedVariantRules)
        }
        setSelectedVariantId(variantId)
    }

    const handleProductSelect = (productId: string) => {
        const product = products.find(p => p.id === productId)
        setSelectedProduct(product || null)
    }

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category)
        setSelectedBrand('All')
        setSelectedProduct(null)
    }

    const handleBrandChange = (brand: string) => {
        setSelectedBrand(brand)
        setSelectedProduct(null)
    }

    // Determine category type
    const isCamera = selectedProduct?.category?.toLowerCase().includes('camera') || selectedProduct?.category?.toLowerCase().includes('dslr')
    const isPhone = selectedProduct?.category?.toLowerCase().includes('phone')
    const isLaptop = selectedProduct?.category?.toLowerCase().includes('laptop')
    const isTablet = selectedProduct?.category?.toLowerCase().includes('tablet') || selectedProduct?.category?.toLowerCase().includes('ipad')

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
                <p className="mt-4 text-gray-500 text-sm">Loading products...</p>
            </div>
        )
    }

    const handleProductSaved = async () => {
        setIsEditModalOpen(false)
        // Reload products to get updated data
        try {
            const productsData = await getAllProducts()
            setProducts(productsData)
            // Update selected product if it was edited
            if (selectedProduct) {
                const updatedProduct = productsData.find(p => p.id === selectedProduct.id)
                if (updatedProduct) {
                    setSelectedProduct(updatedProduct)
                }
            }
        } catch (error) {
            console.error('Error reloading products:', error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Product Pricing Calculator</h2>
                        <p className="text-emerald-100 mt-1">
                            {selectedProduct
                                ? `Configure per-question prices for ${selectedProduct.modelName}. Client price = internal base + modifiers from selected options.`
                                : 'All prices are loaded from Firebase. Set global default here, or select a product to set per-product rules.'}
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <SaveIcon />
                                {selectedProduct ? 'Save for this product' : 'Save as global default'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded-xl ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {saveMessage.text}
                </div>
            )}

            {/* Product Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => handleBrandChange(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                            disabled={selectedCategory === 'All'}
                        >
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                        <select
                            value={selectedProduct?.id || ''}
                            onChange={(e) => handleProductSelect(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                            disabled={filteredProducts.length === 0}
                        >
                            <option value="">-- Select Product --</option>
                            {filteredProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.modelName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product Info */}
                {selectedProduct && (
                    <>
                        <div className="mt-6 p-4 bg-gradient-to-r from-brand-blue-50 to-emerald-50 rounded-xl border border-brand-blue-100">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{selectedProduct.modelName}</h4>
                                            <p className="text-sm text-gray-600">{selectedProduct.brand} • {selectedProduct.category}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-600 hover:text-brand-blue-900"
                                            title="Edit product details"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Base Price</p>
                                    <p className="text-xl font-bold text-brand-blue-900">₹{selectedProduct.basePrice.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <>
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-2">
                                        <strong>💡 How Product Level vs Variant Level Works:</strong>
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                                        <li><strong>Product Level:</strong> Rules apply to ALL variants. If you set "Does the camera power on?" as -₹10,000 here, it applies to all variants automatically.</li>
                                        <li><strong>Variant Level:</strong> Rules are specific to that variant only. Use this if a variant needs different pricing rules than others.</li>
                                    </ul>
                                    <p className="text-xs text-blue-600 mt-2">
                                        <strong>Answer:</strong> No, you don't need to set it again for each variant if you set it at Product Level. It will apply to all variants automatically.
                                    </p>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 mb-3">
                                    Click on a variant to set variant-specific pricing rules. Click "Product Level" to set rules that apply to all variants.
                                </p>
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-sm font-semibold text-gray-700">Select Variant or Product Level</h5>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="p-1.5 hover:bg-white rounded-md transition-colors text-gray-600 hover:text-brand-blue-900"
                                            title="Edit product and variants"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            onClick={() => handleVariantSelect(null)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                selectedVariantId === null
                                                    ? 'bg-brand-blue-600 text-white shadow-md'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            Product Level
                                        </button>
                                        {selectedProduct.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(variant.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    selectedVariantId === variant.id
                                                        ? 'bg-brand-blue-600 text-white shadow-md'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {variant.label} - ₹{variant.basePrice.toLocaleString('en-IN')}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedVariantId === null && (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-xs text-green-700">
                                                <strong>✓ Product Level Selected:</strong> Pricing rules you set here will apply to all variants ({selectedProduct.variants.length} variant{selectedProduct.variants.length > 1 ? 's' : ''}).
                                            </p>
                                        </div>
                                    )}
                                    {selectedVariantId && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs text-blue-700">
                                                Editing pricing rules for: <strong>{selectedProduct.variants?.find(v => v.id === selectedVariantId)?.label}</strong>
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                These rules will only apply to this variant. Other variants will use Product Level rules if set.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* No Product Selected */}
            {!selectedProduct && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Edit global default pricing or select a product for per-product rules</p>
                    <p className="text-gray-400 text-sm mt-1">Edit the sections below and click &quot;Save as global default&quot;. Products without their own rules will use these. Or select a product to set question-wise prices for that product only.</p>
                </div>
            )}

            {/* Global default sections when no product selected */}
            {!selectedProduct && (
                <>
                    <CollapsibleSection title="Global default – Basic questions" description="Used when a product has no rules. Set modifier (₹) for each option." badge="Global" badgeColor="bg-gray-200 text-gray-800" defaultOpen={true}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PricingInput label="Power on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} {...getBulkQuestionProps('powerOn', 'no', pricingRules.questions.powerOn?.no || 0)} />
                            <PricingInput label="Camera/Function? (No)" value={pricingRules.questions.cameraFunction?.no || 0} onChange={(v) => handleQuestionUpdate('cameraFunction', 'no', v)} {...getBulkQuestionProps('cameraFunction', 'no', pricingRules.questions.cameraFunction?.no || 0)} />
                            <PricingInput label="Buttons working? (No)" value={pricingRules.questions.buttonsWorking?.no || 0} onChange={(v) => handleQuestionUpdate('buttonsWorking', 'no', v)} {...getBulkQuestionProps('buttonsWorking', 'no', pricingRules.questions.buttonsWorking?.no || 0)} />
                            <PricingInput label="Water damage? (No)" value={pricingRules.questions.waterDamage?.no || 0} onChange={(v) => handleQuestionUpdate('waterDamage', 'no', v)} {...getBulkQuestionProps('waterDamage', 'no', pricingRules.questions.waterDamage?.no || 0)} />
                            <PricingInput label="Flash working? (No)" value={pricingRules.questions.flashWorking?.no || 0} onChange={(v) => handleQuestionUpdate('flashWorking', 'no', v)} {...getBulkQuestionProps('flashWorking', 'no', pricingRules.questions.flashWorking?.no || 0)} />
                            <PricingInput label="Memory card slot? (No)" value={pricingRules.questions.memoryCardSlotWorking?.no || 0} onChange={(v) => handleQuestionUpdate('memoryCardSlotWorking', 'no', v)} {...getBulkQuestionProps('memoryCardSlotWorking', 'no', pricingRules.questions.memoryCardSlotWorking?.no || 0)} />
                            <PricingInput label="Speaker working? (No)" value={pricingRules.questions.speakerWorking?.no || 0} onChange={(v) => handleQuestionUpdate('speakerWorking', 'no', v)} {...getBulkQuestionProps('speakerWorking', 'no', pricingRules.questions.speakerWorking?.no || 0)} />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Global default – Body & display" badge="Global" badgeColor="bg-gray-200 text-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Body: Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} {...getBulkUpdateProps('bodyCondition', 'excellent', pricingRules.bodyCondition?.excellent || 0)} />
                            <PricingInput label="Body: Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} {...getBulkUpdateProps('bodyCondition', 'good', pricingRules.bodyCondition?.good || 0)} />
                            <PricingInput label="Body: Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} {...getBulkUpdateProps('bodyCondition', 'fair', pricingRules.bodyCondition?.fair || 0)} />
                            <PricingInput label="Body: Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} {...getBulkUpdateProps('bodyCondition', 'poor', pricingRules.bodyCondition?.poor || 0)} />
                            <PricingInput label="Display: Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} {...getBulkUpdateProps('displayCondition', 'excellent', pricingRules.displayCondition?.excellent || 0)} />
                            <PricingInput label="Display: Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} {...getBulkUpdateProps('displayCondition', 'good', pricingRules.displayCondition?.good || 0)} />
                            <PricingInput label="Display: Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} {...getBulkUpdateProps('displayCondition', 'fair', pricingRules.displayCondition?.fair || 0)} />
                            <PricingInput label="Display: Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} {...getBulkUpdateProps('displayCondition', 'cracked', pricingRules.displayCondition?.cracked || 0)} />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Global default – Accessories & age" badge="Global" badgeColor="bg-gray-200 text-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Battery" value={pricingRules.accessories?.battery || 0} onChange={(v) => handleConditionUpdate('accessories', 'battery', v)} {...getBulkUpdateProps('accessories', 'battery', pricingRules.accessories?.battery || 0)} />
                            <PricingInput label="Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} {...getBulkUpdateProps('accessories', 'charger', pricingRules.accessories?.charger || 0)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} {...getBulkUpdateProps('accessories', 'box', pricingRules.accessories?.box || 0)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} {...getBulkUpdateProps('accessories', 'bill', pricingRules.accessories?.bill || 0)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} {...getBulkUpdateProps('accessories', 'warrantyCard', pricingRules.accessories?.warrantyCard || 0)} />
                            <PricingInput label="Age: &lt;3 months" value={pricingRules.age?.lessThan3Months || 0} onChange={(v) => handleConditionUpdate('age', 'lessThan3Months', v)} {...getBulkUpdateProps('age', 'lessThan3Months', pricingRules.age?.lessThan3Months || 0)} />
                            <PricingInput label="Age: 4–12 months" value={pricingRules.age?.fourToTwelveMonths || 0} onChange={(v) => handleConditionUpdate('age', 'fourToTwelveMonths', v)} {...getBulkUpdateProps('age', 'fourToTwelveMonths', pricingRules.age?.fourToTwelveMonths || 0)} />
                            <PricingInput label="Age: &gt;12 months" value={pricingRules.age?.aboveTwelveMonths || 0} onChange={(v) => handleConditionUpdate('age', 'aboveTwelveMonths', v)} {...getBulkUpdateProps('age', 'aboveTwelveMonths', pricingRules.age?.aboveTwelveMonths || 0)} />
                        </div>
                    </CollapsibleSection>
                </>
            )}

            {/* Camera Pricing Sections */}
            {selectedProduct && isCamera && (
                <>
                    {/* Basic Functionality Questions */}
                    <CollapsibleSection 
                        title="Basic Functionality Questions" 
                        description="Set deduction amounts when customer answers 'No' to these questions"
                        badge="Camera"
                        badgeColor="bg-purple-100 text-purple-700"
                        defaultOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PricingInput
                                label="Does the camera power on? (No)"
                                value={pricingRules.questions.powerOn?.no || 0}
                                onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)}
                                description="Deduct if camera doesn't power on"
                                {...getBulkQuestionProps('powerOn', 'no', pricingRules.questions.powerOn?.no || 0)}
                            />
                            <PricingInput
                                label="Camera functions properly? (No)"
                                value={pricingRules.questions.cameraFunction?.no || 0}
                                onChange={(v) => handleQuestionUpdate('cameraFunction', 'no', v)}
                                description="Deduct if photo/video doesn't work"
                                {...getBulkQuestionProps('cameraFunction', 'no', pricingRules.questions.cameraFunction?.no || 0)}
                            />
                            <PricingInput
                                label="All buttons working? (No)"
                                value={pricingRules.questions.buttonsWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('buttonsWorking', 'no', v)}
                                description="Deduct if buttons are not working"
                                {...getBulkQuestionProps('buttonsWorking', 'no', pricingRules.questions.buttonsWorking?.no || 0)}
                            />
                            <PricingInput
                                label="Free from water damage? (No)"
                                value={pricingRules.questions.waterDamage?.no || 0}
                                onChange={(v) => handleQuestionUpdate('waterDamage', 'no', v)}
                                description="Deduct if device has water damage"
                                {...getBulkQuestionProps('waterDamage', 'no', pricingRules.questions.waterDamage?.no || 0)}
                            />
                            <PricingInput
                                label="Flash working? (No)"
                                value={pricingRules.questions.flashWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('flashWorking', 'no', v)}
                                description="Deduct if flash doesn't work"
                                {...getBulkQuestionProps('flashWorking', 'no', pricingRules.questions.flashWorking?.no || 0)}
                            />
                            <PricingInput
                                label="Memory card slot working? (No)"
                                value={pricingRules.questions.memoryCardSlotWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('memoryCardSlotWorking', 'no', v)}
                                description="Deduct if memory card slot is faulty"
                                {...getBulkQuestionProps('memoryCardSlotWorking', 'no', pricingRules.questions.memoryCardSlotWorking?.no || 0)}
                            />
                            <PricingInput
                                label="Speaker working? (No)"
                                value={pricingRules.questions.speakerWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('speakerWorking', 'no', v)}
                                description="Deduct if speaker doesn't work"
                                {...getBulkQuestionProps('speakerWorking', 'no', pricingRules.questions.speakerWorking?.no || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Body Physical Condition */}
                    <CollapsibleSection 
                        title="Body Physical Condition" 
                        description="What is the physical condition of the camera body?"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PricingInput
                                label="Like New"
                                value={pricingRules.bodyPhysicalCondition?.likeNew || 0}
                                onChange={(v) => handleConditionUpdate('bodyPhysicalCondition', 'likeNew', v)}
                                description="No scratches, dents, or cracks"
                                {...getBulkUpdateProps('bodyPhysicalCondition', 'likeNew', pricingRules.bodyPhysicalCondition?.likeNew || 0)}
                            />
                            <PricingInput
                                label="Average"
                                value={pricingRules.bodyPhysicalCondition?.average || 0}
                                onChange={(v) => handleConditionUpdate('bodyPhysicalCondition', 'average', v)}
                                description="Minor scratches or normal wear"
                                {...getBulkUpdateProps('bodyPhysicalCondition', 'average', pricingRules.bodyPhysicalCondition?.average || 0)}
                            />
                            <PricingInput
                                label="Worn"
                                value={pricingRules.bodyPhysicalCondition?.worn || 0}
                                onChange={(v) => handleConditionUpdate('bodyPhysicalCondition', 'worn', v)}
                                description="Visible dents or deep scratches"
                                {...getBulkUpdateProps('bodyPhysicalCondition', 'worn', pricingRules.bodyPhysicalCondition?.worn || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* LCD Display Condition */}
                    <CollapsibleSection 
                        title="LCD Display Condition" 
                        description="What is the condition of the LCD Display?"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PricingInput
                                label="Good"
                                value={pricingRules.lcdDisplayCondition?.good || 0}
                                onChange={(v) => handleConditionUpdate('lcdDisplayCondition', 'good', v)}
                                description="Clean screen with no issues"
                                {...getBulkUpdateProps('lcdDisplayCondition', 'good', pricingRules.lcdDisplayCondition?.good || 0)}
                            />
                            <PricingInput
                                label="Fair"
                                value={pricingRules.lcdDisplayCondition?.fair || 0}
                                onChange={(v) => handleConditionUpdate('lcdDisplayCondition', 'fair', v)}
                                description="Minor scratches or marks"
                                {...getBulkUpdateProps('lcdDisplayCondition', 'fair', pricingRules.lcdDisplayCondition?.fair || 0)}
                            />
                            <PricingInput
                                label="Poor"
                                value={pricingRules.lcdDisplayCondition?.poor || 0}
                                onChange={(v) => handleConditionUpdate('lcdDisplayCondition', 'poor', v)}
                                description="Cracked screen or vintage"
                                {...getBulkUpdateProps('lcdDisplayCondition', 'poor', pricingRules.lcdDisplayCondition?.poor || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Rubber Grips Condition */}
                    <CollapsibleSection 
                        title="Rubber Grips & Covers Condition" 
                        description="What is the condition of the rubber grips and covers?"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PricingInput
                                label="Good"
                                value={pricingRules.rubberGripsCondition?.good || 0}
                                onChange={(v) => handleConditionUpdate('rubberGripsCondition', 'good', v)}
                                description="All rubber is tight and intact"
                                {...getBulkUpdateProps('rubberGripsCondition', 'good', pricingRules.rubberGripsCondition?.good || 0)}
                            />
                            <PricingInput
                                label="Fair"
                                value={pricingRules.rubberGripsCondition?.fair || 0}
                                onChange={(v) => handleConditionUpdate('rubberGripsCondition', 'fair', v)}
                                description="USB/Port covers are missing"
                                {...getBulkUpdateProps('rubberGripsCondition', 'fair', pricingRules.rubberGripsCondition?.fair || 0)}
                            />
                            <PricingInput
                                label="Poor"
                                value={pricingRules.rubberGripsCondition?.poor || 0}
                                onChange={(v) => handleConditionUpdate('rubberGripsCondition', 'poor', v)}
                                description="Handgrip rubber is loose or missing"
                                {...getBulkUpdateProps('rubberGripsCondition', 'poor', pricingRules.rubberGripsCondition?.poor || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Sensor/Viewfinder Condition */}
                    <CollapsibleSection 
                        title="Sensor/Viewfinder Condition" 
                        description="Is there dust or fungus in the Sensor or Viewfinder?"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PricingInput
                                label="Clean"
                                value={pricingRules.sensorViewfinderCondition?.clean || 0}
                                onChange={(v) => handleConditionUpdate('sensorViewfinderCondition', 'clean', v)}
                                description="No visible dust or fungus"
                                {...getBulkUpdateProps('sensorViewfinderCondition', 'clean', pricingRules.sensorViewfinderCondition?.clean || 0)}
                            />
                            <PricingInput
                                label="Minor"
                                value={pricingRules.sensorViewfinderCondition?.minor || 0}
                                onChange={(v) => handleConditionUpdate('sensorViewfinderCondition', 'minor', v)}
                                description="Light dust or small fungus spots"
                                {...getBulkUpdateProps('sensorViewfinderCondition', 'minor', pricingRules.sensorViewfinderCondition?.minor || 0)}
                            />
                            <PricingInput
                                label="Major"
                                value={pricingRules.sensorViewfinderCondition?.major || 0}
                                onChange={(v) => handleConditionUpdate('sensorViewfinderCondition', 'major', v)}
                                description="Heavy fungus, haze, or thick dust"
                                {...getBulkUpdateProps('sensorViewfinderCondition', 'major', pricingRules.sensorViewfinderCondition?.major || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Error Codes Condition */}
                    <CollapsibleSection 
                        title="Error Codes" 
                        description="Does the camera show any error codes?"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PricingInput
                                label="None"
                                value={pricingRules.errorCodesCondition?.none || 0}
                                onChange={(v) => handleConditionUpdate('errorCodesCondition', 'none', v)}
                                description="Camera works perfectly without errors"
                                {...getBulkUpdateProps('errorCodesCondition', 'none', pricingRules.errorCodesCondition?.none || 0)}
                            />
                            <PricingInput
                                label="Intermittent"
                                value={pricingRules.errorCodesCondition?.intermittent || 0}
                                onChange={(v) => handleConditionUpdate('errorCodesCondition', 'intermittent', v)}
                                description="Error messages appear occasionally"
                                {...getBulkUpdateProps('errorCodesCondition', 'intermittent', pricingRules.errorCodesCondition?.intermittent || 0)}
                            />
                            <PricingInput
                                label="Persistent"
                                value={pricingRules.errorCodesCondition?.persistent || 0}
                                onChange={(v) => handleConditionUpdate('errorCodesCondition', 'persistent', v)}
                                description="Error messages appear frequently"
                                {...getBulkUpdateProps('errorCodesCondition', 'persistent', pricingRules.errorCodesCondition?.persistent || 0)}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Lens Condition Section */}
                    <CollapsibleSection 
                        title="Lens Condition (If selling lens)" 
                        description="Configure pricing for lens-specific conditions"
                        badge="Lens"
                        badgeColor="bg-amber-100 text-amber-700"
                    >
                        <div className="space-y-6">
                            {/* Has Lens to Sell */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Do you have a lens to sell?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <PricingInput
                                        label="Yes - Has lens"
                                        value={pricingRules.questions.hasLensToSell?.yes || 0}
                                        onChange={(v) => handleQuestionUpdate('hasLensToSell', 'yes', v)}
                                        {...getBulkQuestionProps('hasLensToSell', 'yes', pricingRules.questions.hasLensToSell?.yes || 0)}
                                    />
                                    <PricingInput
                                        label="No - No lens"
                                        value={pricingRules.questions.hasLensToSell?.no || 0}
                                        onChange={(v) => handleQuestionUpdate('hasLensToSell', 'no', v)}
                                        {...getBulkQuestionProps('hasLensToSell', 'no', pricingRules.questions.hasLensToSell?.no || 0)}
                                    />
                                </div>
                            </div>

                            {/* Fungus/Dust Condition */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Fungus/Dust Condition</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PricingInput
                                        label="Clean / Good"
                                        value={pricingRules.fungusDustCondition?.clean || 0}
                                        onChange={(v) => handleConditionUpdate('fungusDustCondition', 'clean', v)}
                                        {...getBulkUpdateProps('fungusDustCondition', 'clean', pricingRules.fungusDustCondition?.clean || 0)}
                                    />
                                    <PricingInput
                                        label="Minor Fungus/Dust"
                                        value={pricingRules.fungusDustCondition?.minorFungus || 0}
                                        onChange={(v) => handleConditionUpdate('fungusDustCondition', 'minorFungus', v)}
                                        {...getBulkUpdateProps('fungusDustCondition', 'minorFungus', pricingRules.fungusDustCondition?.minorFungus || 0)}
                                    />
                                    <PricingInput
                                        label="Major Fungus/Dust"
                                        value={pricingRules.fungusDustCondition?.majorFungus || 0}
                                        onChange={(v) => handleConditionUpdate('fungusDustCondition', 'majorFungus', v)}
                                        {...getBulkUpdateProps('fungusDustCondition', 'majorFungus', pricingRules.fungusDustCondition?.majorFungus || 0)}
                                    />
                                </div>
                            </div>

                            {/* Focus Functionality */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Focus Functionality</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PricingInput
                                        label="Good (AF & MF work)"
                                        value={pricingRules.focusFunctionality?.goodFocus || 0}
                                        onChange={(v) => handleConditionUpdate('focusFunctionality', 'goodFocus', v)}
                                        {...getBulkUpdateProps('focusFunctionality', 'goodFocus', pricingRules.focusFunctionality?.goodFocus || 0)}
                                    />
                                    <PricingInput
                                        label="AF Issue Only"
                                        value={pricingRules.focusFunctionality?.afIssue || 0}
                                        onChange={(v) => handleConditionUpdate('focusFunctionality', 'afIssue', v)}
                                        {...getBulkUpdateProps('focusFunctionality', 'afIssue', pricingRules.focusFunctionality?.afIssue || 0)}
                                    />
                                    <PricingInput
                                        label="MF Issue Only"
                                        value={pricingRules.focusFunctionality?.mfIssue || 0}
                                        onChange={(v) => handleConditionUpdate('focusFunctionality', 'mfIssue', v)}
                                        {...getBulkUpdateProps('focusFunctionality', 'mfIssue', pricingRules.focusFunctionality?.mfIssue || 0)}
                                    />
                                </div>
                            </div>

                            {/* Rubber Ring Condition */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Rubber Ring Condition</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PricingInput
                                        label="Good Condition"
                                        value={pricingRules.rubberRingCondition?.goodRubber || 0}
                                        onChange={(v) => handleConditionUpdate('rubberRingCondition', 'goodRubber', v)}
                                        {...getBulkUpdateProps('rubberRingCondition', 'goodRubber', pricingRules.rubberRingCondition?.goodRubber || 0)}
                                    />
                                    <PricingInput
                                        label="Minor Wear/Damage"
                                        value={pricingRules.rubberRingCondition?.minorRubber || 0}
                                        onChange={(v) => handleConditionUpdate('rubberRingCondition', 'minorRubber', v)}
                                        {...getBulkUpdateProps('rubberRingCondition', 'minorRubber', pricingRules.rubberRingCondition?.minorRubber || 0)}
                                    />
                                    <PricingInput
                                        label="Major Damage"
                                        value={pricingRules.rubberRingCondition?.majorRubber || 0}
                                        onChange={(v) => handleConditionUpdate('rubberRingCondition', 'majorRubber', v)}
                                        {...getBulkUpdateProps('rubberRingCondition', 'majorRubber', pricingRules.rubberRingCondition?.majorRubber || 0)}
                                    />
                                </div>
                            </div>

                            {/* Lens Error Status */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Lens Error Status</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <PricingInput
                                        label="No Errors"
                                        value={pricingRules.lensErrorStatus?.noErrors || 0}
                                        onChange={(v) => handleConditionUpdate('lensErrorStatus', 'noErrors', v)}
                                        {...getBulkUpdateProps('lensErrorStatus', 'noErrors', pricingRules.lensErrorStatus?.noErrors || 0)}
                                    />
                                    <PricingInput
                                        label="Occasional Errors"
                                        value={pricingRules.lensErrorStatus?.occasionalErrors || 0}
                                        onChange={(v) => handleConditionUpdate('lensErrorStatus', 'occasionalErrors', v)}
                                        {...getBulkUpdateProps('lensErrorStatus', 'occasionalErrors', pricingRules.lensErrorStatus?.occasionalErrors || 0)}
                                    />
                                    <PricingInput
                                        label="Frequent Errors"
                                        value={pricingRules.lensErrorStatus?.frequentErrors || 0}
                                        onChange={(v) => handleConditionUpdate('lensErrorStatus', 'frequentErrors', v)}
                                        {...getBulkUpdateProps('lensErrorStatus', 'frequentErrors', pricingRules.lensErrorStatus?.frequentErrors || 0)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Camera Accessories */}
                    <CollapsibleSection 
                        title="Accessories (Bonus)" 
                        description="Add bonus amounts for each accessory"
                        badge="Bonus"
                        badgeColor="bg-green-100 text-green-700"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput
                                label="Original Battery"
                                value={pricingRules.accessories?.battery || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'battery', v)}
                                {...getBulkUpdateProps('accessories', 'battery', pricingRules.accessories?.battery || 0)}
                            />
                            <PricingInput
                                label="Original Charger"
                                value={pricingRules.accessories?.charger || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'charger', v)}
                                {...getBulkUpdateProps('accessories', 'charger', pricingRules.accessories?.charger || 0)}
                            />
                            <PricingInput
                                label="Box"
                                value={pricingRules.accessories?.box || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'box', v)}
                                {...getBulkUpdateProps('accessories', 'box', pricingRules.accessories?.box || 0)}
                            />
                            <PricingInput
                                label="Bill"
                                value={pricingRules.accessories?.bill || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'bill', v)}
                                {...getBulkUpdateProps('accessories', 'bill', pricingRules.accessories?.bill || 0)}
                            />
                            <PricingInput
                                label="Warranty Card"
                                value={pricingRules.accessories?.warrantyCard || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)}
                                {...getBulkUpdateProps('accessories', 'warrantyCard', pricingRules.accessories?.warrantyCard || 0)}
                            />
                        </div>
                    </CollapsibleSection>
                </>
            )}

            {/* Phone Pricing Sections */}
            {selectedProduct && isPhone && (
                <>
                    <CollapsibleSection 
                        title="Basic Functionality Questions" 
                        description="Set deduction amounts when customer answers 'No' to these questions"
                        badge="Phone"
                        badgeColor="bg-blue-100 text-blue-700"
                        defaultOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PowerOnInput
                                label="Does the phone Power on? (No)"
                                value={pricingRules.questions.powerOn?.no || 0}
                                onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)}
                                percentage={powerOnPercentage}
                                onPercentageChange={setPowerOnPercentage}
                                description="Deduct if device doesn't power on without charger"
                            />
                            <PricingInput
                                label="Does the phone function properly? (No)"
                                value={pricingRules.questions.cameraWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('cameraWorking', 'no', v)}
                                description="Deduct if lenses, flash, or sensor have issues"
                                onBulkUpdate={selectedProduct ? (productIds) => handleBulkQuestionUpdate('cameraWorking', 'no', pricingRules.questions.cameraWorking?.no || 0, productIds) : undefined}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                            <PricingInput
                                label="Face ID working properly? (No)"
                                value={pricingRules.questions.biometricWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('biometricWorking', 'no', v)}
                                description="Deduct if Face ID shows Hardware Issue"
                                onBulkUpdate={selectedProduct ? (productIds) => handleBulkQuestionUpdate('biometricWorking', 'no', pricingRules.questions.biometricWorking?.no || 0, productIds) : undefined}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                            <PricingInput
                                label="True Tone available in Control Center? (No)"
                                value={pricingRules.questions.trueTone?.no || 0}
                                onChange={(v) => handleQuestionUpdate('trueTone', 'no', v)}
                                description="Deduct if True Tone not available (brightness slider)"
                                onBulkUpdate={selectedProduct ? (productIds) => handleBulkQuestionUpdate('trueTone', 'no', pricingRules.questions.trueTone?.no || 0, productIds) : undefined}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition" description="Screen/Display physical condition (phone options)">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput 
                                label="Good Working" 
                                value={pricingRules.displayCondition?.goodWorking ?? pricingRules.displayCondition?.good ?? 0} 
                                onChange={(v) => handleConditionUpdate('displayCondition', 'goodWorking', v)}
                                onBulkUpdate={(productIds) => handleBulkConditionUpdate('displayCondition', 'goodWorking', pricingRules.displayCondition?.goodWorking ?? pricingRules.displayCondition?.good ?? 0, productIds)}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                            <PricingInput 
                                label="Minor crack" 
                                value={pricingRules.displayCondition?.minorCrack ?? pricingRules.displayCondition?.fair ?? 0} 
                                onChange={(v) => handleConditionUpdate('displayCondition', 'minorCrack', v)}
                                onBulkUpdate={(productIds) => handleBulkConditionUpdate('displayCondition', 'minorCrack', pricingRules.displayCondition?.minorCrack ?? pricingRules.displayCondition?.fair ?? 0, productIds)}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                            <PricingInput 
                                label="Major damage" 
                                value={pricingRules.displayCondition?.majorDamage ?? 0} 
                                onChange={(v) => handleConditionUpdate('displayCondition', 'majorDamage', v)}
                                onBulkUpdate={(productIds) => handleBulkConditionUpdate('displayCondition', 'majorDamage', pricingRules.displayCondition?.majorDamage ?? 0, productIds)}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                            <PricingInput 
                                label="Not Working" 
                                value={pricingRules.displayCondition?.notWorking ?? pricingRules.displayCondition?.cracked ?? 0} 
                                onChange={(v) => handleConditionUpdate('displayCondition', 'notWorking', v)}
                                onBulkUpdate={(productIds) => handleBulkConditionUpdate('displayCondition', 'notWorking', pricingRules.displayCondition?.notWorking ?? pricingRules.displayCondition?.cracked ?? 0, productIds)}
                                category={selectedProduct?.category}
                                brand={selectedProduct?.brand}
                                allProducts={products}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Battery health" description="Phone battery health range">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="90% above" value={pricingRules.batteryHealthRange?.battery90Above ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery90Above', v)} {...getBulkUpdateProps('batteryHealthRange', 'battery90Above', pricingRules.batteryHealthRange?.battery90Above ?? 0)} />
                            <PricingInput label="90% to 80%" value={pricingRules.batteryHealthRange?.battery80to90 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery80to90', v)} {...getBulkUpdateProps('batteryHealthRange', 'battery80to90', pricingRules.batteryHealthRange?.battery80to90 ?? 0)} />
                            <PricingInput label="80% to 50%" value={pricingRules.batteryHealthRange?.battery50to80 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery50to80', v)} {...getBulkUpdateProps('batteryHealthRange', 'battery50to80', pricingRules.batteryHealthRange?.battery50to80 ?? 0)} />
                            <PricingInput label="Below 50%" value={pricingRules.batteryHealthRange?.batteryBelow50 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'batteryBelow50', v)} {...getBulkUpdateProps('batteryHealthRange', 'batteryBelow50', pricingRules.batteryHealthRange?.batteryBelow50 ?? 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Camera condition" description="Phone camera condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Good Condition" value={pricingRules.cameraCondition?.cameraGood ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'cameraGood', v)} {...getBulkUpdateProps('cameraCondition', 'cameraGood', pricingRules.cameraCondition?.cameraGood ?? 0)} />
                            <PricingInput label="Front camera not working" value={pricingRules.cameraCondition?.frontCameraNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'frontCameraNotWorking', v)} {...getBulkUpdateProps('cameraCondition', 'frontCameraNotWorking', pricingRules.cameraCondition?.frontCameraNotWorking ?? 0)} />
                            <PricingInput label="Back camera not working" value={pricingRules.cameraCondition?.backCameraNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'backCameraNotWorking', v)} {...getBulkUpdateProps('cameraCondition', 'backCameraNotWorking', pricingRules.cameraCondition?.backCameraNotWorking ?? 0)} />
                            <PricingInput label="Both not working" value={pricingRules.cameraCondition?.bothCamerasNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'bothCamerasNotWorking', v)} {...getBulkUpdateProps('cameraCondition', 'bothCamerasNotWorking', pricingRules.cameraCondition?.bothCamerasNotWorking ?? 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition" description="Device body/frame physical condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} {...getBulkUpdateProps('bodyCondition', 'excellent', pricingRules.bodyCondition?.excellent || 0)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} {...getBulkUpdateProps('bodyCondition', 'good', pricingRules.bodyCondition?.good || 0)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} {...getBulkUpdateProps('bodyCondition', 'fair', pricingRules.bodyCondition?.fair || 0)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} {...getBulkUpdateProps('bodyCondition', 'poor', pricingRules.bodyCondition?.poor || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Functional Issues" description="Deductions for functional problems">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(pricingRules.functionalIssues || {}).map(([key, value]) => (
                                <PricingInput
                                    key={key}
                                    label={key === 'noIssues' ? 'No Issues' : key.replace(/([A-Z])/g, ' $1').trim()}
                                    value={value}
                                    onChange={(v) => handleConditionUpdate('functionalIssues', key, v)}
                                    {...getBulkUpdateProps('functionalIssues', key, value)}
                                />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} {...getBulkUpdateProps('accessories', 'charger', pricingRules.accessories?.charger || 0)} />
                            <PricingInput label="Original Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} {...getBulkUpdateProps('accessories', 'box', pricingRules.accessories?.box || 0)} />
                            <PricingInput label="Original Cable" value={pricingRules.accessories?.cable || 0} onChange={(v) => handleConditionUpdate('accessories', 'cable', v)} {...getBulkUpdateProps('accessories', 'cable', pricingRules.accessories?.cable || 0)} />
                            <PricingInput label="Original manual" value={pricingRules.accessories?.manual || 0} onChange={(v) => handleConditionUpdate('accessories', 'manual', v)} {...getBulkUpdateProps('accessories', 'manual', pricingRules.accessories?.manual || 0)} />
                            <PricingInput label="Phone case" value={pricingRules.accessories?.case || 0} onChange={(v) => handleConditionUpdate('accessories', 'case', v)} {...getBulkUpdateProps('accessories', 'case', pricingRules.accessories?.case || 0)} />
                        </div>
                    </CollapsibleSection>
                </>
            )}

            {/* Laptop Pricing Sections */}
            {selectedProduct && isLaptop && (
                <>
                    <CollapsibleSection 
                        title="Basic Functionality Questions" 
                        description="Set deduction amounts when customer answers 'No' to these questions"
                        badge="Laptop"
                        badgeColor="bg-indigo-100 text-indigo-700"
                        defaultOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PricingInput label="Laptop powers on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} {...getBulkQuestionProps('powerOn', 'no', pricingRules.questions.powerOn?.no || 0)} />
                            <PricingInput label="Screen free from issues? (No)" value={pricingRules.questions.screenCondition?.no || 0} onChange={(v) => handleQuestionUpdate('screenCondition', 'no', v)} {...getBulkQuestionProps('screenCondition', 'no', pricingRules.questions.screenCondition?.no || 0)} />
                            <PricingInput label="Keyboard & trackpad working? (No)" value={pricingRules.questions.keyboardWorking?.no || 0} onChange={(v) => handleQuestionUpdate('keyboardWorking', 'no', v)} {...getBulkQuestionProps('keyboardWorking', 'no', pricingRules.questions.keyboardWorking?.no || 0)} />
                            <PricingInput label="Body free from damage? (No)" value={pricingRules.questions.bodyDamage?.no || 0} onChange={(v) => handleQuestionUpdate('bodyDamage', 'no', v)} {...getBulkQuestionProps('bodyDamage', 'no', pricingRules.questions.bodyDamage?.no || 0)} />
                            <PricingInput label="Battery cycle under 300? (No)" value={pricingRules.questions.batteryCycleCount?.no || 0} onChange={(v) => handleQuestionUpdate('batteryCycleCount', 'no', v)} {...getBulkQuestionProps('batteryCycleCount', 'no', pricingRules.questions.batteryCycleCount?.no || 0)} />
                            <PricingInput label="All ports working? (No)" value={pricingRules.questions.portsWorking?.no || 0} onChange={(v) => handleQuestionUpdate('portsWorking', 'no', v)} {...getBulkQuestionProps('portsWorking', 'no', pricingRules.questions.portsWorking?.no || 0)} />
                            <PricingInput label="Charging properly? (No)" value={pricingRules.questions.chargingWorking?.no || 0} onChange={(v) => handleQuestionUpdate('chargingWorking', 'no', v)} {...getBulkQuestionProps('chargingWorking', 'no', pricingRules.questions.chargingWorking?.no || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} {...getBulkUpdateProps('displayCondition', 'excellent', pricingRules.displayCondition?.excellent || 0)} />
                            <PricingInput label="Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} {...getBulkUpdateProps('displayCondition', 'good', pricingRules.displayCondition?.good || 0)} />
                            <PricingInput label="Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} {...getBulkUpdateProps('displayCondition', 'fair', pricingRules.displayCondition?.fair || 0)} />
                            <PricingInput label="Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} {...getBulkUpdateProps('displayCondition', 'cracked', pricingRules.displayCondition?.cracked || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} {...getBulkUpdateProps('bodyCondition', 'excellent', pricingRules.bodyCondition?.excellent || 0)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} {...getBulkUpdateProps('bodyCondition', 'good', pricingRules.bodyCondition?.good || 0)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} {...getBulkUpdateProps('bodyCondition', 'fair', pricingRules.bodyCondition?.fair || 0)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} {...getBulkUpdateProps('bodyCondition', 'poor', pricingRules.bodyCondition?.poor || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Functional Issues">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(pricingRules.functionalIssues || {}).map(([key, value]) => (
                                <PricingInput key={key} label={key === 'noIssues' ? 'No Issues' : key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => handleConditionUpdate('functionalIssues', key, v)} {...getBulkUpdateProps('functionalIssues', key, value)} />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} {...getBulkUpdateProps('accessories', 'charger', pricingRules.accessories?.charger || 0)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} {...getBulkUpdateProps('accessories', 'box', pricingRules.accessories?.box || 0)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} {...getBulkUpdateProps('accessories', 'bill', pricingRules.accessories?.bill || 0)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} {...getBulkUpdateProps('accessories', 'warrantyCard', pricingRules.accessories?.warrantyCard || 0)} />
                        </div>
                    </CollapsibleSection>
                </>
            )}

            {/* Tablet Pricing Sections */}
            {selectedProduct && isTablet && (
                <>
                    <CollapsibleSection 
                        title="Basic Functionality Questions" 
                        description="Set deduction amounts when customer answers 'No' to these questions"
                        badge="Tablet"
                        badgeColor="bg-pink-100 text-pink-700"
                        defaultOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PricingInput label="Tablet powers on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} {...getBulkQuestionProps('powerOn', 'no', pricingRules.questions.powerOn?.no || 0)} />
                            <PricingInput label="Body free from major damage? (No)" value={pricingRules.questions.bodyDamage?.no || 0} onChange={(v) => handleQuestionUpdate('bodyDamage', 'no', v)} {...getBulkQuestionProps('bodyDamage', 'no', pricingRules.questions.bodyDamage?.no || 0)} />
                            <PricingInput label="Screen/touchscreen working? (No)" value={pricingRules.questions.lcdWorking?.no || 0} onChange={(v) => handleQuestionUpdate('lcdWorking', 'no', v)} {...getBulkQuestionProps('lcdWorking', 'no', pricingRules.questions.lcdWorking?.no || 0)} />
                            <PricingInput label="Battery holding charge? (No)" value={pricingRules.questions.batteryWorking?.no || 0} onChange={(v) => handleQuestionUpdate('batteryWorking', 'no', v)} {...getBulkQuestionProps('batteryWorking', 'no', pricingRules.questions.batteryWorking?.no || 0)} />
                            <PricingInput label="Cameras working? (No)" value={pricingRules.questions.cameraWorking?.no || 0} onChange={(v) => handleQuestionUpdate('cameraWorking', 'no', v)} {...getBulkQuestionProps('cameraWorking', 'no', pricingRules.questions.cameraWorking?.no || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} {...getBulkUpdateProps('displayCondition', 'excellent', pricingRules.displayCondition?.excellent || 0)} />
                            <PricingInput label="Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} {...getBulkUpdateProps('displayCondition', 'good', pricingRules.displayCondition?.good || 0)} />
                            <PricingInput label="Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} {...getBulkUpdateProps('displayCondition', 'fair', pricingRules.displayCondition?.fair || 0)} />
                            <PricingInput label="Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} {...getBulkUpdateProps('displayCondition', 'cracked', pricingRules.displayCondition?.cracked || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} {...getBulkUpdateProps('bodyCondition', 'excellent', pricingRules.bodyCondition?.excellent || 0)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} {...getBulkUpdateProps('bodyCondition', 'good', pricingRules.bodyCondition?.good || 0)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} {...getBulkUpdateProps('bodyCondition', 'fair', pricingRules.bodyCondition?.fair || 0)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} {...getBulkUpdateProps('bodyCondition', 'poor', pricingRules.bodyCondition?.poor || 0)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Functional Issues">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(pricingRules.functionalIssues || {}).map(([key, value]) => (
                                <PricingInput key={key} label={key === 'noIssues' ? 'No Issues' : key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => handleConditionUpdate('functionalIssues', key, v)} {...getBulkUpdateProps('functionalIssues', key, value)} />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} {...getBulkUpdateProps('accessories', 'charger', pricingRules.accessories?.charger || 0)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} {...getBulkUpdateProps('accessories', 'box', pricingRules.accessories?.box || 0)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} {...getBulkUpdateProps('accessories', 'bill', pricingRules.accessories?.bill || 0)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} {...getBulkUpdateProps('accessories', 'warrantyCard', pricingRules.accessories?.warrantyCard || 0)} />
                        </div>
                    </CollapsibleSection>
                </>
            )}

            {/* Device Age - Common for all */}
            {selectedProduct && (
                <CollapsibleSection 
                    title="Device Age" 
                    description="Deductions based on device age"
                    badge="Common"
                    badgeColor="bg-gray-100 text-gray-700"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PricingInput
                            label="Less than 3 months"
                            value={pricingRules.age?.lessThan3Months || 0}
                            onChange={(v) => handleConditionUpdate('age', 'lessThan3Months', v)}
                            {...getBulkUpdateProps('age', 'lessThan3Months', pricingRules.age?.lessThan3Months || 0)}
                        />
                        <PricingInput
                            label="4 to 12 months"
                            value={pricingRules.age?.fourToTwelveMonths || 0}
                            onChange={(v) => handleConditionUpdate('age', 'fourToTwelveMonths', v)}
                            {...getBulkUpdateProps('age', 'fourToTwelveMonths', pricingRules.age?.fourToTwelveMonths || 0)}
                        />
                        <PricingInput
                            label="Above 12 months"
                            value={pricingRules.age?.aboveTwelveMonths || 0}
                            onChange={(v) => handleConditionUpdate('age', 'aboveTwelveMonths', v)}
                            {...getBulkUpdateProps('age', 'aboveTwelveMonths', pricingRules.age?.aboveTwelveMonths || 0)}
                        />
                    </div>
                </CollapsibleSection>
            )}

            {/* Product Edit Modal */}
            <ProductFormModal
                isOpen={isEditModalOpen}
                product={selectedProduct}
                onClose={() => setIsEditModalOpen(false)}
                onProductSaved={handleProductSaved}
            />
        </div>
    )
}
