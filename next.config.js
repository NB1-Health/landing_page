import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const isStaging = process.env.DEPLOY_ENV === 'staging'
const isCloudflareEdgeCacheEnabled =
  process.env.DEPLOY_ENV === 'production' && process.env.CLOUDFLARE_EDGE_CACHE_ENABLED === 'true'

const cloudflareMediaHeaders = [
  {
    key: 'Cloudflare-CDN-Cache-Control',
    value: 'public, max-age=14400, stale-while-revalidate=60',
  },
  { key: 'Cache-Tag', value: 'nb1-media' },
]

const cloudflareOptimizedImageHeaders = [
  {
    key: 'Cloudflare-CDN-Cache-Control',
    value: 'public, max-age=60, stale-while-revalidate=60',
  },
  { key: 'Cache-Tag', value: 'nb1-media' },
]

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  async headers() {
    return [
      ...(isStaging
        ? [
            {
              source: '/:path*',
              headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
            },
          ]
        : []),
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      ...(isCloudflareEdgeCacheEnabled
        ? [
            {
              source: '/_next/image',
              headers: cloudflareOptimizedImageHeaders,
            },
            {
              source: '/cms/api/media/file/:path*',
              headers: cloudflareMediaHeaders,
            },
          ]
        : []),
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
