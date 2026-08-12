import assert from 'node:assert/strict'

const baseURL = new URL('https://stg.nb1.com')
const username = process.env.STG_BASIC_AUTH_USERNAME
const password = process.env.STG_BASIC_AUTH_PASSWORD

assert(username, 'STG_BASIC_AUTH_USERNAME is required')
assert(password, 'STG_BASIC_AUTH_PASSWORD is required')

const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
const protectedPaths = [
  '/en',
  '/en/our-plans',
  '/cms/admin',
  '/cms/api/users',
  '/robots.txt',
  '/sitemap.xml',
]

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function request(path, init = {}) {
  let lastError

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(new URL(path, baseURL), {
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        ...init,
      })

      if (![502, 503, 504].includes(response.status)) return response

      lastError = new Error(`${path} returned ${response.status}`)
      await response.arrayBuffer()
    } catch (error) {
      lastError = error
    }

    if (attempt < 5) await wait(2_000)
  }

  throw lastError
}

for (const path of protectedPaths) {
  const response = await request(path)
  assert.equal(response.status, 401, `Anonymous ${path} returned ${response.status}, expected 401`)
  assert.match(
    response.headers.get('www-authenticate') ?? '',
    /^Basic\b/i,
    `Anonymous ${path} did not return a Basic Auth challenge`,
  )
}

const authenticatedHeaders = { Authorization: authorization }
const pageResponse = await request('/en', { headers: authenticatedHeaders, redirect: 'follow' })
assert.equal(pageResponse.status, 200, `Authenticated /en returned ${pageResponse.status}`)

const xRobotsTag = pageResponse.headers.get('x-robots-tag') ?? ''
assert.match(xRobotsTag, /(?:^|,)\s*noindex\s*(?:,|$)/i, 'Staging HTML is missing noindex')
assert.match(xRobotsTag, /(?:^|,)\s*nofollow\s*(?:,|$)/i, 'Staging HTML is missing nofollow')

const robotsResponse = await request('/robots.txt', {
  headers: authenticatedHeaders,
  redirect: 'follow',
})
assert.equal(
  robotsResponse.status,
  200,
  `Authenticated /robots.txt returned ${robotsResponse.status}`,
)

const robots = await robotsResponse.text()
assert.match(robots, /^User-agent:\s*\*\s*$/im, 'Staging robots.txt is missing User-agent: *')
assert.match(robots, /^Disallow:\s*\/\s*$/im, 'Staging robots.txt is missing Disallow: /')
assert.doesNotMatch(robots, /^Sitemap:/im, 'Staging robots.txt must not advertise a sitemap')

console.log('Staging is protected by Basic Auth and returns noindex containment signals.')
