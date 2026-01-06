/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '/New-logo-web',
  assetPrefix: '/New-logo-web/',
}

module.exports = nextConfig
