'use client'

import React, { useState, useEffect } from 'react'
import type { RdDurBlock as Props } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'
import { fetchPlansClient, getClientCurrency, formatPrice } from '@/lib/plans/clientUtils'

// GENERATED from manifests/section-08.json + bindings/RdDur.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-or.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-or` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-du` and NOT `rd-block`.
//
// The duration page — step 2 of the funnel.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

// The duration slot's two shapes, assembled by tools/duration_assemble.py.
//
// One slot, two shapes: a single monthly price on Flexible, two tier cards on
// Commit & save. The mockup renders them as two mutually exclusive `sc-if`
// branches in the same position, so neither can be captured with the other and
// each is generated from its own extract.
//
// `RdDurSlot` at the bottom is the only hand-written part, and it carries no
// styles — it chooses.

type DurPick = NonNullable<Props['pick']>
type DurTier = NonNullable<DurPick['tiers']>[number]

type DurFlexProps = {
  pick?: DurPick | null
  rate: (months?: number | null) => string
}

type DurTiersProps = {
  pick?: DurPick | null
  term: number | null
  setTerm: (months: number | null) => void
  rate: (months?: number | null) => string
  saving: (tier?: DurTier | null) => string
  tierStyle: (tier?: { months?: number | null } | null) => React.CSSProperties
}


const RdDurFlex: React.FC<DurFlexProps> = ({ pick, rate }) => {
  return (
    <div style={{
      textAlign: "center",
      padding: "30px 0px 12px"
    }} className="rd-du-flex">
      <div style={{
        fontFamily: "var(--nb1-font-primary)",
        fontSize: "clamp(48px, 9cqi, 60px)",
        lineHeight: "1",
        letterSpacing: "-0.03em",
        whiteSpace: "nowrap"
      }}>
        {rate(1)}
        <span style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "17px",
          opacity: "0.7",
          letterSpacing: "0px"
        }}>{pick?.perMonthLarge}</span>
      </div>
      <div style={{
        fontSize: "15px",
        color: "var(--muted)",
        marginTop: "10px"
      }}>{pick?.flexNote}</div>
    </div>
  )
}

const RdDurTiers: React.FC<DurTiersProps> = ({ pick, rate, saving, setTerm, term, tierStyle }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginTop: "18px"
    }} className="rd-du-tiers">
      <button style={tierStyle(pick?.tiers?.[0])} aria-pressed={term === pick?.tiers?.[0]?.months ? 'true' : 'false'} onClick={() => setTerm(pick?.tiers?.[0]?.months ?? null)}>
        <span style={{
          flex: "1 1 0%",
          minWidth: "0px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          textAlign: "left"
        }}>
          <span style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "21px"
          }}>
            {pick?.tiers?.[0]?.label}
          </span>
          <span style={{
            fontSize: "14.5px",
            color: "rgb(47, 122, 77)"
          }}>
            {saving(pick?.tiers?.[0])}
          </span>
        </span>
        <span style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          flex: "0 0 auto",
          whiteSpace: "nowrap"
        }}>
          <span style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "26px",
            lineHeight: "1"
          }}>
            {rate(pick?.tiers?.[0]?.months)}
          </span>
          <span style={{
            fontSize: "13px",
            opacity: "0.7"
          }}>{pick?.perMonth}</span>
        </span>
      </button>
      <button style={tierStyle(pick?.tiers?.[1])} aria-pressed={term === pick?.tiers?.[1]?.months ? 'true' : 'false'} onClick={() => setTerm(pick?.tiers?.[1]?.months ?? null)}>
        {(pick?.tiers?.[1]?.best) ? (
          <span style={{
            position: "absolute",
            top: "-11px",
            right: "18px",
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "11px",
            background: "var(--nb1-lime)",
            color: "rgb(0, 0, 0)",
            padding: "0.45em 0.8em",
            borderRadius: "999px",
            whiteSpace: "nowrap"
          }}>{pick?.tiers?.[1]?.bestLabel}</span>
        ) : null}
        <span style={{
          flex: "1 1 0%",
          minWidth: "0px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          textAlign: "left"
        }}>
          <span style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "21px"
          }}>
            {pick?.tiers?.[1]?.label}
          </span>
          <span style={{
            fontSize: "14.5px",
            color: "rgb(47, 122, 77)"
          }}>
            {saving(pick?.tiers?.[1])}
          </span>
        </span>
        <span style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          flex: "0 0 auto",
          whiteSpace: "nowrap"
        }}>
          <span style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "26px",
            lineHeight: "1"
          }}>
            {rate(pick?.tiers?.[1]?.months)}
          </span>
          <span style={{
            fontSize: "13px",
            opacity: "0.7"
          }}>{pick?.perMonth}</span>
        </span>
      </button>
    </div>
  )
}


