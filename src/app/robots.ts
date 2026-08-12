import type { MetadataRoute } from 'next'
import { appLocales } from '@/i18n/config'

const LOCALES = appLocales

function normalizeSiteURL(raw?: string) {
  if (!raw) return 'http://localhost:3000'
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `https://${raw}`
}

export default function robots(): MetadataRoute.Robots {
  if (process.env.DEPLOY_ENV === 'staging' || process.env.DEPLOY_ENV === 'production') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  const site = normalizeSiteURL(
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL,
  )

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cms', '/cms/admin', '/cms/api'],
    },
    sitemap: [`${site}/sitemap.xml`, ...LOCALES.map((l) => `${site}/${l}/sitemap.xml`)],
  }
}
