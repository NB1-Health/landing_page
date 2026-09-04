/**
 * Shared geometry for the help-article kit.
 *
 * `HelpNav` renders a *fixed* rail rather than a `position: sticky` sidebar,
 * because each block is a separate DOM subtree (see `RenderBlocks`) and sticky
 * positioning cannot escape its own block. The rail is therefore aligned to the
 * article column by arithmetic, and every block in the kit has to agree on the
 * same numbers:
 *
 *   |<------------------ ARTICLE_MAX (820) ------------------>|
 *   | RAIL (190) |  GAP (48)  |        body column            |
 *   |<-------- GUTTER (238) ->|
 *
 * The article column is centred in the viewport, so:
 *   rail left edge  = 50% - ARTICLE_MAX/2
 *   body left edge  = 50% - ARTICLE_MAX/2 + GUTTER
 *
 * Below `RAIL_BREAKPOINT` the rail is hidden and the gutter collapses, exactly
 * as the mockup does at its 880px breakpoint. It is set a little wider than the
 * mockup's so the 820px column plus its 40px shell padding never gets squeezed.
 *
 * These values are duplicated as literals inside each block's styled-jsx (a
 * styled-jsx template with interpolated values compiles to a per-instance
 * stylesheet, which is not worth it for constants). Treat this file as the
 * source of truth: if you change a number here, change it in all four
 * components below and re-check the alignment in a browser.
 *
 *   HelpNav/Component.tsx    — .hn-rail  { left, width }
 *   HelpSteps/Component.tsx  — .hs-wrap  { max-width, padding-left }
 *   HelpFaq/Component.tsx    — .hf-wrap  { max-width, padding-left }
 *   HelpHero/Component.tsx   — .hh-head  { max-width }  (centred, no gutter)
 */
export const HELP_LAYOUT = {
  /** Width of the article grid (rail + gap + body). */
  ARTICLE_MAX: 820,
  /** Width of the contents rail. */
  RAIL: 190,
  /** Space between the rail and the body column. */
  GAP: 48,
  /** RAIL + GAP — the left indent the body column carries when a rail is shown. */
  GUTTER: 238,
  /** Width of the article header and the optional hero figure. */
  HEAD_MAX: 760,
  /** Viewport width at or above which the rail is shown. */
  RAIL_BREAKPOINT: 1000,
  /** Distance from the top of the viewport to the rail / to a scrolled-to heading. */
  TOP_OFFSET: 96,
} as const

/** Attribute the rail reads to build its list. Set on every step `h2`. */
export const HELP_HEADING_ATTR = 'data-help-heading'

/** Attribute marking a region the rail should be visible over. */
export const HELP_ARTICLE_ATTR = 'data-help-article'
