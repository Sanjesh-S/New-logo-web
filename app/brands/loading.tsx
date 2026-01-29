import Navigation from '@/components/Navigation'
import { BrandsGridSkeleton } from '@/components/ui/Skeleton'

export default function BrandsLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50">
      <Navigation />
      <div className="min-h-screen py-8 md:py-12 px-4 pt-24 md:pt-28">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8 md:mb-10">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
            <div className="h-14 w-96 bg-gray-200 rounded-xl animate-pulse mb-2" />
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Search bar skeleton */}
          <div className="mb-8 md:mb-10">
            <div className="relative max-w-2xl mx-auto">
              <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Or choose a brand text */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-4 max-w-2xl mx-auto">
              <div className="flex-1 h-px bg-gray-300" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          </div>

          {/* Brands grid skeleton */}
          <BrandsGridSkeleton count={5} />
        </div>
      </div>
    </main>
  )
}
