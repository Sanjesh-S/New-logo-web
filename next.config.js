/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  // Note: Removed 'output: export' because API routes require a server
  // For static export (GitHub Pages), you would need to move API routes to a separate backend
  // Recommended deployment: Vercel, Netlify, or any Node.js server
  trailingSlash: true,
  images: {
    // Image optimization requires a server
    // Uncomment when deploying to Vercel or custom server
    // unoptimized: false,
    unoptimized: true, // Keep for static export compatibility
    // For production with server, enable optimization:
    // formats: ['image/avif', 'image/webp'],
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Only use basePath in production (if needed for subdirectory deployment)
  basePath: isProd ? '/New-logo-web' : '',
  assetPrefix: isProd ? '/New-logo-web/' : '',
}

module.exports = nextConfig







