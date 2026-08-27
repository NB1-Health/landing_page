import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const deploymentURLs = {
  production: 'https://nb1.com',
  staging: 'https://stg.nb1.com',
}

/**
 * @param {'production' | 'staging'} expected
 * @param {{ DEPLOY_ENV?: string, NEXT_PUBLIC_SERVER_URL?: string, NEXT_PUBLIC_KLAVIYO_COMPANY_ID?: string }} environment
 */
export function assertDeploymentEnvironment(expected, environment = process.env) {
  const expectedURL = deploymentURLs[expected]

  if (!expectedURL) throw new Error(`Unknown deployment environment: ${expected}`)
  if (environment.DEPLOY_ENV !== expected) {
    throw new Error(`DEPLOY_ENV must be ${expected}`)
  }
  if (environment.NEXT_PUBLIC_SERVER_URL !== expectedURL) {
    throw new Error(`NEXT_PUBLIC_SERVER_URL must be ${expectedURL}`)
  }

  const klaviyoCompanyId = environment.NEXT_PUBLIC_KLAVIYO_COMPANY_ID?.trim()
  if (expected === 'production' && klaviyoCompanyId !== 'WwW2Hy') {
    throw new Error('NEXT_PUBLIC_KLAVIYO_COMPANY_ID must be WwW2Hy in production')
  }
  if (expected === 'staging' && klaviyoCompanyId) {
    throw new Error('NEXT_PUBLIC_KLAVIYO_COMPANY_ID must be unset in staging')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const expected = process.argv[2]

  if (expected !== 'production' && expected !== 'staging') {
    throw new Error('Expected deployment environment argument: production or staging')
  }

  assertDeploymentEnvironment(expected)
  console.log(`${expected} deployment environment is valid.`)
}
