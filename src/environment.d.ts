declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    fbq: (...args: unknown[]) => void
    __nb1Consent: Record<string, boolean>
    __nb1ConsentResolved: boolean
    __nb1KlarSeptemberId?: string
    __lastLeadTime?: number
    klaviyo: { push: (...args: unknown[]) => void } & Record<string, (...args: unknown[]) => unknown>
    _klOnsite: unknown[]
  }

  namespace NodeJS {
    interface ProcessEnv {
      DEPLOY_ENV: 'local' | 'production' | 'staging'
      CLOUDFLARE_EDGE_CACHE_ENABLED?: 'false' | 'true'
      CLOUDFLARE_ZONE_ID?: string
      CLOUDFLARE_CACHE_PURGE_TOKEN?: string
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      NEXT_PUBLIC_KLAVIYO_COMPANY_ID?: string
      NEXT_PUBLIC_META_PURCHASE_OWNER?: 'landing' | 'backend'
      VERCEL_PROJECT_PRODUCTION_URL: string
    }
  }
}

// CSS side-effect imports
declare module '*.css'
declare module '@/styles/*.css'

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
