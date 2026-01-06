/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Only use basePath in production (GitHub Pages)
  basePath: isProd ? '/New-logo-web' : '',
  assetPrefix: isProd ? '/New-logo-web/' : '',
}

module.exports = nextConfig

