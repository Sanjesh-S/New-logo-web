import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'
import { generateStructuredData } from '@/lib/utils/seo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "WorthyTen - Know Your Device's Worth in Seconds",
  description: 'Trade in your cameras, phones, and laptops. Get instant valuation and free doorstep pickup.',
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    shortcut: '/favicon.ico',
    apple: '/favicon-32x32.png',
  },
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worthyten.com'

const organizationData = generateStructuredData({
  type: 'Organization',
  name: 'WorthyTen',
  url: siteUrl,
  logo: `${siteUrl}/images/worthyten-logo.png`,
  phone: '+91-98430-10746',
})

const websiteData = generateStructuredData({
  type: 'WebSite',
  name: 'WorthyTen',
  url: siteUrl,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rawMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  // Validate measurement ID format (G-XXXXXXXXXX) to prevent XSS via env injection
  const measurementId = rawMeasurementId && /^G-[A-Z0-9]+$/.test(rawMeasurementId) ? rawMeasurementId : null

  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        {measurementId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${measurementId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-blue-900 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-lime focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
        <AuthProvider>
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}

