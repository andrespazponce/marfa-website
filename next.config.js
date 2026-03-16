/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.DIRECTUS_HOSTNAME || 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
