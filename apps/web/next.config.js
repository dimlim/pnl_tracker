/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crypto-pnl/types', '@crypto-pnl/trpc', '@crypto-pnl/pnl-engine'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
    ],
  },
}

module.exports = nextConfig
