/**
 * Shared price-token grammar + a tiny arithmetic evaluator.
 *
 * No imports — safe to use from both server (priceTokens.ts) and client
 * (clientUtils.ts) code.
 *
 * A token is `{{ <expression> }}` where the expression contains one or more
 * price refs and, optionally, arithmetic:
 *
 *   {{price:core:4}}                            → the 4-month Core rate
 *   {{(price:core:4-price:core:12)*12}}/yr      → yearly saving vs the 12-month rate
 *   {{(price:advanced:4-price:advanced:12)*12}} → same, Advanced
 *
 * A price ref is `price:<family>:<month>` (whitespace around the colons is
 * ignored, so `price: advanced : 12` works too). Inside `{{…}}` you may use the
 * operators + - * / and parentheses, plus plain numbers, and the rounding
 * functions floor() / ceil() / round() — e.g. `{{floor(price:core:4/2)}}`
 * rounds down (49.5 → 49) instead of the default half-up. The numeric result is
 * formatted as a price by the caller. An unresolved ref (unknown family/month,
 * API down) or an invalid expression collapses to an empty string.
 */

/** A single `price:family:month` reference. */
export const PRICE_REF_RE = /price\s*:\s*(core|advanced)\s*:\s*(\d+)/gi

/** A full `{{ … }}` token whose body mentions at least one price ref. */
export const PRICE_TOKEN_RE = /\{\{\s*([^{}]*?price\s*:[^{}]*?)\s*\}\}/gi

/**
 * A `{{ … }}` token whose body is a plain numeric amount (no `price:` ref) —
 * e.g. `{{0}}`, `{{49}}`, `{{floor(99/2)}}`. The body may use numbers, the
 * operators + - * / , parentheses, and the rounding functions
 * floor()/ceil()/round(). The numeric result is formatted in the currently
 * selected currency by the caller — so `{{0}}` renders as €0 / £0 / 0 CHF / …
 * depending on the visitor's currency. Tokens containing letters/colons (i.e.
 * price refs) deliberately do NOT match this pattern.
 */
export const AMOUNT_TOKEN_RE = /\{\{\s*((?:floor|ceil|round|[\d+\-*/().\s])+?)\s*\}\}/gi

export function hasPriceToken(text: string | null | undefined): boolean {
  return !!text && /\{\{\s*[^{}]*price\s*:/i.test(text)
}

/**
 * Evaluate a `+ - * / ( )`-and-numbers expression without eval(), via a small
 * recursive-descent parser. Returns null for empty/invalid input.
 */
export function evalArithmetic(raw: string): number | null {
  const s = raw.replace(/\s+/g, '')
  if (!s || !/^[0-9a-z+\-*/().]+$/i.test(s)) return null

  let i = 0
  let invalid = false

  const factor = (): number => {
    // Rounding function call: floor(...) | ceil(...) | round(...)
    const fn = /^(floor|ceil|round)\(/i.exec(s.slice(i))
    if (fn) {
      i += fn[0].length // consume the name and the opening "("
      const v = expr()
      if (s[i] === ')') i++
      else invalid = true
      const name = fn[1].toLowerCase()
      return name === 'floor' ? Math.floor(v) : name === 'ceil' ? Math.ceil(v) : Math.round(v)
    }
    if (s[i] === '(') {
      i++
      const v = expr()
      if (s[i] === ')') i++
      else invalid = true
      return v
    }
    if (s[i] === '+' || s[i] === '-') {
      const sign = s[i++] === '-' ? -1 : 1
      return sign * factor()
    }
    let num = ''
    while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++]
    return num === '' ? NaN : parseFloat(num)
  }

  const term = (): number => {
    let v = factor()
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++]
      const r = factor()
      v = op === '*' ? v * r : v / r
    }
    return v
  }

  function expr(): number {
    let v = term()
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]
      const r = term()
      v = op === '+' ? v + r : v - r
    }
    return v
  }

  const result = expr()
  // Reject unbalanced parens and trailing garbage (chars left unconsumed).
  if (invalid || i < s.length || !Number.isFinite(result)) return null
  return result
}

/**
 * Substitute every price ref in `inner` with its numeric rate, then evaluate
 * the resulting arithmetic expression. Returns null if any ref is missing or
 * the expression is invalid.
 */
export function resolveExpr(
  inner: string,
  getRate: (family: string, month: number) => number | null | undefined,
): number | null {
  let missing = false
  const numeric = inner.replace(PRICE_REF_RE, (_m, fam: string, mo: string) => {
    const rate = getRate(fam.toLowerCase(), Number(mo))
    if (rate == null) {
      missing = true
      return '0'
    }
    return String(rate)
  })
  if (missing) return null
  return evalArithmetic(numeric)
}
