'use client'

import { useState, useEffect } from 'react'
import { getAllProducts, type Product, getPricingRules, savePricingRules, saveProductPricingRules, getProductById, saveProductPricingToCollection, getProductPricingFromCollection } from '@/lib/firebase/database'
import { PricingRules, ZERO_PRICING_RULES } from '@/lib/types/pricing'
import { getCurrentUser } from '@/lib/firebase/auth'

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
}

function PricingInput({ label, value, onChange, description }: PricingInputProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none transition-all bg-white"
                />
            </div>
        </div>
    )
}

export default function PricingCalculator() {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [selectedBrand, setSelectedBrand] = useState<string>('All')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [pricingRules, setPricingRules] = useState<PricingRules>(ZERO_PRICING_RULES)
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
                    return
                }

                const productWithRules = await getProductById(selectedProduct.id)
                if (productWithRules?.pricingRules) {
                    setPricingRules(productWithRules.pricingRules)
                } else {
                    const globalRules = await getPricingRules()
                    setPricingRules(globalRules)
                }
            } catch (error) {
                console.error('Error loading product rules:', error)
                try {
                    setPricingRules(await getPricingRules())
                } catch (e) {
                    console.error('Error loading global rules:', e)
                    setPricingRules(ZERO_PRICING_RULES)
                }
            }
        }
        loadProductRules()
    }, [selectedProduct])

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
                await saveProductPricingRules(selectedProduct.id, pricingRules)
                await saveProductPricingToCollection(selectedProduct.id, selectedProduct, pricingRules, updatedBy)
                setSaveMessage({ type: 'success', text: `Pricing rules saved for ${selectedProduct.modelName}!` })
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
                    <div className="mt-6 p-4 bg-gradient-to-r from-brand-blue-50 to-emerald-50 rounded-xl border border-brand-blue-100">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900">{selectedProduct.modelName}</h4>
                                <p className="text-sm text-gray-600">{selectedProduct.brand} • {selectedProduct.category}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Internal Base Price</p>
                                <p className="text-xl font-bold text-brand-blue-900">₹{(selectedProduct.internalBasePrice || selectedProduct.basePrice * 0.75).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
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
                            <PricingInput label="Power on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} />
                            <PricingInput label="Camera/Function? (No)" value={pricingRules.questions.cameraFunction?.no || 0} onChange={(v) => handleQuestionUpdate('cameraFunction', 'no', v)} />
                            <PricingInput label="Buttons working? (No)" value={pricingRules.questions.buttonsWorking?.no || 0} onChange={(v) => handleQuestionUpdate('buttonsWorking', 'no', v)} />
                            <PricingInput label="Water damage? (No)" value={pricingRules.questions.waterDamage?.no || 0} onChange={(v) => handleQuestionUpdate('waterDamage', 'no', v)} />
                            <PricingInput label="Flash working? (No)" value={pricingRules.questions.flashWorking?.no || 0} onChange={(v) => handleQuestionUpdate('flashWorking', 'no', v)} />
                            <PricingInput label="Memory card slot? (No)" value={pricingRules.questions.memoryCardSlotWorking?.no || 0} onChange={(v) => handleQuestionUpdate('memoryCardSlotWorking', 'no', v)} />
                            <PricingInput label="Speaker working? (No)" value={pricingRules.questions.speakerWorking?.no || 0} onChange={(v) => handleQuestionUpdate('speakerWorking', 'no', v)} />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Global default – Body & display" badge="Global" badgeColor="bg-gray-200 text-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Body: Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} />
                            <PricingInput label="Body: Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} />
                            <PricingInput label="Body: Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} />
                            <PricingInput label="Body: Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} />
                            <PricingInput label="Display: Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} />
                            <PricingInput label="Display: Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} />
                            <PricingInput label="Display: Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} />
                            <PricingInput label="Display: Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Global default – Accessories & age" badge="Global" badgeColor="bg-gray-200 text-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Battery" value={pricingRules.accessories?.battery || 0} onChange={(v) => handleConditionUpdate('accessories', 'battery', v)} />
                            <PricingInput label="Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} />
                            <PricingInput label="Age: &lt;3 months" value={pricingRules.age?.lessThan3Months || 0} onChange={(v) => handleConditionUpdate('age', 'lessThan3Months', v)} />
                            <PricingInput label="Age: 4–12 months" value={pricingRules.age?.fourToTwelveMonths || 0} onChange={(v) => handleConditionUpdate('age', 'fourToTwelveMonths', v)} />
                            <PricingInput label="Age: &gt;12 months" value={pricingRules.age?.aboveTwelveMonths || 0} onChange={(v) => handleConditionUpdate('age', 'aboveTwelveMonths', v)} />
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
                            />
                            <PricingInput
                                label="Camera functions properly? (No)"
                                value={pricingRules.questions.cameraFunction?.no || 0}
                                onChange={(v) => handleQuestionUpdate('cameraFunction', 'no', v)}
                                description="Deduct if photo/video doesn't work"
                            />
                            <PricingInput
                                label="All buttons working? (No)"
                                value={pricingRules.questions.buttonsWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('buttonsWorking', 'no', v)}
                                description="Deduct if buttons are not working"
                            />
                            <PricingInput
                                label="Free from water damage? (No)"
                                value={pricingRules.questions.waterDamage?.no || 0}
                                onChange={(v) => handleQuestionUpdate('waterDamage', 'no', v)}
                                description="Deduct if device has water damage"
                            />
                            <PricingInput
                                label="Flash working? (No)"
                                value={pricingRules.questions.flashWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('flashWorking', 'no', v)}
                                description="Deduct if flash doesn't work"
                            />
                            <PricingInput
                                label="Memory card slot working? (No)"
                                value={pricingRules.questions.memoryCardSlotWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('memoryCardSlotWorking', 'no', v)}
                                description="Deduct if memory card slot is faulty"
                            />
                            <PricingInput
                                label="Speaker working? (No)"
                                value={pricingRules.questions.speakerWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('speakerWorking', 'no', v)}
                                description="Deduct if speaker doesn't work"
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
                            />
                            <PricingInput
                                label="Average"
                                value={pricingRules.bodyPhysicalCondition?.average || 0}
                                onChange={(v) => handleConditionUpdate('bodyPhysicalCondition', 'average', v)}
                                description="Minor scratches or normal wear"
                            />
                            <PricingInput
                                label="Worn"
                                value={pricingRules.bodyPhysicalCondition?.worn || 0}
                                onChange={(v) => handleConditionUpdate('bodyPhysicalCondition', 'worn', v)}
                                description="Visible dents or deep scratches"
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
                            />
                            <PricingInput
                                label="Fair"
                                value={pricingRules.lcdDisplayCondition?.fair || 0}
                                onChange={(v) => handleConditionUpdate('lcdDisplayCondition', 'fair', v)}
                                description="Minor scratches or marks"
                            />
                            <PricingInput
                                label="Poor"
                                value={pricingRules.lcdDisplayCondition?.poor || 0}
                                onChange={(v) => handleConditionUpdate('lcdDisplayCondition', 'poor', v)}
                                description="Cracked screen or vintage"
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
                            />
                            <PricingInput
                                label="Fair"
                                value={pricingRules.rubberGripsCondition?.fair || 0}
                                onChange={(v) => handleConditionUpdate('rubberGripsCondition', 'fair', v)}
                                description="USB/Port covers are missing"
                            />
                            <PricingInput
                                label="Poor"
                                value={pricingRules.rubberGripsCondition?.poor || 0}
                                onChange={(v) => handleConditionUpdate('rubberGripsCondition', 'poor', v)}
                                description="Handgrip rubber is loose or missing"
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
                            />
                            <PricingInput
                                label="Minor"
                                value={pricingRules.sensorViewfinderCondition?.minor || 0}
                                onChange={(v) => handleConditionUpdate('sensorViewfinderCondition', 'minor', v)}
                                description="Light dust or small fungus spots"
                            />
                            <PricingInput
                                label="Major"
                                value={pricingRules.sensorViewfinderCondition?.major || 0}
                                onChange={(v) => handleConditionUpdate('sensorViewfinderCondition', 'major', v)}
                                description="Heavy fungus, haze, or thick dust"
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
                            />
                            <PricingInput
                                label="Intermittent"
                                value={pricingRules.errorCodesCondition?.intermittent || 0}
                                onChange={(v) => handleConditionUpdate('errorCodesCondition', 'intermittent', v)}
                                description="Error messages appear occasionally"
                            />
                            <PricingInput
                                label="Persistent"
                                value={pricingRules.errorCodesCondition?.persistent || 0}
                                onChange={(v) => handleConditionUpdate('errorCodesCondition', 'persistent', v)}
                                description="Error messages appear frequently"
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
                                    />
                                    <PricingInput
                                        label="No - No lens"
                                        value={pricingRules.questions.hasLensToSell?.no || 0}
                                        onChange={(v) => handleQuestionUpdate('hasLensToSell', 'no', v)}
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
                                    />
                                    <PricingInput
                                        label="Minor Fungus/Dust"
                                        value={pricingRules.fungusDustCondition?.minorFungus || 0}
                                        onChange={(v) => handleConditionUpdate('fungusDustCondition', 'minorFungus', v)}
                                    />
                                    <PricingInput
                                        label="Major Fungus/Dust"
                                        value={pricingRules.fungusDustCondition?.majorFungus || 0}
                                        onChange={(v) => handleConditionUpdate('fungusDustCondition', 'majorFungus', v)}
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
                                    />
                                    <PricingInput
                                        label="AF Issue Only"
                                        value={pricingRules.focusFunctionality?.afIssue || 0}
                                        onChange={(v) => handleConditionUpdate('focusFunctionality', 'afIssue', v)}
                                    />
                                    <PricingInput
                                        label="MF Issue Only"
                                        value={pricingRules.focusFunctionality?.mfIssue || 0}
                                        onChange={(v) => handleConditionUpdate('focusFunctionality', 'mfIssue', v)}
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
                                    />
                                    <PricingInput
                                        label="Minor Wear/Damage"
                                        value={pricingRules.rubberRingCondition?.minorRubber || 0}
                                        onChange={(v) => handleConditionUpdate('rubberRingCondition', 'minorRubber', v)}
                                    />
                                    <PricingInput
                                        label="Major Damage"
                                        value={pricingRules.rubberRingCondition?.majorRubber || 0}
                                        onChange={(v) => handleConditionUpdate('rubberRingCondition', 'majorRubber', v)}
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
                                    />
                                    <PricingInput
                                        label="Occasional Errors"
                                        value={pricingRules.lensErrorStatus?.occasionalErrors || 0}
                                        onChange={(v) => handleConditionUpdate('lensErrorStatus', 'occasionalErrors', v)}
                                    />
                                    <PricingInput
                                        label="Frequent Errors"
                                        value={pricingRules.lensErrorStatus?.frequentErrors || 0}
                                        onChange={(v) => handleConditionUpdate('lensErrorStatus', 'frequentErrors', v)}
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
                            />
                            <PricingInput
                                label="Original Charger"
                                value={pricingRules.accessories?.charger || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'charger', v)}
                            />
                            <PricingInput
                                label="Box"
                                value={pricingRules.accessories?.box || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'box', v)}
                            />
                            <PricingInput
                                label="Bill"
                                value={pricingRules.accessories?.bill || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'bill', v)}
                            />
                            <PricingInput
                                label="Warranty Card"
                                value={pricingRules.accessories?.warrantyCard || 0}
                                onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)}
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
                            <PricingInput
                                label="Does the phone Power on? (No)"
                                value={pricingRules.questions.powerOn?.no || 0}
                                onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)}
                                description="Deduct if device doesn't power on without charger"
                            />
                            <PricingInput
                                label="Does the camera Function properly? (No)"
                                value={pricingRules.questions.cameraWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('cameraWorking', 'no', v)}
                                description="Deduct if lenses, flash, or sensor have issues"
                            />
                            <PricingInput
                                label="Face ID working properly? (No)"
                                value={pricingRules.questions.biometricWorking?.no || 0}
                                onChange={(v) => handleQuestionUpdate('biometricWorking', 'no', v)}
                                description="Deduct if Face ID shows Hardware Issue"
                            />
                            <PricingInput
                                label="True Tone available in Control Center? (No)"
                                value={pricingRules.questions.trueTone?.no || 0}
                                onChange={(v) => handleQuestionUpdate('trueTone', 'no', v)}
                                description="Deduct if True Tone not available (brightness slider)"
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition" description="Screen/Display physical condition (phone options)">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Good Working" value={pricingRules.displayCondition?.goodWorking ?? pricingRules.displayCondition?.good ?? 0} onChange={(v) => handleConditionUpdate('displayCondition', 'goodWorking', v)} />
                            <PricingInput label="Minor crack" value={pricingRules.displayCondition?.minorCrack ?? pricingRules.displayCondition?.fair ?? 0} onChange={(v) => handleConditionUpdate('displayCondition', 'minorCrack', v)} />
                            <PricingInput label="Major damage" value={pricingRules.displayCondition?.majorDamage ?? 0} onChange={(v) => handleConditionUpdate('displayCondition', 'majorDamage', v)} />
                            <PricingInput label="Not Working" value={pricingRules.displayCondition?.notWorking ?? pricingRules.displayCondition?.cracked ?? 0} onChange={(v) => handleConditionUpdate('displayCondition', 'notWorking', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Battery health" description="Phone battery health range">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="90% above" value={pricingRules.batteryHealthRange?.battery90Above ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery90Above', v)} />
                            <PricingInput label="80% to 90%" value={pricingRules.batteryHealthRange?.battery80to90 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery80to90', v)} />
                            <PricingInput label="50% to 80%" value={pricingRules.batteryHealthRange?.battery50to80 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'battery50to80', v)} />
                            <PricingInput label="Below 50%" value={pricingRules.batteryHealthRange?.batteryBelow50 ?? 0} onChange={(v) => handleConditionUpdate('batteryHealthRange', 'batteryBelow50', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Camera condition" description="Phone camera condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Good Condition" value={pricingRules.cameraCondition?.cameraGood ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'cameraGood', v)} />
                            <PricingInput label="Front camera not working" value={pricingRules.cameraCondition?.frontCameraNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'frontCameraNotWorking', v)} />
                            <PricingInput label="Back camera not working" value={pricingRules.cameraCondition?.backCameraNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'backCameraNotWorking', v)} />
                            <PricingInput label="Both not working" value={pricingRules.cameraCondition?.bothCamerasNotWorking ?? 0} onChange={(v) => handleConditionUpdate('cameraCondition', 'bothCamerasNotWorking', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition" description="Device body/frame physical condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} />
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
                                />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} />
                            <PricingInput label="Original Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} />
                            <PricingInput label="Original Cable" value={pricingRules.accessories?.cable || 0} onChange={(v) => handleConditionUpdate('accessories', 'cable', v)} />
                            <PricingInput label="Original manual" value={pricingRules.accessories?.manual || 0} onChange={(v) => handleConditionUpdate('accessories', 'manual', v)} />
                            <PricingInput label="Phone case" value={pricingRules.accessories?.case || 0} onChange={(v) => handleConditionUpdate('accessories', 'case', v)} />
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
                            <PricingInput label="Laptop powers on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} />
                            <PricingInput label="Screen free from issues? (No)" value={pricingRules.questions.screenCondition?.no || 0} onChange={(v) => handleQuestionUpdate('screenCondition', 'no', v)} />
                            <PricingInput label="Keyboard & trackpad working? (No)" value={pricingRules.questions.keyboardWorking?.no || 0} onChange={(v) => handleQuestionUpdate('keyboardWorking', 'no', v)} />
                            <PricingInput label="Body free from damage? (No)" value={pricingRules.questions.bodyDamage?.no || 0} onChange={(v) => handleQuestionUpdate('bodyDamage', 'no', v)} />
                            <PricingInput label="Battery cycle under 300? (No)" value={pricingRules.questions.batteryCycleCount?.no || 0} onChange={(v) => handleQuestionUpdate('batteryCycleCount', 'no', v)} />
                            <PricingInput label="All ports working? (No)" value={pricingRules.questions.portsWorking?.no || 0} onChange={(v) => handleQuestionUpdate('portsWorking', 'no', v)} />
                            <PricingInput label="Charging properly? (No)" value={pricingRules.questions.chargingWorking?.no || 0} onChange={(v) => handleQuestionUpdate('chargingWorking', 'no', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} />
                            <PricingInput label="Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} />
                            <PricingInput label="Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} />
                            <PricingInput label="Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Functional Issues">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(pricingRules.functionalIssues || {}).map(([key, value]) => (
                                <PricingInput key={key} label={key === 'noIssues' ? 'No Issues' : key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => handleConditionUpdate('functionalIssues', key, v)} />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} />
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
                            <PricingInput label="Tablet powers on? (No)" value={pricingRules.questions.powerOn?.no || 0} onChange={(v) => handleQuestionUpdate('powerOn', 'no', v)} />
                            <PricingInput label="Body free from major damage? (No)" value={pricingRules.questions.bodyDamage?.no || 0} onChange={(v) => handleQuestionUpdate('bodyDamage', 'no', v)} />
                            <PricingInput label="Screen/touchscreen working? (No)" value={pricingRules.questions.lcdWorking?.no || 0} onChange={(v) => handleQuestionUpdate('lcdWorking', 'no', v)} />
                            <PricingInput label="Battery holding charge? (No)" value={pricingRules.questions.batteryWorking?.no || 0} onChange={(v) => handleQuestionUpdate('batteryWorking', 'no', v)} />
                            <PricingInput label="Cameras working? (No)" value={pricingRules.questions.cameraWorking?.no || 0} onChange={(v) => handleQuestionUpdate('cameraWorking', 'no', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Display Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.displayCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'excellent', v)} />
                            <PricingInput label="Good" value={pricingRules.displayCondition?.good || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'good', v)} />
                            <PricingInput label="Fair" value={pricingRules.displayCondition?.fair || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'fair', v)} />
                            <PricingInput label="Cracked" value={pricingRules.displayCondition?.cracked || 0} onChange={(v) => handleConditionUpdate('displayCondition', 'cracked', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Body Condition">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <PricingInput label="Excellent" value={pricingRules.bodyCondition?.excellent || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'excellent', v)} />
                            <PricingInput label="Good" value={pricingRules.bodyCondition?.good || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'good', v)} />
                            <PricingInput label="Fair" value={pricingRules.bodyCondition?.fair || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'fair', v)} />
                            <PricingInput label="Poor" value={pricingRules.bodyCondition?.poor || 0} onChange={(v) => handleConditionUpdate('bodyCondition', 'poor', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Functional Issues">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(pricingRules.functionalIssues || {}).map(([key, value]) => (
                                <PricingInput key={key} label={key === 'noIssues' ? 'No Issues' : key.replace(/([A-Z])/g, ' $1').trim()} value={value} onChange={(v) => handleConditionUpdate('functionalIssues', key, v)} />
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Accessories (Bonus)" badge="Bonus" badgeColor="bg-green-100 text-green-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PricingInput label="Original Charger" value={pricingRules.accessories?.charger || 0} onChange={(v) => handleConditionUpdate('accessories', 'charger', v)} />
                            <PricingInput label="Box" value={pricingRules.accessories?.box || 0} onChange={(v) => handleConditionUpdate('accessories', 'box', v)} />
                            <PricingInput label="Bill" value={pricingRules.accessories?.bill || 0} onChange={(v) => handleConditionUpdate('accessories', 'bill', v)} />
                            <PricingInput label="Warranty Card" value={pricingRules.accessories?.warrantyCard || 0} onChange={(v) => handleConditionUpdate('accessories', 'warrantyCard', v)} />
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
                        />
                        <PricingInput
                            label="4 to 12 months"
                            value={pricingRules.age?.fourToTwelveMonths || 0}
                            onChange={(v) => handleConditionUpdate('age', 'fourToTwelveMonths', v)}
                        />
                        <PricingInput
                            label="Above 12 months"
                            value={pricingRules.age?.aboveTwelveMonths || 0}
                            onChange={(v) => handleConditionUpdate('age', 'aboveTwelveMonths', v)}
                        />
                    </div>
                </CollapsibleSection>
            )}
        </div>
    )
}
