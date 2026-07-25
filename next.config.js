/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['instagram.com', 'cdninstagram.com', 'www.instagram.com'],
  },
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig
