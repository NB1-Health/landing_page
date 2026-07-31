/**
 * Klarna market list — where Klarna can actually be used, keyed by ISO country code → the
 * currency(ies) Klarna accepts there. Source: Stripe/Klarna country+currency availability.
 *
 * This is the KLARNA market list, NOT our shipping-country list. The checkout country dropdown
 * stays fully independent: add any country you want to ship to — the Klarna option simply appears
 * when the selected country+currency is a real Klarna market, and hides otherwise. Only edit this
 * map if KLARNA changes its markets (rare), never when you add a shipping country.
 *
 * For our EEA (German) merchant, EUR is presentable to EEA customers; non-EEA markets use their
 * local currency. Non-EUR currencies we don't offer at checkout simply never match — harmless.
 */
export const KLARNA_MARKETS: Record<string, string[]> = {
  // Eurozone / EEA — present EUR
  AT: ['EUR'], BE: ['EUR'], DE: ['EUR'], EE: ['EUR'], ES: ['EUR'], FI: ['EUR'],
  FR: ['EUR'], GR: ['EUR'], IE: ['EUR'], IT: ['EUR'], LT: ['EUR'], LV: ['EUR'],
  NL: ['EUR'], PT: ['EUR'], SI: ['EUR'], SK: ['EUR'],
  RO: ['EUR', 'RON'],
  // EEA — local currency
  SE: ['SEK'], DK: ['DKK'], NO: ['NOK'], PL: ['PLN'], CZ: ['CZK'], HU: ['HUF'],
  // Non-EEA Europe
  CH: ['CHF'],
  GB: ['GBP'],
  // Non-Europe (same-country + own currency only)
  US: ['USD'], CA: ['CAD'], AU: ['AUD'], NZ: ['NZD'],
}

/** Is Klarna a valid option for this (country, currency)? Case-insensitive. */
export function isKlarnaAvailable(countryCode?: string | null, currency?: string | null): boolean {
  if (!countryCode || !currency) return false
  const cc = String(countryCode).toUpperCase()
  const cur = String(currency).toUpperCase()
  return (KLARNA_MARKETS[cc] || []).includes(cur)
}

/** Is this a currency Klarna operates in anywhere? (Used where the country isn't collected.) */
export function isKlarnaCurrency(currency?: string | null): boolean {
  if (!currency) return false
  const cur = String(currency).toUpperCase()
  return Object.values(KLARNA_MARKETS).some((list) => list.includes(cur))
}
