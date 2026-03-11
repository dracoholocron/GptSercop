/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080';
const nextConfig = {
  transpilePackages: ['@sercop/design-system', '@sercop/api-client'],
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

module.exports = nextConfig;
