import type { NextConfig } from 'next';
import { resolve } from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: resolve(process.cwd(), '../..'),
  basePath: process.env.NEXT_PUBLIC_APP_BASE_PATH || '',
  env: { NEXT_PUBLIC_APP_BASE_PATH: process.env.NEXT_PUBLIC_APP_BASE_PATH || '' },
  distDir: process.env.NEXT_DIST_DIR ?? (process.env.DESIGN_VARIANT === 'studio' ? '.next-studio' : '.next'),
  // Business data must be fetched again on navigation; image caching is independent.
  experimental: {
    serverActions: { bodySizeLimit: '108mb' },
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lomi2026.github.io',
        pathname: '/palmpay-design-intelligence/assets/**',
      },
    ],
  },
};

export default nextConfig;
