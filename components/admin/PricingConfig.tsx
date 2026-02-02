'use client'

// ... (previous imports)
import { useState, useEffect } from 'react'
import { getPricingRules, savePricingRules, getAllProducts, type Product, saveProductPricingRules } from '@/lib/firebase/database'
import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'

export default function PricingConfig() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [globalRules, setGlobalRules] = useState<PricingRules | null>(null)
    const [editRules, setEditRules] = useState<PricingRules | null>(null) // Rules currently being edited
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('questions')

    useEffect(() => {
        loadInitialData()
    }, [])

    // When product changes, update editRules
    useEffect(() => {
        if (selectedProduct) {
            // If product has rules, use them. Else use global rules.
            if (selectedProduct.pricingRules) {
                setEditRules(selectedProduct.pricingRules)
            } else if (globalRules) {
                setEditRules(globalRules)
            }
        } else {
            // If no product selected, we are editing global rules
            if (globalRules) {
                setEditRules(globalRules)
            }
        }
    }, [selectedProduct, globalRules])

    const loadInitialData = async () => {
        try {
            const [rulesData, productsData] = await Promise.all([
                getPricingRules(),
                getAllProducts()
            ])
            setGlobalRules(rulesData)
            setProducts(productsData)
            setEditRules(rulesData) // Default to global
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!editRules) return
        setSaving(true)
        try {
            if (selectedProduct) {
                // Save to Product
                await saveProductPricingRules(selectedProduct.id, editRules)
                // Update local state to reflect saved changes
                const updatedProduct = { ...selectedProduct, pricingRules: editRules }
                setSelectedProduct(updatedProduct) // Update selected product reference
                setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)) // Update list
                alert(`Pricing rules saved for ${selectedProduct.modelName}!`)
            } else {
                // Save Global
                await savePricingRules(editRules)
                setGlobalRules(editRules)
                alert('Global pricing rules saved successfully!')
            }
        } catch (error) {
            console.error('Error saving rules:', error)
            alert('Failed to save rules')
        } finally {
            setSaving(false)
        }
    }

    const updateQuestion = (key: keyof PricingRules['questions'], field: 'yes' | 'no', value: number) => {
        if (!editRules) return
        setEditRules({
            ...editRules,
            questions: {
                ...editRules.questions,
                [key]: { ...editRules.questions[key], [field]: value }
            }
        })
    }

    const updateNested = (category: keyof PricingRules, subCategory: string, value: number) => {
        if (!editRules) return
        setEditRules({
            ...editRules,
            [category]: {
                ...editRules[category] as any,
                [subCategory]: value
            }
        })
    }

    const updateNestedCondition = (category: 'lensCondition' | 'displayCondition' | 'bodyCondition' | 'errorCondition' | 'bodyPhysicalCondition' | 'lcdDisplayCondition' | 'rubberGripsCondition' | 'sensorViewfinderCondition' | 'errorCodesCondition', subCategory: string, value: number) => {
        if (!editRules) return
        setEditRules({
            ...editRules,
            [category]: {
                ...editRules[category],
                [subCategory]: value
            }
        })
    }

    if (loading) return <div>Loading configuration...</div>
    if (!editRules) return <div>Error loading configuration</div>

    const filteredProducts = products.filter(p =>
        p.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Helper to check if category matches
    const isCategory = (keyword: string) => {
        if (!selectedProduct) return true // Show all if global
        const cat = selectedProduct.category.toLowerCase()
        if (keyword === 'phone') return cat.includes('phone')
        if (keyword === 'laptop') return cat.includes('laptop') || cat.includes('macbook')
        if (keyword === 'tablet') return cat.includes('tablet') || cat.includes('ipad')
        if (keyword === 'camera') return cat.includes('camera') || cat.includes('dslr')
        return true
    }

    // ... (tabs definition - same as before)
    const tabs = [
        { id: 'questions', label: 'Assessment Questions' },
        { id: 'condition', label: 'Physical Condition' },
        { id: 'issues', label: 'Functional Issues' },
        { id: 'accessories', label: 'Accessories' },
        { id: 'age', label: 'Age' },
    ]

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                    {selectedProduct ? `Pricing: ${selectedProduct.modelName}` : 'Global Pricing Configuration'}
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Product Selection */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Product to Configure (Leave empty for Global Defaults)</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search product to override..."
                        className="w-full px-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && !selectedProduct && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    className="p-2 cursor-pointer hover:bg-blue-50"
                                    onClick={() => {
                                        setSelectedProduct(p)
                                        setSearchTerm('')
                                    }}
                                >
                                    <div className="font-medium">{p.modelName}</div>
                                    <div className="text-xs text-gray-500">{p.brand} - {p.category}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedProduct && (
                    <div className="mt-2 flex items-center justify-between bg-blue-50 p-3 rounded text-blue-800">
                        <span className="font-medium">Selected: {selectedProduct.modelName}</span>
                        <button
                            onClick={() => { setSelectedProduct(null); setSearchTerm(''); }}
                            className="text-sm underline hover:text-blue-900"
                        >
                            Clear Selection (Edit Global)
                        </button>
                    </div>
                )}
            </div>

            <div className="flex space-x-1 border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 whitespace-nowrap border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === 'questions' && (
                    <div className="grid gap-6">
                        <h3 className="font-semibold text-lg">Yes/No Questions</h3>
                        {Object.entries(editRules.questions).map(([key, value]) => {
                            // Simple visibility logic if needed, currently showing all generic ones
                            // Could add specific Key checks vs Category here if strict filtering needed
                            return (
                                <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="font-medium capitalize mb-3 text-gray-900">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Yes Value (₹)</label>
                                            <input
                                                type="number"
                                                value={value.yes}
                                                onChange={(e) => updateQuestion(key as any, 'yes', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">No Value (₹)</label>
                                            <input
                                                type="number"
                                                value={value.no}
                                                onChange={(e) => updateQuestion(key as any, 'no', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {activeTab === 'condition' && (
                    <div className="space-y-8">
                        {/* Show Lens only for Camera/Global */}
                        {(isCategory('camera')) && (
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Lens Condition</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(editRules.lensCondition).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => updateNestedCondition('lensCondition', key, parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Display - All except Generic? Usually Phone/Laptop/Tablet */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Display/Screen Condition</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(editRules.displayCondition).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateNestedCondition('displayCondition', key, parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-4">Body Condition</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(editRules.bodyCondition).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateNestedCondition('bodyCondition', key, parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Error Codes - Usually Camera */}
                        {(isCategory('camera')) && (
                            <div>
                                <h3 className="font-semibold text-lg mb-4">Error Condition</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(editRules.errorCondition).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => updateNestedCondition('errorCondition', key, parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Body Conditions - Camera Only */}
                        {(isCategory('camera')) && (
                            <>
                                <div>
                                    <h3 className="font-semibold text-lg mb-4">Body Physical Condition</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(editRules.bodyPhysicalCondition || {}).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updateNestedCondition('bodyPhysicalCondition', key, parseInt(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-4">LCD Display Condition</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(editRules.lcdDisplayCondition || {}).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updateNestedCondition('lcdDisplayCondition', key, parseInt(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-4">Rubber Grips Condition</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(editRules.rubberGripsCondition || {}).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updateNestedCondition('rubberGripsCondition', key, parseInt(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-4">Sensor/Viewfinder Condition</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(editRules.sensorViewfinderCondition || {}).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updateNestedCondition('sensorViewfinderCondition', key, parseInt(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-4">Error Codes Condition</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(editRules.errorCodesCondition || {}).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="block text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updateNestedCondition('errorCodesCondition', key, parseInt(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'issues' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(editRules.functionalIssues).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block font-medium text-gray-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateNested('functionalIssues', key, parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                        ))}
                    </div>
                )}
                {/* ... Accessories and Age tabs similarly rendered ... */}
                {activeTab === 'accessories' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(editRules.accessories).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block font-medium text-gray-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateNested('accessories', key, parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'age' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(editRules.age).map(([key, value]) => (
                            <div key={key} className="p-4 border rounded-lg bg-gray-50">
                                <label className="block font-medium text-gray-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateNested('age', key, parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
