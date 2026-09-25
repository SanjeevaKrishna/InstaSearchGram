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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.spialr.com',
          },
        ],
        destination: 'https://spialr.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