// The dispatcher. `isCommit` is the mockup's own discriminator — `term !== 'm'`
// — and the two branches are the two `sc-if`s it guards, in the same position
// in the same parent. Nothing else decides, and nothing here styles.
const RdDurSlot: React.FC<
  DurTiersProps & { isCommit: boolean }
> = ({ pick, isCommit, term, setTerm, rate, saving, tierStyle }) =>
  isCommit ? (
    <RdDurTiers
      pick={pick}
      term={term}
      setTerm={setTerm}
      rate={rate}
      saving={saving}
      tierStyle={tierStyle}
    />
  ) : (
    <RdDurFlex pick={pick} rate={rate} />
  )

// The funnel's step header, assembled by tools/steps_assemble.py.
//
// Three steps — Plan, Duration, Checkout — repeated from `steps.items`, as the
// mockup repeats them from its own `steps` array.
//
// ONE header for every screen in the funnel. The mockup computes it once in
// renderVals() and draws it on all four, so `current` — the index of the step
// this page IS — is a prop rather than a constant: the order page passes 0 and
// the two duration pages pass 1. It is REQUIRED, because optional it would
// default to undefined, where `i < undefined` is false for every step and the
// header would quietly draw as though nothing had been reached.
//
// Both settings are MEASURED against the mockup: section 04 is the header on
// the order screen and section 11 the same header on the duration screen. They
// are the same 27 nodes with identical tags and identical boxes; the three
// things that move are the passed step's dot (lime, a tick), the current step's
// dot (dark) and the current step's label opacity.
//
// Every step button is INERT, exactly as in the mockup's rendered DOM: `go`
// only fires for a step already passed and it flips a variable inside one page
// rather than navigating, so there is no href on it at any step. They stay
// <button>s because that is what the design draws. The Back button at the right
// is the one control that moves, and it calls window.history.back().

type DurSteps = NonNullable<Props['steps']>

