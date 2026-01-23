'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, SlidersHorizontal, ArrowUpDown, TrendingUp, Clock } from 'lucide-react'
import type { Product } from '@/lib/firebase/database'

export type SortOption = 'relevance' | 'price-high' | 'price-low' | 'name-asc' | 'name-desc' | 'popularity'
export type FilterOption = {
  priceRange?: { min: number; max: number }
  category?: string
  brand?: string
}

interface EnhancedSearchProps {
  products: Product[]
  onFilteredProductsChange?: (products: Product[]) => void
  onSearchQueryChange?: (query: string) => void
  placeholder?: string
  showSuggestions?: boolean
  showFilters?: boolean
  showSort?: boolean
}

export default function EnhancedSearch({
  products,
  onFilteredProductsChange,
  onSearchQueryChange,
  placeholder = 'Search for devices, brands, or models...',
  showSuggestions = true,
  showFilters = true,
  showSort = true,
}: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Generate search suggestions based on products
  useEffect(() => {
    if (searchQuery.trim().length > 0 && showSuggestions) {
      const query = searchQuery.toLowerCase()
      const productNames = products.map(p => p.modelName.toLowerCase())
      const brands = [...new Set(products.map(p => p.brand.toLowerCase()))]
      
      const matches = [
        ...productNames.filter(name => name.includes(query)),
        ...brands.filter(brand => brand.includes(query)),
      ].slice(0, 5)
      
      setSuggestions(matches)
      setShowSuggestionsDropdown(true)
    } else {
      setSuggestions([])
      setShowSuggestionsDropdown(false)
    }
  }, [searchQuery, products, showSuggestions])

  // Calculate price range from products
  const priceRangeData = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    const prices = products.map(p => p.basePrice)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [products])

  // Initialize price range
  useEffect(() => {
    if (!priceRange && priceRangeData.max > 0) {
      setPriceRange({ min: priceRangeData.min, max: priceRangeData.max })
    }
  }, [priceRangeData, priceRange])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((product) => {
        const modelMatch = product.modelName.toLowerCase().includes(query)
        const brandMatch = product.brand.toLowerCase().includes(query)
        const categoryMatch = product.category?.toLowerCase().includes(query)
        return modelMatch || brandMatch || categoryMatch
      })
    }

    // Price filter
    if (priceRange) {
      result = result.filter(
        (product) =>
          product.basePrice >= priceRange.min && product.basePrice <= priceRange.max
      )
    }

    // Sort
    switch (sortBy) {
      case 'price-high':
        result.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'price-low':
        result.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'name-asc':
        result.sort((a, b) => a.modelName.localeCompare(b.modelName))
        break
      case 'name-desc':
        result.sort((a, b) => b.modelName.localeCompare(a.modelName))
        break
      case 'popularity':
        // For now, sort by price (can be enhanced with actual popularity data)
        result.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'relevance':
      default:
        // Relevance: exact matches first, then partial matches
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          result.sort((a, b) => {
            const aExact = a.modelName.toLowerCase() === query || a.brand.toLowerCase() === query
            const bExact = b.modelName.toLowerCase() === query || b.brand.toLowerCase() === query
            if (aExact && !bExact) return -1
            if (!aExact && bExact) return 1
            return 0
          })
        }
        break
    }

    return result
  }, [products, searchQuery, priceRange, sortBy])

  // Notify parent of filtered products
  useEffect(() => {
    onFilteredProductsChange?.(filteredProducts)
  }, [filteredProducts, onFilteredProductsChange])

  // Notify parent of search query
  useEffect(() => {
    onSearchQueryChange?.(searchQuery)
  }, [searchQuery, onSearchQueryChange])

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestionsDropdown(false)
    saveRecentSearch(suggestion)
  }

  // Save recent search
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    
    const updated = [
      query,
      ...recentSearches.filter(s => s !== query),
    ].slice(0, 5)
    
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery)
      setShowSuggestionsDropdown(false)
      searchInputRef.current?.blur()
    }
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setShowSuggestionsDropdown(false)
    searchInputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || recentSearches.length > 0) {
                setShowSuggestionsDropdown(true)
              }
            }}
            placeholder={placeholder}
            className="w-full pl-12 pr-20 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 shadow-sm transition-all text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                showFilterPanel || priceRange
                  ? 'bg-brand-lime text-brand-blue-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestionsDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
          >
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-brand-lime/10 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && searchQuery.trim().length === 0 && (
              <div className="p-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-2 text-left hover:bg-brand-lime/10 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute z-40 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange?.min.toLocaleString('en-IN')} - ₹{priceRange?.max.toLocaleString('en-IN')}
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min={priceRangeData.min}
                    max={priceRangeData.max}
                    value={priceRange?.min || priceRangeData.min}
                    onChange={(e) =>
                      setPriceRange({
                        min: parseInt(e.target.value) || priceRangeData.min,
                        max: priceRange?.max || priceRangeData.max,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min={priceRangeData.min}
                    max={priceRangeData.max}
                    value={priceRange?.max || priceRangeData.max}
                    onChange={(e) =>
                      setPriceRange({
                        min: priceRange?.min || priceRangeData.min,
                        max: parseInt(e.target.value) || priceRangeData.max,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime"
                    placeholder="Max"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPriceRange({ min: priceRangeData.min, max: priceRangeData.max })
                }}
                className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort and Results Count */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        {showSort && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-lime bg-white"
            >
              <option value="relevance">Relevance</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
