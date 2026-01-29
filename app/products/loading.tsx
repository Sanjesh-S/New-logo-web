import Navigation from '@/components/Navigation'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="min-h-screen bg-white pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8 md:mb-12 text-center">
            <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-6" />
          </header>
          <div className="mb-8 md:mb-10">
            <div className="relative max-w-2xl mx-auto">
              <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
          <ProductGridSkeleton count={10} />
        </div>
      </div>
    </main>
  )
}
