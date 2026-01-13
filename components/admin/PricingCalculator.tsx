'use client'

import { useState, useEffect } from 'react'
import { getAllProducts, type Product, getPricingRules, saveProductPricingRules, getProductById, saveProductPricingToCollection, getProductPricingFromCollection } from '@/lib/firebase/database'
import { PricingRules, DEFAULT_PRICING_RULES } from '@/lib/types/pricing'
import { getCurrentUser } from '@/lib/firebase/auth'

interface QuestionConfig {
    key: keyof PricingRules['questions']
    label: string
}

export default function PricingCalculator() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [selectedBrand, setSelectedBrand] = useState<string>('All')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [pricingRules, setPricingRules] = useState<PricingRules>(DEFAULT_PRICING_RULES)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
                // Load global rules if no product selected
                try {
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                } catch (error) {
                    console.error('Error loading global rules:', error)
                }
                return
            }

            try {
                // First try to load from productPricing collection
                const productPricingData = await getProductPricingFromCollection(selectedProduct.id)
                if (productPricingData?.pricingRules) {
                    setPricingRules(productPricingData.pricingRules)
                    return
                }

                // Fallback to products collection
                const productWithRules = await getProductById(selectedProduct.id)
                if (productWithRules?.pricingRules) {
                    setPricingRules(productWithRules.pricingRules)
                } else {
                    // Fallback to global rules
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                }
            } catch (error) {
                console.error('Error loading product rules:', error)
                // Fallback to global rules on error
                try {
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                } catch (e) {
                    console.error('Error loading global rules:', e)
                }
            }
        }
        loadProductRules()
    }, [selectedProduct])

    // Get unique categories and brands
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]
    const brands = selectedCategory === 'All' 
        ? ['All', ...Array.from(new Set(products.map(p => p.brand))).sort()]
        : ['All', ...Array.from(new Set(products.filter(p => p.category === selectedCategory).map(p => p.brand))).sort()]

    // Filter products based on category and brand
    const filteredProducts = products
        .filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
            const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand
            return matchesCategory && matchesBrand
        })
        .sort((a, b) => {
            // Sort by model name, handling numeric parts correctly (e.g., 80D, 90D, 100D)
            const modelA = a.modelName.toLowerCase()
            const modelB = b.modelName.toLowerCase()
            
            // Extract numeric parts and text parts for comparison
            const extractParts = (str: string) => {
                const parts: Array<{ type: 'number' | 'text', value: number | string }> = []
                const regex = /(\d+)|([^\d]+)/g
                let match
                while ((match = regex.exec(str)) !== null) {
                    if (match[1]) {
                        parts.push({ type: 'number', value: parseInt(match[1], 10) })
                    } else if (match[2]) {
                        parts.push({ type: 'text', value: match[2] })
                    }
                }
                return parts
            }
            
            const partsA = extractParts(modelA)
            const partsB = extractParts(modelB)
            
            // Compare parts
            const minLength = Math.min(partsA.length, partsB.length)
            for (let i = 0; i < minLength; i++) {
                const partA = partsA[i]
                const partB = partsB[i]
                
                // If types differ, text comes after number
                if (partA.type !== partB.type) {
                    return partA.type === 'number' ? -1 : 1
                }
                
                // Compare values
                if (partA.type === 'number' && partB.type === 'number') {
                    if (partA.value !== partB.value) {
                        return (partA.value as number) - (partB.value as number)
                    }
                } else {
                    const textA = partA.value as string
                    const textB = partB.value as string
                    if (textA !== textB) {
                        return textA.localeCompare(textB)
                    }
                }
            }
            
            // If all parts match up to minLength, shorter string comes first
            return partsA.length - partsB.length
        })

    // Get questions for category
    const getQuestionsForCategory = (category: string): QuestionConfig[] => {
        const cat = category.toLowerCase()
        const isPhone = cat.includes('phone')
        const isLaptop = cat.includes('laptop') || cat.includes('macbook')
        const isCamera = cat.includes('camera') || cat.includes('dslr')

        if (isCamera) {
            return [
                { key: 'powerOn', label: 'Device powers on and functions properly?' },
                { key: 'bodyDamage', label: 'Body free from major damage?' },
                { key: 'lcdWorking', label: 'Screen/Display working properly?' },
                { key: 'lensScratches', label: 'Lens free from scratches?' },
                { key: 'autofocusWorking', label: 'Autofocus working properly?' },
            ]
        } else if (isPhone) {
            return [
                { key: 'powerOn', label: 'Device powers on and functions properly?' },
                { key: 'lcdWorking', label: 'Screen/Display working properly?' },
                { key: 'bodyDamage', label: 'Body free from major damage?' },
            ]
        } else if (isLaptop) {
            return [
                { key: 'powerOn', label: 'Device powers on and functions properly?' },
                { key: 'lcdWorking', label: 'Screen/Display working properly?' },
                { key: 'bodyDamage', label: 'Body free from major damage?' },
            ]
        } else {
            // Default for other categories
            return [
                { key: 'powerOn', label: 'Device powers on and functions properly?' },
                { key: 'bodyDamage', label: 'Body free from major damage?' },
            ]
        }
    }

    // Check if category has display
    const hasDisplay = (category: string): boolean => {
        const cat = category.toLowerCase()
        return cat.includes('phone') || cat.includes('laptop') || cat.includes('macbook') || cat.includes('tablet') || cat.includes('ipad') || cat.includes('camera') || cat.includes('dslr')
    }

    // Check if category is camera
    const isCamera = (category: string): boolean => {
        const cat = category.toLowerCase()
        return cat.includes('camera') || cat.includes('dslr')
    }

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

    const handleConditionUpdate = (conditionType: 'displayCondition' | 'bodyCondition' | 'lensCondition' | 'errorCondition', key: string, value: number) => {
        setPricingRules(prev => ({
            ...prev,
            [conditionType]: {
                ...prev[conditionType],
                [key]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!selectedProduct) {
            setSaveMessage({ type: 'error', text: 'Please select a product first' })
            setTimeout(() => setSaveMessage(null), 3000)
            return
        }

        setSaving(true)
        setSaveMessage(null)
        try {
            // Get current user email for updatedBy field
            const currentUser = getCurrentUser()
            const updatedBy = currentUser?.email || 'admin'

            // Save to products collection (for backward compatibility)
            await saveProductPricingRules(selectedProduct.id, pricingRules)

            // Save to productPricing collection (main storage)
            await saveProductPricingToCollection(
                selectedProduct.id,
                selectedProduct,
                pricingRules,
                updatedBy
            )

            setSaveMessage({ type: 'success', text: `Pricing rules saved for ${selectedProduct.modelName}!` })
            setTimeout(() => setSaveMessage(null), 3000)
        } catch (error) {
            console.error('Error saving pricing rules:', error)
            setSaveMessage({ type: 'error', text: 'Failed to save pricing rules' })
            setTimeout(() => setSaveMessage(null), 3000)
        } finally {
            setSaving(false)
        }
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-900"></div>
            </div>
        )
    }

    const questions = selectedProduct ? getQuestionsForCategory(selectedProduct.category) : []
    const showDisplayCondition = selectedProduct ? hasDisplay(selectedProduct.category) : false
    const showLensCondition = selectedProduct ? isCamera(selectedProduct.category) : false
    const showErrorCondition = selectedProduct ? isCamera(selectedProduct.category) : false

    return (
        <div className="space-y-6">
            {/* Header with Save Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Product Pricing Calculator</h2>
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedProduct}
                    className="px-4 py-2 bg-brand-blue-900 text-white rounded-lg hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {saveMessage.text}
                </div>
            )}

            {/* Description */}
            <p className="text-gray-600">
                Set fixed ₹ deductions/additions for each product and issue. These amounts are subtracted/added directly from the base price.
            </p>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Brand</label>
                        <select
                            value={selectedBrand}
                            onChange={(e) => handleBrandChange(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
                            disabled={selectedCategory === 'All'}
                        >
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                        <select
                            value={selectedProduct?.id || ''}
                            onChange={(e) => handleProductSelect(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none bg-white"
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
            </div>

            {/* Product Info Card */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-brand-blue-900">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedProduct.modelName}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Display Price:</span>
                            <span className="text-lg font-semibold text-gray-900">₹{selectedProduct.basePrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Internal Base Price:</span>
                            <span className="text-lg font-semibold text-gray-900">₹{(selectedProduct.internalBasePrice || selectedProduct.basePrice * 0.5).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Question Deductions */}
            {selectedProduct && questions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Assessment Question Deductions (₹)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Enter the amount to SUBTRACT when user answers 'No' to each assessment question.
                    </p>
                    <div className="space-y-4">
                        {questions.map((question) => (
                            <div key={question.key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {question.label}
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Yes Value (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingRules.questions[question.key].yes}
                                            onChange={(e) => handleQuestionUpdate(question.key, 'yes', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">No Value (₹)</label>
                                        <input
                                            type="number"
                                            value={pricingRules.questions[question.key].no}
                                            onChange={(e) => handleQuestionUpdate(question.key, 'no', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Physical Condition Deductions */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Physical Condition Deductions (₹)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Enter the amount to SUBTRACT for each physical condition option (Excellent, Good, Fair, Cracked, etc.).
                    </p>
                    <div className="space-y-6">
                        {/* Display Condition */}
                        {showDisplayCondition && (
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Display Condition</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(pricingRules.displayCondition).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-600 mb-1 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleConditionUpdate('displayCondition', key, parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Body Condition */}
                        <div>
                            <h4 className="font-medium text-gray-800 mb-3">Body Condition</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(pricingRules.bodyCondition).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-sm text-gray-600 mb-1 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => handleConditionUpdate('bodyCondition', key, parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lens Condition - Only for cameras */}
                        {showLensCondition && (
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Lens Condition</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {Object.entries(pricingRules.lensCondition).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-600 mb-1 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleConditionUpdate('lensCondition', key, parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Condition - Only for cameras */}
                        {showErrorCondition && (
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">Error Condition</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(pricingRules.errorCondition).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-600 mb-1 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleConditionUpdate('errorCondition', key, parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Functional Issues Deductions */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Functional Issues Deductions (₹)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Enter the amount to SUBTRACT for each functional issue. Negative values deduct from price, positive values add to price.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(pricingRules.functionalIssues).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                    {key === 'noIssues' ? 'No Functional Issues' : key.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => {
                                        setPricingRules(prev => ({
                                            ...prev,
                                            functionalIssues: {
                                                ...prev.functionalIssues,
                                                [key]: parseInt(e.target.value) || 0
                                            }
                                        }))
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Accessories Additions */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Accessories Additions (₹)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Enter the amount to ADD for each accessory. Positive values add to the price, negative values deduct from price.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(pricingRules.accessories).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => {
                                        setPricingRules(prev => ({
                                            ...prev,
                                            accessories: {
                                                ...prev.accessories,
                                                [key]: parseInt(e.target.value) || 0
                                            }
                                        }))
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Device Age Deductions */}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Device Age Deductions (₹)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Enter the amount to SUBTRACT for each age range. Negative values deduct from price, positive values add to price.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(pricingRules.age).map(([key, value]) => {
                            const ageLabels: Record<string, string> = {
                                lessThan3Months: 'Less than 3 months',
                                fourToTwelveMonths: '4 to 12 months',
                                aboveTwelveMonths: 'Above 12 months'
                            }
                            return (
                                <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {ageLabels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => {
                                            setPricingRules(prev => ({
                                                ...prev,
                                                age: {
                                                    ...prev.age,
                                                    [key]: parseInt(e.target.value) || 0
                                                }
                                            }))
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!selectedProduct && (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                    <p className="text-gray-500">Please select a product to configure pricing rules.</p>
                </div>
            )}
        </div>
    )
}
