import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import robots from '@/app/robots'
import { assertDeploymentEnvironment } from '../../scripts/check-deployment-environment.mjs'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('staging SEO containment', () => {
  it('adds a global noindex response header only on staging', async () => {
    vi.stubEnv('DEPLOY_ENV', 'staging')
    vi.resetModules()

    const { default: stagingConfig } = await import('../../next.config.js')
    const stagingHeaders = await stagingConfig.headers?.()
    const stagingRobotsHeaders = stagingHeaders
      ?.flatMap((route) => route.headers)
      .filter((header) => header.key.toLowerCase() === 'x-robots-tag')

    expect(stagingRobotsHeaders).toEqual([{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }])

    vi.stubEnv('DEPLOY_ENV', 'production')
    vi.resetModules()

    const { default: productionConfig } = await import('../../next.config.js')
    const productionHeaders = await productionConfig.headers?.()
    const productionRobotsHeaders = productionHeaders
      ?.flatMap((route) => route.headers)
      .filter((header) => header.key.toLowerCase() === 'x-robots-tag')

    expect(productionRobotsHeaders).toEqual([])

    vi.stubEnv('DEPLOY_ENV', 'local')
    vi.resetModules()

    const { default: localConfig } = await import('../../next.config.js')
    const localHeaders = await localConfig.headers?.()
    const localRobotsHeaders = localHeaders
      ?.flatMap((route) => route.headers)
      .filter((header) => header.key.toLowerCase() === 'x-robots-tag')

    expect(localRobotsHeaders).toEqual([])
  })

  it.each([
    ['staging', 'https://stg.nb1.com'],
    ['production', 'https://nb1.com'],
  ] as const)('validates the %s deployment environment and host together', (deployEnv, siteURL) => {
    expect(() =>
      assertDeploymentEnvironment(deployEnv, {
        DEPLOY_ENV: deployEnv,
        NEXT_PUBLIC_SERVER_URL: siteURL,
      }),
    ).not.toThrow()

    expect(() =>
      assertDeploymentEnvironment(deployEnv, {
        DEPLOY_ENV: deployEnv === 'staging' ? 'production' : 'staging',
        NEXT_PUBLIC_SERVER_URL: siteURL,
      }),
    ).toThrow(`DEPLOY_ENV must be ${deployEnv}`)

    expect(() =>
      assertDeploymentEnvironment(deployEnv, {
        DEPLOY_ENV: deployEnv,
        NEXT_PUBLIC_SERVER_URL: deployEnv === 'staging' ? 'https://nb1.com' : 'https://stg.nb1.com',
      }),
    ).toThrow(`NEXT_PUBLIC_SERVER_URL must be ${siteURL}`)
  })

  it('blocks crawling and omits sitemap discovery on staging', () => {
    vi.stubEnv('DEPLOY_ENV', 'staging')

    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    })
  })

  it('keeps production crawlable now that it is launched', () => {
    vi.stubEnv('DEPLOY_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://nb1.com')

    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/cms', '/cms/admin', '/cms/api'],
      },
      sitemap: [
        'https://nb1.com/sitemap.xml',
        'https://nb1.com/en/sitemap.xml',
        'https://nb1.com/de/sitemap.xml',
        'https://nb1.com/fr/sitemap.xml',
        'https://nb1.com/nl/sitemap.xml',
        'https://nb1.com/ch/sitemap.xml',
        'https://nb1.com/be/sitemap.xml',
        'https://nb1.com/uk/sitemap.xml',
        'https://nb1.com/uae/sitemap.xml',
      ],
    })
  })

  it('preserves crawlable local robots using the local URL', () => {
    vi.stubEnv('DEPLOY_ENV', 'local')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3000')

    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/cms', '/cms/admin', '/cms/api'],
      },
      sitemap: [
        'http://localhost:3000/sitemap.xml',
        'http://localhost:3000/en/sitemap.xml',
        'http://localhost:3000/de/sitemap.xml',
        'http://localhost:3000/fr/sitemap.xml',
        'http://localhost:3000/nl/sitemap.xml',
        'http://localhost:3000/ch/sitemap.xml',
        'http://localhost:3000/be/sitemap.xml',
        'http://localhost:3000/uk/sitemap.xml',
        'http://localhost:3000/uae/sitemap.xml',
      ],
    })
  })

  it('leaves robots and sitemap ownership with the Next App Router', () => {
    const packageJSON = JSON.parse(readFileSync('package.json', 'utf8'))

    expect(packageJSON.scripts.postbuild).toBeUndefined()
    expect(packageJSON.scripts.prebuild).toBe('node scripts/remove-stale-seo-artifacts.mjs')
    expect(packageJSON.scripts.predev).toBe('node scripts/remove-stale-seo-artifacts.mjs')
  })

  it('runs deployment guards before changing either environment', () => {
    for (const [script, deployEnv] of [
      ['deploy-stg.sh', 'staging'],
      ['deploy-prod.sh', 'production'],
    ]) {
      const source = readFileSync(script, 'utf8')
      const guard = `node scripts/check-deployment-environment.mjs ${deployEnv}`

      expect(source).toContain(guard)
      expect(source.indexOf(guard)).toBeLessThan(source.indexOf('npm install'))
      expect(source.indexOf(guard)).toBeLessThan(
        source.indexOf(`cp .env.${deployEnv === 'staging' ? 'stg' : 'prod'} .env`),
      )
    }
  })
})
