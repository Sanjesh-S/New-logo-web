'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <Skeleton className="w-full aspect-square rounded-lg mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BrandCardSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-white/90 border-2 border-gray-200 rounded-2xl w-[140px] md:w-[160px] h-[140px] md:h-[160px] flex flex-col items-center justify-center">
      <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-xl mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function BrandsGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 px-2">
      {Array.from({ length: count }).map((_, i) => (
        <BrandCardSkeleton key={i} />
      ))}
    </div>
  )
}
