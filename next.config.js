/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow images from Directus CMS when self-hosted
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8055',
        pathname: '/assets/**',
      },
      {
        // Production Directus domain — update when deploying
        protocol: 'https',
        hostname: process.env.DIRECTUS_HOSTNAME || 'cms.marfabolivia.com',
        pathname: '/assets/**',
      },
    ],
    // Optimize locally served assets
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // Enable experimental features useful for CMS-driven content
  experimental: {
    // Allows ISR cache to be revalidated via Directus webhooks
    ppr: false,
  },

  // Headers for performance + security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/assets/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