const RdOrderSteps: React.FC<{ steps?: DurSteps | null; locale?: AppLocale; current: number }> = ({ current, locale, steps }) => {
  //
  // The header's dot and label are styled from whether a step is CURRENT, done
  // or still ahead — `done = i < step`, `cur = i === step` in the mockup, which
  // computes the header ONCE in renderVals() and draws it on every screen.
  //
  // So `current` is a PROP, not a constant: the order page passes 0 and the
  // duration pages pass 1, and the two headers were measured against the mockup
  // at both settings. Structurally they are the same 27 nodes — compared node
  // for node, identical tags and identical boxes — and everything that moves is
  // below: the passed step's dot turns lime with a tick, the current step's
  // turns dark, and the current step's label loses its 0.55 opacity.
  const STEP_CURRENT = current

  const stepDot = (i: number): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    flex: 'none',
    fontFamily: 'var(--nb1-font-tertiary)',
    fontSize: '12px',
    background:
      i === STEP_CURRENT
        ? '#514745'
        : i < STEP_CURRENT
          ? 'var(--nb1-lime)'
          : 'rgba(81,71,69,.12)',
    color:
      i === STEP_CURRENT ? '#F0F5FF' : i < STEP_CURRENT ? '#000' : 'rgba(81,71,69,.7)',
  })

  const stepName = (i: number): React.CSSProperties => ({
    display: 'none',
    fontFamily: 'var(--nb1-font-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '.1em',
    fontSize: '12px',
    color: 'var(--nb1-dark-brown)',
    opacity: i <= STEP_CURRENT ? 1 : 0.55,
  })

  // A SLUG, not a path. Every page in this app lives at /{locale}/{slug}, so
  // storing nine full paths per link is nine chances for one locale to point at
  // another's page. An empty slug is the locale root, which is what the
  // wordmark wants.
  const path = (s?: string | null) => `/${locale || 'en'}${s ? `/${s}` : ''}`

  return (
      <header style={{
        position: "sticky",
        top: "0px",
        zIndex: "40",
        background: "var(--nb1-cool-grey)",
        borderBottom: "1px solid var(--nb1-hairline)"
      }} className="rd-or-steps">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          maxWidth: "1040px",
          margin: "0px auto",
          padding: "14px 20px"
        }} data-m="pad">
          <a style={{
            display: "block",
            flex: "0 0 auto"
          }} href={path(steps?.homeSlug)}>
            <img style={{
              height: "19px",
              width: "auto",
              display: "block"
            }} src={mediaUrl(steps?.logo)} alt={mediaAlt(steps?.logo) || steps?.logoAlt || ''} />
          </a>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            {(steps?.items || []).map((st, stIdx) => (
              <div key={stIdx} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <button style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "0px",
                  background: "transparent",
                  padding: "0px",
                  cursor: "pointer"
                }}>
                  <span style={stepDot(stIdx)}>
                    {stIdx < STEP_CURRENT ? '✓' : String(stIdx + 1)}
                  </span>
                  <span style={stepName(stIdx)} data-m="stepname">
                    {st.label}
                  </span>
                </button>
                {(stIdx < (steps?.items?.length ?? 0) - 1) ? (
                  <span style={{
                    width: "24px",
                    height: "1px",
                    background: "rgba(81, 71, 69, 0.28)"
                  }} aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
          <button style={{
            border: "0px",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "12px",
            padding: "6px 0px",
            whiteSpace: "nowrap"
          }} onClick={() => { try { window.history.back() } catch { /* no history */ } }}>
            {steps?.backLabel}
          </button>
        </div>
      </header>
  )
}

export const RdDur: React.FC<Props & { locale?: AppLocale }> = ({ anchorId, faq, faqHeading, go, heading, intro, locale, perks, pick, plan, steps }) => {
  // ---------------------------------------------------------------- state
  //
  // Two pieces, measured by driving the mockup from a fresh load. `term` is the
  // committed length in months — null while the visitor is on Flexible — and
  // `open` is the FAQ, which opens ONE row at a time here rather than several
  // as the order page's does. Both were read off the mockup's own behaviour,
  // not assumed from the markup.
  const [term, setTerm] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  const isCommit = term !== null

  // Switching to Commit lands on the FIRST tier, and switching back to Flexible
  // clears the term — exactly what the mockup's `mt.select` does:
  // `term: k === 'flex' ? 'm' : (st.term === 'm' ? '4' : st.term)`. Note it
  // KEEPS an already-chosen tier rather than resetting it.
  const firstTerm = pick?.tiers?.[0]?.months ?? 4
  const setMode = (commit: boolean) =>
    setTerm((t) => (commit ? (t ?? firstTerm) : null))

  // ------------------------------------------------------- backend prices
  //
  // THE SEAM. Every price on this page comes from the same endpoint the order
  // page and the checkout use, through the app's own `fetchPlansClient` — one
  // shared, retrying, 60s-cached request rather than a fetch of my own, so the
  // three screens of the funnel cannot disagree about what a plan costs.
  //
  // Keyed by MONTH, because this page's whole job is comparing 1 against 4 and
  // 12 for one plan. `plan` says which.
  const [rates, setRates] = useState<Record<number, number>>({})
  useEffect(() => {
    let live = true
    const loc = locale || 'en'
    const family = plan === 'core' ? 'Core' : 'Advanced'
    fetchPlansClient()
      .then((raw) => {
        if (!live) return
        const currency = getClientCurrency(loc)
        const next: Record<number, number> = {}
        for (const p of raw) {
          if (p.title !== family) continue
          const amount = p.prices?.[currency]
          if (typeof amount === 'number') next[p.month] = amount
        }
        setRates(next)
      })
      .catch(() => {
        /* the page renders its seeded copy; prices stay blank rather than wrong */
      })
    return () => {
      live = false
    }
  }, [locale, plan])

  const money = (n: number) => formatPrice(n, getClientCurrency(locale || 'en'), locale || 'en')

  // The SEEDED rate for a term, in the page's own currency-free numbers.
  //
  // Every price on this page is a live one, and a live one is not there on the
  // first render — the request has not landed, and on a server render it never
  // will. Without a fallback the whole comparison the page exists to make came
  // out blank: the big flexible price, both tier prices and both savings, which
  // collapsed the tier cards from 76px to 60 and left the saving line at zero
  // height. The order page already carried `seededPrice` for exactly this; this
  // one had nothing.
  //
  // Numbers, not formatted strings, because `saving()` has to do arithmetic on
  // them. One code path formats, one computes, and neither cares whether the
  // figure came from the backend or the seed.
  const seeded = (months?: number | null) => {
    const m = Number(months ?? 1)
    if (m === 1) return pick?.seededBase ?? undefined
    return (pick?.tiers || []).find((t) => t.months === m)?.seededRate ?? undefined
  }
  const amount = (months?: number | null) => {
    const live = rates[Number(months ?? 1)]
    return typeof live === 'number' ? live : seeded(months) ?? undefined
  }
  const rate = (months?: number | null) => {
    const n = amount(months)
    return typeof n === 'number' ? money(n) : ''
  }

  // `'Save £' + (base - rate) * months` — the mockup's own formula, so the
  // figure follows the live rates instead of the two the designer happened to
  // draw. The words either side are fields, because "/ cycle" and "/ year" are
  // copy and every locale writes them differently.
  const saving = (tier?: { months?: number | null; saveLabel?: string | null; saveSuffix?: string | null } | null) => {
    const base = amount(1)
    const here = amount(tier?.months)
    if (typeof base !== 'number' || typeof here !== 'number') return ''
    const total = (base - here) * Number(tier?.months ?? 0)
    return `${tier?.saveLabel || ''}${money(total)}${tier?.saveSuffix || ''}`
  }

  const planName = () => (plan === 'core' ? 'Core' : 'Advanced')

  // The line beside the CTA, and the CTA itself. Both change with the term, and
  // both are built from fields plus the live rate — never from a string edit to
  // the other one, which would only ever be right in English.
  const footLabel = () => {
    if (!isCommit) return go?.footFlex || ''
    const t = (pick?.tiers || []).find((x) => x.months === term)
    return `${t?.label || ''}${go?.footCommit || ''}`
  }
  const ctaLabel = () => `${go?.ctaPrefix || ''}${rate(term ?? 1)}${pick?.perMonth || ''}`

  // ------------------------------------------------------ mockup styles
  //
  // `mt.tab` and `mt.subStyle`: the chosen tab inverts. Reproduced as the
  // mockup's own objects, because a style the design derives from state cannot
  // be copied out of a capture that holds one state.
  const tabStyle = (i: number): React.CSSProperties => {
    const on = isCommit === (i === 1)
    return {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '14px 10px',
      border: 0,
      cursor: 'pointer',
      background: on ? '#514745' : '#fff',
      color: on ? '#F0F5FF' : '#514745',
    }
  }
  const tabSubStyle = (i: number): React.CSSProperties => ({
    fontSize: '13px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    opacity: isCommit === (i === 1) ? 0.75 : 0.7,
  })

  // `tr.card` — the chosen tier gets a 2px ring and a lift.
  const tierStyle = (tier?: { months?: number | null } | null): React.CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    border: 0,
    cursor: 'pointer',
    background: '#fff',
    borderRadius: '14px',
    padding: '16px 18px',
    boxShadow:
      term === tier?.months
        ? 'inset 0 0 0 2px #514745, 0 18px 36px -28px rgba(81,71,69,.45)'
        : 'inset 0 0 0 1px rgba(81,71,69,.18)',
  })

  // A SLUG, not a path. Every page lives at /{locale}/{slug} and the locale is
  // added here, so one stored value is correct in all nine.
  const path = (s?: string | null) => `/${locale || 'en'}${s ? `/${s}` : ''}`

  // THE HANDOFF TO THE CHECKOUT.
  //
  // The checkout resolves its basket on mount from `?plan=` and `?cycle=`, and
  // its own comment says those WIN over anything stored — "a fresh arrival
  // from the cycle page". This is that page, and it was linking to the bare
  // slug: whatever the visitor chose here never left it. The checkout fell
  // back to the stored value, or to the core/4 defaults, `hasValidSelection`
  // stayed false, and begin_checkout never fired.
  //
  // `cycle` is the checkout's own vocabulary, not this page's. Here the state
  // is `term`: null on Flexible, a number of months on Commit. There it is a
  // string keyed the way the plans endpoint keys it — 'monthly' for a one-
  // month plan, otherwise the month count — so `null` maps to 'monthly' and a
  // term maps to its own digits. Getting this wrong is silent: an unknown
  // cycle resolves to no price rather than to an error.
  const cycleKey = term === null ? 'monthly' : String(term)
  const checkoutHref =
    `${path(go?.nextSlug)}?plan=${encodeURIComponent(plan ?? 'core')}` +
    `&cycle=${encodeURIComponent(cycleKey)}`

  return (
      <>
        <RdOrderSteps steps={steps} locale={locale} current={1} />
        <div style={{
          maxWidth: "760px",
          margin: "0px auto",
          padding: "36px 20px 64px"
        }} className="rd-du" data-m="pad" data-screen-label="02 Duration" id={anchorId || undefined}>
          <h1 style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(34px, 6.4cqi, 52px)",
            lineHeight: "1.02",
            letterSpacing: "-0.025em"
          }}>{heading}</h1>
          <p style={{
            fontSize: "17px",
            lineHeight: "1.55",
            color: "var(--muted)",
            marginTop: "14px",
            maxWidth: "54ch"
          }}>{intro}</p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px 12px",
            marginTop: "26px"
          }}>
            <span style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(20px, 4.6cqi, 24px)",
              lineHeight: "1.2",
              whiteSpace: "nowrap"
            }}>
              {pick?.planPrefix}
              {planName()}
            </span>
            <a style={{
              borderTop: "0px",
              borderRight: "0px",
              borderBottom: "1.5px solid var(--nb1-dark-brown)",
              borderLeft: "0px",
              borderImage: "initial",
              background: "transparent",
              cursor: "pointer",
              padding: "0px 0px 2px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "12px",
              whiteSpace: "nowrap"
            }} className="rd-or-asbtn" href={path(pick?.switchSlug)}>
              {pick?.switchLabel}
            </a>
          </div>
          <div style={{
            display: "flex",
            marginTop: "26px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "rgba(81, 71, 69, 0.22) 0px 0px 0px 1px inset"
          }}>
            {(pick?.modes || []).map((mode, modeIdx) => (
              <button key={modeIdx} style={tabStyle(modeIdx)} aria-pressed={isCommit === (modeIdx === 1) ? 'true' : 'false'} onClick={() => setMode(modeIdx === 1)}>
                <span style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(16px, 4cqi, 19px)",
                  lineHeight: "1.2",
                  whiteSpace: "nowrap"
                }}>
                  {mode.title}
                </span>
                <span style={tabSubStyle(modeIdx)}>
                  {mode.subtitle}
                </span>
              </button>
            ))}
          </div>
          <RdDurSlot pick={pick} isCommit={isCommit} term={term} setTerm={setTerm} rate={rate} saving={saving} tierStyle={tierStyle} />
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 22px",
            marginTop: "24px",
            padding: "14px 0px",
            borderTop: "1px solid var(--nb1-hairline)",
            borderBottom: "1px solid var(--nb1-hairline)"
          }}>
            {(perks || []).map((perk, perkIdx) => (
              <span key={perkIdx} style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: "8px",
                fontSize: "15px"
              }}>
                <span style={{
                  opacity: "0.6"
                }} aria-hidden="true">{"\u2713"}</span>
                <b style={{
                  fontWeight: "400",
                  color: "rgb(0, 0, 0)"
                }}>{perk.label}</b>
              </span>
            ))}
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px 18px",
            marginTop: "22px"
          }}>
            <span style={{
              fontSize: "15.5px",
              color: "var(--muted)"
            }}>
              {footLabel()}
            </span>
            <a style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.1em",
              border: "0px",
              cursor: "pointer",
              borderRadius: "999px",
              background: "var(--nb1-lime)",
              color: "rgb(0, 0, 0)",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "13.5px",
              padding: "1.05em 1.6em",
              whiteSpace: "nowrap",
              flexShrink: "0"
            }} className="rd-or-asbtn" href={checkoutHref ?? undefined}>
              <span>
                {ctaLabel()}
              </span>
              <span style={{
                fontSize: "1.05em",
                lineHeight: "1"
              }}>{"\u2197"}</span>
            </a>
          </div>
          <h2 style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "22px",
            lineHeight: "1.1",
            marginTop: "46px",
            textAlign: "center"
          }}>{faqHeading}</h2>
          <div style={{
            marginTop: "14px",
            borderTop: "1px solid var(--nb1-hairline)"
          }}>
            {(faq || []).map((row, rowIdx) => (
              <div key={rowIdx} style={{
                borderBottom: "1px solid var(--nb1-hairline)"
              }}>
                <button style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  width: "100%",
                  padding: "17px 0px",
                  border: "0px",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left"
                }} aria-expanded={open === rowIdx ? 'true' : 'false'} onClick={() => setOpen(open === rowIdx ? null : rowIdx)}>
                  <span style={{
                    fontSize: "16px",
                    lineHeight: "1.35",
                    color: "rgb(0, 0, 0)"
                  }}>
                    {row.q}
                  </span>
                  <span style={{
                    fontSize: "20px",
                    lineHeight: "1",
                    flex: "0 0 auto"
                  }} aria-hidden="true">
                    {open === rowIdx ? '−' : '+'}
                  </span>
                </button>
                {(open === rowIdx) ? (
                  <p style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "var(--muted)",
                    padding: "0px 0px 18px",
                    maxWidth: "62ch"
                  }}>
                    {row.a}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdDurComponent = RdDur

export default RdDur
