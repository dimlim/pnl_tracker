/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crypto-pnl/types', '@crypto-pnl/trpc', '@crypto-pnl/pnl-engine'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
}

module.exports = nextConfig
