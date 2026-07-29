'use client'

/**
 * Session-scoped store for the visitor's plan/cycle selection, shared across
 * the whole order funnel (plan page → cycle page → checkout). The checkout URL
 * params (?plan=&cycle=) are stripped right after first read, and each funnel
 * page is a separate static CMS page — without this store, navigating back or
 * refreshing silently resets the order to core/4.
 *
 * All readers validate against the allowlists, so garbage values (tampered
 * storage or URL) fall back to defaults.
 */

export const PLAN_STORAGE_KEY = 'nb1_checkout_plan'

/** Fired on window whenever the stored selection changes (same document only —
 *  unlike the native 'storage' event, which fires only in OTHER tabs). */
export const PLAN_SELECTION_EVENT = 'nb1:planselectionchange'

const VALID_PLANS = ['core', 'advanced']
const VALID_CYCLES = ['monthly', '4', '12']

export type PlanSelection = { plan?: string; cycle?: string }

export function getStoredPlanSelection(): PlanSelection {
  try {
    const raw = JSON.parse(sessionStorage.getItem(PLAN_STORAGE_KEY) ?? '{}')
    return {
      plan: VALID_PLANS.includes(raw?.plan) ? raw.plan : undefined,
      cycle: VALID_CYCLES.includes(raw?.cycle) ? raw.cycle : undefined,
    }
  } catch {
    /* SSR or blocked storage */
    return {}
  }
}

/** Merge-patch the stored selection; unknown values are ignored. */
export function storePlanSelection(patch: PlanSelection): void {
  if (typeof window === 'undefined') return

  try {
    const next = { ...getStoredPlanSelection() }
    if (patch.plan && VALID_PLANS.includes(patch.plan)) next.plan = patch.plan
    if (patch.cycle && VALID_CYCLES.includes(patch.cycle)) next.cycle = patch.cycle
    sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next))
    // Deferred: storePlanSelection may run during a React render (lazy state
    // initializers); dispatching synchronously would setState in listeners
    // mid-render. A macrotask lands safely after the commit.
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PLAN_SELECTION_EVENT, { detail: next }))
      }
    }, 0)
  } catch {
    /* noop */
  }
}
