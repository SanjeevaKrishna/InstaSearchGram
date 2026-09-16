/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'instagram.com',
      'cdninstagram.com',
      'www.instagram.com',
      'kmamqlbtiqmfsngovniw.supabase.co'
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig
