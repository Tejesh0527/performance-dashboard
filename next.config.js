/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack for faster dev builds
  experimental: {},

  // Improve bundle analysis
  productionBrowserSourceMaps: false,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/workers/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
