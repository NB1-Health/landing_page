import assert from 'node:assert/strict'
import { parse } from 'node-html-parser'

const base = new URL(process.env.SEO_BASE_URL || 'http://localhost:3000')
const headers = {}
if (process.env.STG_BASIC_AUTH_USERNAME && process.env.STG_BASIC_AUTH_PASSWORD) {
  headers.authorization = `Basic ${Buffer.from(`${process.env.STG_BASIC_AUTH_USERNAME}:${process.env.STG_BASIC_AUTH_PASSWORD}`).toString('base64')}`
}

for (const userAgent of ['Mozilla/5.0', 'facebookexternalhit/1.1']) {
  for (const currency of ['GBP', 'CHF']) {
    const response = await fetch(new URL('/en', base), {
      headers: { ...headers, 'user-agent': userAgent, cookie: `nb1_currency=${currency}` },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
    assert.equal(response.status, 200, 'Homepage must return 200')
    const page = parse(await response.text())
    const picker = page.querySelector('.nb1-loc-btn')
    assert.ok(picker, 'Navigation must be rendered in the initial HTML')
    assert.match(picker.text, /£/, 'Initial currency must be the locale default')
    assert.doesNotMatch(picker.text, /CHF/, 'Visitor currency must not personalize shared HTML')
    assert.doesNotMatch(response.headers.get('set-cookie') || '', /nb1_(currency|country)=/)
    console.log(`Homepage server navigation and currency: PASS (${userAgent}, ${currency})`)
  }
}
