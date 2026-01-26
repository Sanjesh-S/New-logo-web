import type { Metadata } from 'next'

export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'product' | 'article'
  siteName?: string
}

export function generateMetadata(data: SEOData): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    siteName = 'WorthyTen',
  } = data

  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const defaultImage = image || '/images/worthyten-logo.png'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worthyten.com'
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl

  // Map 'product' type to 'website' for OpenGraph compatibility
  const openGraphType = type === 'product' ? 'website' : type
  
  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName,
      images: [
        {
          url: defaultImage.startsWith('http') ? defaultImage : `${siteUrl}${defaultImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: openGraphType,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [defaultImage.startsWith('http') ? defaultImage : `${siteUrl}${defaultImage}`],
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

export function generateStructuredData(data: {
  type: 'Product' | 'Organization' | 'WebSite' | 'BreadcrumbList'
  [key: string]: any
}): object {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': data.type,
  }

  switch (data.type) {
    case 'Product':
      return {
        ...baseStructuredData,
        name: data.name,
        description: data.description,
        image: data.image,
        brand: {
          '@type': 'Brand',
          name: data.brand,
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: data.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: data.rating.value,
              reviewCount: data.rating.count,
            }
          : undefined,
      }

    case 'Organization':
      return {
        ...baseStructuredData,
        name: data.name || 'WorthyTen',
        url: data.url || 'https://worthyten.com',
        logo: data.logo || 'https://worthyten.com/images/worthyten-logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: data.phone || '+91-XXXXX-XXXXX',
          contactType: 'Customer Service',
        },
      }

    case 'WebSite':
      return {
        ...baseStructuredData,
        name: data.name || 'WorthyTen',
        url: data.url || 'https://worthyten.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${data.url || 'https://worthyten.com'}/products?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }

    case 'BreadcrumbList':
      return {
        ...baseStructuredData,
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }

    default:
      return baseStructuredData
  }
}

export function generateSitemapData(pages: Array<{ url: string; lastmod?: string; changefreq?: string; priority?: number }>): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worthyten.com'
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `    <lastmod>${page.lastmod}</lastmod>` : ''}
    ${page.changefreq ? `    <changefreq>${page.changefreq}</changefreq>` : ''}
    ${page.priority ? `    <priority>${page.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`

  return sitemap
}
