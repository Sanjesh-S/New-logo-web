import { generateMetadata as genMeta } from '@/lib/utils/seo'

export function generateMetadata() {
  return genMeta({
    title: 'Browse Products - Trade In Your Devices',
    description: 'Browse our catalog of cameras, phones, laptops, and tablets. Get instant valuation for your devices.',
    keywords: ['trade in', 'device trade', 'sell phone', 'sell camera', 'sell laptop', 'device valuation'],
    url: '/products',
  })
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
