/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  // Enable static export for GitHub Pages
  // ⚠️ WARNING: This disables API routes (/api/*) - they won't work on GitHub Pages
  // API routes require a server (use Vercel/Netlify for full functionality)
  output: 'export',
  trailingSlash: true,
  // Exclude Firebase Functions directory from Next.js build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude functions directory from webpack compilation
  webpack: (config, { isServer }) => {
    config.externals = config.externals || []
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
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







