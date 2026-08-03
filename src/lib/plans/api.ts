/**
 * Shared client for the NB1 subscriptions/plans API.
 *
 * Backend: GET {NB1_API_URL}/subscriptions/plans, /subscriptions/plans/slug/{slug}
 * Docs: https://apistg.nb1.com/docs#/Subscriptions
 *
 * Scope note: under the 1-month-standard commitment model the cycle GRID
 * (getPlanCycles) models month=1, 4, 12 — month=1 is now the STANDARD tier
 * (the "Flexible" default), and 4 & 12 are the optional discount tiers. The
 * 8-month tier has been retired. Each family must expose a month=1 row
 * (NB1-CORE-1, NB1-ADVANCED-1) in the API for this to resolve; any month can
 * also be resolved live for free-text price tokens via getRate() — see
 * src/lib/plans/priceTokens.ts. Prices are no longer hand-typed in Payload copy.
 */
import type { CurrencyCode } from '@/utilities/currency'

export type PlanFamily = 'Core' | 'Advanced'
export type PlanMonth = 1 | 4 | 12

const SUPPORTED_MONTHS: PlanMonth[] = [1, 4, 12]
const BASELINE_MONTH: PlanMonth = 1

// Reuses the same backend host already configured for the rest of the app
// (see src/lib/createAccount.ts) rather than introducing a second env var.
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'

/** Raw shape returned by the API (PlanPublicOut), trimmed to what we use. */
export interface RawPlan {
  id: string
  title: string
  slug: string
  description?: string | null
  options: Record<string, string>
  is_preferred: boolean
  is_visible: boolean
  prices: Record<string, number>
  discount: Record<string, number>
  month: number
  bill_cycle: number
}

/** Resolved plan for a single (family, month) pair, in the requested currency. */
export interface ResolvedPlan {
  id: string
  slug: string
  family: PlanFamily
  month: PlanMonth
  /** Monthly rate in the requested currency, as a plain number (e.g. 89). */
  price: number
  /**
   * Total saved across the cycle vs. the 4-month rate for this family, in
   * the requested currency. Always 0 for month=4 (it IS the baseline).
   * NOT the same as the API's raw `discount` field — see note below.
   */
  savings: number
  isPreferred: boolean
  /** Numbered option/feature strings from the API, in insertion order. */
  options: string[]
}

let cache: { fetchedAt: number; plans: RawPlan[] } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes — mirrors the Next.js fetch revalidate window

async function fetchAllPlans(): Promise<RawPlan[]> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.plans

  const res = await fetch(`${API_BASE}/subscriptions/plans?preferred_first=false`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error(`subscriptions/plans request failed: ${res.status} ${res.statusText}`)
  }
  const plans = (await res.json()) as RawPlan[]
  cache = { fetchedAt: now, plans }
  return plans
}

function toOptionsList(options: Record<string, string>): string[] {
  return Object.keys(options)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => options[key])
}

/**
 * Computes "savings vs the 1-month standard rate" ourselves rather than
 * trusting the API's `discount` field. Under the commitment model the
 * standard is month=1, so savings for the 4- and 12-month discount tiers are
 * anchored to each family's month=1 rate (BASELINE_MONTH). This matches the
 * brief's copy (Core: 4mo "save €20 / cycle" = (99−94)×4, 12mo "save €120 /
 * cycle" = (99−89)×12). If a family has no month=1 row the baseline resolves
 * to 0 and savings will be wrong — every family must expose month=1.
 */
function computeSavings(
  monthlyRateAtMonth: number,
  monthlyRateAtBaseline: number,
  month: PlanMonth,
): number {
  return Math.round((monthlyRateAtBaseline - monthlyRateAtMonth) * month)
}

/**
 * Fetch every (family × month) combination needed to render a full
 * 1/4/12 cycle grid for one plan family, resolved into the given currency.
 */
export async function getPlanCycles(
  family: PlanFamily,
  currency: CurrencyCode,
): Promise<ResolvedPlan[]> {
  const all = await fetchAllPlans()
  const rows = all.filter(
    (p) => p.title === family && SUPPORTED_MONTHS.includes(p.month as PlanMonth),
  )

  const baseline = rows.find((p) => p.month === BASELINE_MONTH)
  const baselineRate = baseline ? (baseline.prices[currency] ?? baseline.prices.EUR ?? 0) : 0

  return rows
    .map((p) => {
      const rate = p.prices[currency] ?? p.prices.EUR ?? 0
      return {
        id: p.id,
        slug: p.slug,
        family,
        month: p.month as PlanMonth,
        price: rate,
        savings: computeSavings(rate, baselineRate, p.month as PlanMonth),
        isPreferred: p.is_preferred,
        options: toOptionsList(p.options),
      }
    })
    .sort((a, b) => a.month - b.month)
}

/**
 * Monthly rate for one (family, month) pair, for ANY month the API returns —
 * including months outside the cycle grid (e.g. a retired 8-month row).
 * Used by the per-card Monthly Note. Returns null if that row doesn't exist.
 */
export async function getRate(
  family: PlanFamily,
  month: number,
  currency: CurrencyCode,
): Promise<number | null> {
  const all = await fetchAllPlans()
  const row = all.find((p) => p.title === family && p.month === month)
  if (!row) return null
  return row.prices[currency] ?? row.prices.EUR ?? null
}

/** Fetch a single (family, month) plan — e.g. for a headline card price. */
export async function getPlan(
  family: PlanFamily,
  month: PlanMonth,
  currency: CurrencyCode,
): Promise<ResolvedPlan | null> {
  const cycles = await getPlanCycles(family, currency)
  return cycles.find((p) => p.month === month) ?? null
}
