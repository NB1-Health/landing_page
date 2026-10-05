'use client'

import React, { useState, useEffect } from 'react'
import RichText from '@/components/RichText'
import type { RdOrderBlock as Props } from '@/payload-types'
import { useAmountTokens } from '@/blocks/redesign/_shared/amountTokens'
import type { AppLocale } from '@/i18n/config'
import { fetchPlansClient, getClientCurrency, formatPrice } from '@/lib/plans/clientUtils'

// GENERATED from manifests/section-02.json + bindings/RdOrder.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-or.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-or` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-or` and NOT `rd-block`.
//
// The whole order page, one block — step 1 of the funnel.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

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

type OrSteps = NonNullable<Props['steps']>

const RdOrderSteps: React.FC<{ steps?: OrSteps | null; locale?: AppLocale; current: number }> = ({ current, locale, steps }) => {
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

export const RdOrderInner: React.FC<Props & { locale?: AppLocale }> = ({ anchorId, cost, faq, hero, locale, plans, proof, steps, sticky, timeline }) => {
  // ---------------------------------------------------------------- state
  //
  // Four pieces, measured off the mockup by driving each control from a fresh
  // load rather than read off its source. `plan` is the big one: the Core state
  // is 14 nodes shorter than Advanced, so it is a second appearance and not a
  // style swap. See claude/order-funnel-v2-stage01.md §6.
  const [plan, setPlan] = useState<'core' | 'advanced'>('advanced')
  const [fm, setFm] = useState(false)
  const [how, setHow] = useState(false)
  // The mockup opens the first four FAQ rows ON LOAD. That is content, not
  // behaviour, so it comes from the field rather than a hard-coded 0..3 — and
  // it is a LAZY INITIALISER, not an effect.
  //
  // It was an effect. Effects run after the first paint, so the page rendered
  // every row shut and then opened four, which is a visible flash on every
  // load; and the harness measures the first render, so it saw seven closed
  // rows against the mockup's four open ones and the trees came out four
  // apart. The initial state has to BE the initial state.
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const seed: Record<number, boolean> = {}
    ;(faq?.rows || []).forEach((r, i) => {
      if (r.openByDefault) seed[i] = true
    })
    return seed
  })

  const isOpen = (i: number) => Boolean(open[i])
  const toggleFaq = (i: number) =>
    setOpen((o: Record<number, boolean>) => ({ ...o, [i]: !o[i] }))

  // The mockup reads ?plan=core|advanced on mount, so a link can land on either
  // card. Kept: it is how the plans page hands over to this one.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('plan')
      if (p === 'core' || p === 'advanced') setPlan(p)
    } catch {
      /* SSR, or a browser that refuses the URL — the default stands */
    }
  }, [])

  // ------------------------------------------------------- backend prices
  //
  // THE SEAM. Prices are not fields: they come from the same endpoint the
  // checkout already uses, so the two screens can never disagree about what a
  // plan costs. An editor owns the card's name, features and footnote; the
  // backend owns the number.
  //
  // Through the app's OWN client, not a fetch of my own. `fetchPlansClient`
  // shares one short-lived request across every price component on the page and
  // retries a transient failure once; a second fetch here would have doubled the
  // request on any page that also renders a price token, and would have had
  // neither the retry nor the 60s cache. `formatPrice` is the app's formatter,
  // so this page's £99 is the same £99 the checkout shows, in the same locale
  // and the same currency — which is the whole point of not putting it in a
  // field.
  //
  // Only the 1-month entry is read. The order page sells the monthly plan; the
  // 4- and 12-month plans stay in the response because the post-checkout upsell
  // needs their ids to create against.
  //
  // A failed fetch leaves the card's seeded price on screen rather than a blank,
  // exactly as CheckoutForm does.
  const [prices, setPrices] = useState<Record<string, string>>({})
  useEffect(() => {
    let live = true
    const loc = locale || 'en'
    fetchPlansClient()
      .then((raw) => {
        if (!live) return
        const currency = getClientCurrency(loc)
        const next: Record<string, string> = {}
        for (const p of raw) {
          if (p.month !== 1) continue
          const amount = p.prices?.[currency]
          if (typeof amount === 'number') {
            next[p.title === 'Advanced' ? 'advanced' : 'core'] = formatPrice(
              amount,
              currency,
              loc,
            )
          }
        }
        setPrices(next)
      })
      .catch(() => {
        /* keep the seeded price */
      })
    return () => {
      live = false
    }
  }, [locale])

  const cards = plans?.cards
  const planPrice = (key?: string | null) => {
    if (key && prices[key]) return prices[key]
    return (cards || []).find((c) => c.key === key)?.seededPrice || ''
  }
  const planLabel = (key?: string | null) =>
    (cards || []).find((c) => c.key === key)?.name || ''

  // ---------------------------------------------------------- bar geometry
  //
  // The change bars encode their readings as positions on the track. Copied as
  // the mockup's own formula — a 1-10 rating mapped across the width — not as
  // the four widths the capture happened to hold, so a changed rating moves the
  // bar instead of leaving it where the designer drew it.
  const barPct = (v?: number | null) => ((Number(v ?? 1) - 1) / 9) * 100
  const barLo = (ch: { from?: number | null; to?: number | null }) =>
    Math.min(barPct(ch.from), barPct(ch.to))
  const barSpan = (ch: { from?: number | null; to?: number | null }) =>
    Math.abs(barPct(ch.to) - barPct(ch.from))

  // ------------------------------------------------------- interpolated styles
  //
  // Four styles the mockup COMPUTES rather than writes. They are reproduced as
  // the mockup's own objects, property for property, because a style the design
  // derives from state is not something a capture can hold: the capture has one
  // state, and copying it verbatim ships that state permanently. The plan cards
  // are the case that matters — the capture has Advanced chosen, so a verbatim
  // copy gives Core a ring it should not have and never moves it.

  // `pc.card`. The selected card gets a 2px ring and a lift; the other a hairline.
  const cardStyle = (key?: string | null): React.CSSProperties => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    width: '100%',
    border: 0,
    cursor: 'pointer',
    borderRadius: '20px',
    padding: '24px 22px',
    background: '#fff',
    color: 'var(--nb1-dark-brown)',
    boxShadow:
      plan === key
        ? 'inset 0 0 0 2px #514745, 0 22px 44px -30px rgba(81,71,69,.45)'
        : 'inset 0 0 0 1px rgba(81,71,69,.16)',
  })

  // `pc.radio`. Lime fill and a heavier ring on the chosen card.
  const radioStyle = (key?: string | null): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    flex: 'none',
    background: plan === key ? 'var(--nb1-lime)' : 'transparent',
    color: '#000',
    boxShadow:
      plan === key
        ? 'inset 0 0 0 1.5px #514745'
        : 'inset 0 0 0 1.5px rgba(81,71,69,.35)',
  })

  // `dr.row`. The total rules itself off from the items above it.
  const costRowStyle = (row: { variant?: string | null }): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '12px 0',
    borderTop:
      row.variant === 'sum'
        ? '1.5px solid rgba(81,71,69,.4)'
        : '1px solid var(--nb1-hairline)',
    ...(row.variant === 'sum' ? { paddingBottom: '16px' } : {}),
  })

  // `dr.vs`. Three shapes, not two.
  //
  // The mockup picks the third by comparing the value to the literal string
  // 'Your time'. That is a test against COPY, and this block runs in nine
  // locales — the German row would have come out at 19px in the price face,
  // silently, and only on the translated pages. The flag moved into the row
  // itself (`softValue`), where an editor can see it and set it.
  const costValStyle = (row: {
    variant?: string | null
    softValue?: boolean | null
  }): React.CSSProperties => ({
    fontFamily: row.softValue
      ? 'var(--nb1-font-secondary)'
      : 'var(--nb1-font-primary)',
    fontSize: row.softValue ? '15px' : row.variant === 'sum' ? '24px' : '19px',
    whiteSpace: 'nowrap',
    flex: 'none',
  })

  // The card's `key` is a Payload select, so its type is
  // `'core' | 'advanced' | null | undefined` — an editor can leave it unset.
  // setPlan takes neither null nor undefined, and the plan a card does not name
  // is not a plan to switch to, so an unset key does nothing rather than
  // throwing the page into a state with no selected card.
  const choose = (key?: 'core' | 'advanced' | null) => {
    if (key) setPlan(key)
  }

  // A SLUG, not a path.
  //
  // Every page in this app lives at /{locale}/{slug}, so storing nine full
  // paths per link is nine chances for one locale to point at another's page.
  // The field holds the slug and the locale is added here. An empty slug is the
  // locale root, which is what the wordmark wants.
  const path = (s?: string | null) => `/${locale || 'en'}${s ? `/${s}` : ''}`

  // `tl.row` — the timeline's row style, which the mockup COMPUTES from two
  // independent flags: the first row has no rule above it (nothing to separate
  // it from), and the row where the first charge lands is filled lime.
  //
  // Not a styleToggle. That is a two-way swap and there are three shapes here,
  // so the lime row was rendering as an ordinary one with no background at all.
  // The flag lives on the row rather than in a test against the copy, so the
  // German timeline highlights the same week the English one does.
  const tlRowStyle = (
    row: { isPayment?: boolean | null },
    i: number,
  ): React.CSSProperties => ({
    display: 'flex',
    gap: '20px',
    padding: '18px 20px',
    borderTop: i === 0 ? 0 : '1px solid var(--nb1-hairline)',
    ...(row?.isPayment
      ? { background: 'color-mix(in oklab,var(--nb1-lime) 45%,#fff)' }
      : {}),
  })

  // The SELECTED card.
  //
  // Three things outside the plan cards describe the chosen plan — the nb1
  // comparison aside's sentence, its ticked benefits, and the timeline's retest
  // line — and all three differ between Core and Advanced. They live on the
  // card rather than on the section that draws them, because it is the plan
  // they describe; this reads whichever one is chosen.
  const card = () => (cards || []).find((c) => c.key === plan)

  // `ctaLabel` — the mockup builds it as `'Continue with ' + planName`, and
  // uses it in two places: the sticky bar and the button under the FAQ. Built
  // once here so the two cannot drift, and so neither says Advanced on the
  // Core page.
  //
  // The prefix and the name are separate fields because the name comes from the
  // backend. Word order does differ between languages; if that matters, this
  // becomes one template field with a placeholder.
  const ctaLabel = () => `${sticky?.ctaPrefix || ''} ${planLabel(plan)}`

  // WHICH duration page. There are two — one per plan — so the sticky CTA's
  // destination follows the selected card. A single slug could only ever have
  // been right for one of them.
  const nextSlug = () =>
    plan === 'core' ? sticky?.nextSlugCore : sticky?.nextSlugAdvanced

  return (
      <>
        <RdOrderSteps steps={steps} locale={locale} current={0} />
        <div style={{
          paddingBottom: "150px"
        }} className="rd-or" id={anchorId || undefined}>
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "36px 20px 8px"
          }} data-m="pad">
            <h1 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(34px, 6.4cqi, 56px)",
              lineHeight: "1.02",
              letterSpacing: "-0.025em",
              maxWidth: "20ch"
            }}>{hero?.heading}</h1>
            <p style={{
              fontSize: "17.5px",
              lineHeight: "1.55",
              color: "var(--muted)",
              marginTop: "16px",
              maxWidth: "52ch"
            }}>{hero?.intro}</p>
          </section>
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "22px 20px"
          }} data-m="pad">
            <figure style={{
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
              padding: "20px",
              borderRadius: "18px",
              background: "rgb(255, 255, 255)",
              boxShadow: "var(--elev)"
            }}>
              <img style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                objectFit: "cover",
                flex: "0 0 auto"
              }} src={mediaUrl(proof?.portrait)} alt={mediaAlt(proof?.portrait)} />
              <div>
                <blockquote style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(18px, 3cqi, 21px)",
                  lineHeight: "1.4"
                }}>{proof?.quote}</blockquote>
                <figcaption style={{
                  fontSize: "14.5px",
                  color: "var(--muted)",
                  marginTop: "12px"
                }}>
                  <b style={{
                    fontWeight: "400",
                    color: "var(--nb1-black)"
                  }}>{proof?.attribution}</b>
                  {proof?.attributionNote}
                </figcaption>
              </div>
            </figure>
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
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
              fontSize: "12.5px"
            }} aria-expanded={fm ? 'true' : 'false'} onClick={() => setFm((v: boolean) => !v)}>
              {proof?.revealLabel}
              <span style={{
                display: "inline-block",
                transition: "transform 0.2s",
                transform: "rotate(180deg)"
              }} aria-hidden="true">{"\u25be"}</span>
            </button>
            {(fm) ? (
              <div style={{
                marginTop: "16px",
                borderRadius: "16px",
                overflow: "hidden",
                background: "rgb(255, 255, 255)",
                boxShadow: "var(--elev)"
              }}>
                <img style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }} src={mediaUrl(proof?.image)} alt={mediaAlt(proof?.image)} />
                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.55",
                  color: "var(--muted)",
                  padding: "16px 18px"
                }}>{proof?.caption}</p>
              </div>
            ) : null}
          </section>
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "30px 20px 40px"
          }} data-m="pad">
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(26px, 4cqi, 34px)",
              lineHeight: "1.1"
            }}>{plans?.heading}</h2>
            <div style={{
              marginTop: "16px",
              borderRadius: "16px",
              background: "var(--tint)",
              padding: "16px 18px 10px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "8px 12px"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(19px, 3.2cqi, 22px)",
                  lineHeight: "1.2",
                  color: "rgb(0, 0, 0)"
                }}>{plans?.subheading}</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "17px",
                    color: "rgba(81, 71, 69, 0.6)",
                    textDecoration: "line-through"
                  }}>{plans?.wasPrice}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "17px",
                    lineHeight: "1",
                    background: "var(--nb1-lime)",
                    color: "rgb(0, 0, 0)",
                    padding: "0.22em 0.5em",
                    borderRadius: "999px"
                  }}>{plans?.nowPrice}</span>
                </span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0px 32px",
                marginTop: "10px"
              }} data-m="two">
                {(plans?.items || []).map((item, itemIdx) => (
                  <div key={itemIdx} style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "14px",
                    padding: "9px 0px",
                    borderTop: "1px solid rgba(81, 71, 69, 0.14)"
                  }}>
                    <span style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "9px",
                      fontSize: "15px",
                      lineHeight: "1.35"
                    }}>
                      <span style={{
                        opacity: "0.55"
                      }} aria-hidden="true">{"\u2713"}</span>
                      {item.label}
                    </span>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      fontSize: "13px",
                      color: "rgba(81, 71, 69, 0.6)",
                      textDecoration: "line-through",
                      whiteSpace: "nowrap"
                    }}>{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "18px",
              marginTop: "20px",
              alignItems: "stretch"
            }} data-m="two">
              <button style={cardStyle(plans?.cards?.[0]?.key)} aria-pressed={plan === plans?.cards?.[0]?.key ? 'true' : 'false'} onClick={() => choose(plans?.cards?.[0]?.key)}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "13px"
                  }}>
                    {plans?.cards?.[0]?.name}
                  </span>
                  <span style={radioStyle(plans?.cards?.[0]?.key)}>
                    {plan === plans?.cards?.[0]?.key ? '✓' : ''}
                  </span>
                </span>
                <span style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginTop: "16px"
                }}>
                  <span style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    /* A flex item defaults to `min-width: auto`, so it refuses
                       to shrink below its content even when that content could
                       wrap. Without this the row overflows the card instead of
                       the column narrowing. */
                    minWidth: 0
                  }}>
                    <span style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontFamily: "var(--nb1-font-primary)",
                        fontSize: "clamp(42px, 7cqi, 52px)",
                        lineHeight: "1",
                        letterSpacing: "-0.02em"
                      }}>
                        {planPrice(plans?.cards?.[0]?.key)}
                      </span>
                      <span style={{
                        fontSize: "16px",
                        opacity: "0.7"
                      }}>{plans?.cards?.[0]?.perLabel}</span>
                    </span>
                    {/* `whiteSpace: "nowrap"` removed. It is why the icons left
                        the card: this line is the widest thing in the price
                        column, nowrap gave the column a floor it would not go
                        below, and the icon cluster beside it is `flex: 0 0 auto`,
                        so neither side could give. Wrapping costs nothing on a
                        wide card — text only breaks when it has to. */}
                    <span style={{
                      fontSize: "14px",
                      color: "var(--muted)"
                    }}>{plans?.cards?.[0]?.meta}</span>
                  </span>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: "0 0 auto"
                  }}>
                    <img style={{
                      width: "34px",
                      height: "34px",
                      display: "block"
                    }} src={mediaUrl(plans?.cards?.[0]?.icon)} alt={mediaAlt(plans?.cards?.[0]?.icon)} />
                  </span>
                </span>
                <span style={{
                  display: "block",
                  height: "1px",
                  background: "var(--nb1-hairline)",
                  margin: "20px 0px 16px"
                }} />
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "12px",
                  color: "var(--muted)"
                }}>
                  {plans?.cards?.[0]?.eyebrow}
                </span>
                <span style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                  marginTop: "12px"
                }}>
                  {(plans?.cards?.[0]?.feats || []).map((cfeat, cfeatIdx) => (
                    <span key={cfeatIdx} style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "10px",
                      fontSize: "15.5px",
                      lineHeight: "1.45"
                    }}>
                      <span style={{
                        opacity: "0.55"
                      }} aria-hidden="true">{"\u2713"}</span>
                      {cfeat.text}
                    </span>
                  ))}
                </span>
                {(plans?.cards?.[0]?.foot) ? (
                  <span style={{
                    display: "block",
                    fontSize: "14.5px",
                    color: "var(--muted)",
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--nb1-hairline)"
                  }}>
                    {plans?.cards?.[0]?.foot}
                  </span>
                ) : null}
              </button>
              <button style={cardStyle(plans?.cards?.[1]?.key)} aria-pressed={plan === plans?.cards?.[1]?.key ? 'true' : 'false'} onClick={() => choose(plans?.cards?.[1]?.key)}>
                {(plans?.cards?.[1]?.badge) ? (
                  <span style={{
                    position: "absolute",
                    top: "-12px",
                    right: "20px",
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: "11.5px",
                    background: "var(--nb1-lime)",
                    color: "var(--nb1-black)",
                    padding: "0.5em 0.9em",
                    borderRadius: "999px",
                    whiteSpace: "nowrap"
                  }}>{plans?.cards?.[1]?.badge}</span>
                ) : null}
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "13px"
                  }}>
                    {plans?.cards?.[1]?.name}
                  </span>
                  <span style={radioStyle(plans?.cards?.[1]?.key)}>
                    {plan === plans?.cards?.[1]?.key ? '✓' : ''}
                  </span>
                </span>
                <span style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginTop: "16px"
                }}>
                  <span style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    /* A flex item defaults to `min-width: auto`, so it refuses
                       to shrink below its content even when that content could
                       wrap. Without this the row overflows the card instead of
                       the column narrowing. */
                    minWidth: 0
                  }}>
                    <span style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontFamily: "var(--nb1-font-primary)",
                        fontSize: "clamp(42px, 7cqi, 52px)",
                        lineHeight: "1",
                        letterSpacing: "-0.02em"
                      }}>
                        {planPrice(plans?.cards?.[1]?.key)}
                      </span>
                      <span style={{
                        fontSize: "16px",
                        opacity: "0.7"
                      }}>{plans?.cards?.[1]?.perLabel}</span>
                    </span>
                    {/* `whiteSpace: "nowrap"` removed. It is why the icons left
                        the card: this line is the widest thing in the price
                        column, nowrap gave the column a floor it would not go
                        below, and the icon cluster beside it is `flex: 0 0 auto`,
                        so neither side could give. Wrapping costs nothing on a
                        wide card — text only breaks when it has to. */}
                    <span style={{
                      fontSize: "14px",
                      color: "var(--muted)"
                    }}>{plans?.cards?.[1]?.meta}</span>
                  </span>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: "0 0 auto"
                  }}>
                    <img style={{
                      width: "34px",
                      height: "34px",
                      display: "block"
                    }} src={mediaUrl(plans?.cards?.[1]?.icon)} alt={mediaAlt(plans?.cards?.[1]?.icon)} />
                    <span style={{
                      opacity: "0.6"
                    }}>{"+"}</span>
                    <img style={{
                      width: "34px",
                      height: "34px",
                      display: "block"
                    }} src={mediaUrl(plans?.cards?.[1]?.icon2)} alt={mediaAlt(plans?.cards?.[1]?.icon2)} />
                  </span>
                </span>
                <span style={{
                  display: "block",
                  height: "1px",
                  background: "var(--nb1-hairline)",
                  margin: "20px 0px 16px"
                }} />
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "12px",
                  color: "var(--muted)"
                }}>
                  {plans?.cards?.[1]?.eyebrow}
                </span>
                <span style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                  marginTop: "12px"
                }}>
                  {(plans?.cards?.[1]?.feats || []).map((afeat, afeatIdx) => (
                    <span key={afeatIdx} style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "10px",
                      fontSize: "15.5px",
                      lineHeight: "1.45"
                    }}>
                      <span style={{
                        opacity: "0.55"
                      }} aria-hidden="true">{"\u2713"}</span>
                      {afeat.text}
                    </span>
                  ))}
                </span>
              </button>
            </div>
            <div style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
              marginTop: "16px",
              padding: "18px 20px",
              borderRadius: "16px",
              background: "var(--tint)"
            }}>
              <span style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                flex: "0 0 auto",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)",
                display: "grid",
                placeItems: "center",
                fontSize: "15px"
              }} aria-hidden="true">{"\u2713"}</span>
              <div>
                <div style={{
                  fontSize: "17px",
                  color: "var(--nb1-black)"
                }}>{plans?.noteHeading}</div>
                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.55",
                  marginTop: "4px"
                }}>{plans?.note}</p>
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px 14px",
              marginTop: "16px",
              padding: "14px",
              borderRadius: "14px",
              boxShadow: "rgba(81, 71, 69, 0.16) 0px 0px 0px 1px inset"
            }}>
              <span style={{
                fontSize: "17px",
                color: "var(--nb1-black)"
              }}>{plans?.trustLabel}</span>
              <span style={{
                display: "inline-flex",
                gap: "2px"
              }}>
                <span style={{
                  width: "22px",
                  height: "22px",
                  background: "rgb(0, 182, 122)",
                  color: "rgb(255, 255, 255)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px"
                }}>{"\u2605"}</span>
                <span style={{
                  width: "22px",
                  height: "22px",
                  background: "rgb(0, 182, 122)",
                  color: "rgb(255, 255, 255)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px"
                }}>{"\u2605"}</span>
                <span style={{
                  width: "22px",
                  height: "22px",
                  background: "rgb(0, 182, 122)",
                  color: "rgb(255, 255, 255)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px"
                }}>{"\u2605"}</span>
                <span style={{
                  width: "22px",
                  height: "22px",
                  background: "rgb(0, 182, 122)",
                  color: "rgb(255, 255, 255)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px"
                }}>{"\u2605"}</span>
                <span style={{
                  width: "22px",
                  height: "22px",
                  background: "linear-gradient(90deg, rgb(0, 182, 122) 50%, rgb(220, 220, 230) 50%)",
                  color: "rgb(255, 255, 255)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px"
                }}>{"\u2605"}</span>
              </span>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "16px",
                color: "var(--nb1-black)"
              }}>
                <span style={{
                  color: "rgb(0, 182, 122)"
                }}>{"\u2605"}</span>
                {plans?.trustName}
              </span>
            </div>
          </section>
          <div style={{
            height: "1px",
            background: "var(--nb1-hairline)"
          }} />
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "44px 20px"
          }} data-m="pad">
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(26px, 4.4cqi, 38px)",
              lineHeight: "1.08",
              maxWidth: "22ch"
            }}>{cost?.heading}</h2>
            <p style={{
              fontSize: "17px",
              lineHeight: "1.55",
              color: "var(--muted)",
              marginTop: "12px",
              maxWidth: "52ch"
            }}>{cost?.intro}</p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "18px",
              marginTop: "22px",
              alignItems: "start"
            }} data-m="cmp">
              <div style={{
                borderRadius: "18px",
                boxShadow: "rgba(81, 71, 69, 0.16) 0px 0px 0px 1px inset",
                padding: "6px 20px 8px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "12px",
                  padding: "14px 0px 10px"
                }}>{cost?.columnLabel}</div>
                {((cost?.rows || []).filter((row) => row.variant !== 'advancedOnly' || plan === 'advanced') || []).map((row, rowIdx) => (
                  <div key={rowIdx} style={costRowStyle(row)}>
                    <span style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      minWidth: "0px"
                    }}>
                      <span style={{
                        fontSize: "16px",
                        color: "var(--nb1-black)"
                      }}>{row.label}</span>
                      {(row.detail) ? (
                        <span style={{
                          fontSize: "14px",
                          lineHeight: "1.4",
                          color: "var(--muted)"
                        }}>{row.detail}</span>
                      ) : null}
                    </span>
                    <span style={costValStyle(row)}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px"
              }}>
                <aside style={{
                  borderRadius: "18px",
                  padding: "22px 20px",
                  background: "rgb(255, 255, 255)",
                  boxShadow: "inset 0 0 0 2px #514745, var(--elev)"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "12.5px"
                  }}>
                    {cost?.asideBrand}
                    {planLabel(plan)}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    marginTop: "10px"
                  }}>
                    <span style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "48px",
                      lineHeight: "1"
                    }}>
                      {planPrice(plan)}
                    </span>
                    <span style={{
                      fontSize: "16px",
                      opacity: "0.7"
                    }}>{cost?.asidePerMonth}</span>
                  </div>
                  <p style={{
                    fontSize: "15.5px",
                    lineHeight: "1.5",
                    marginTop: "10px"
                  }}>
                    {card()?.blurb}
                  </p>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "14px"
                  }}>
                    {(card()?.ticks || []).map((ab, abIdx) => (
                      <span key={abIdx} style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "10px",
                        fontSize: "15px",
                        lineHeight: "1.45"
                      }}>
                        <span style={{
                          opacity: "0.6"
                        }} aria-hidden="true">{"\u2713"}</span>
                        {ab.label}
                      </span>
                    ))}
                  </div>
                </aside>
                <figure>
                  <img style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "16px"
                  }} src={mediaUrl(cost?.asideImage)} alt={mediaAlt(cost?.asideImage)} />
                  <figcaption style={{
                    fontSize: "14px",
                    color: "var(--muted)",
                    marginTop: "8px"
                  }}>{cost?.asideNote}</figcaption>
                </figure>
              </div>
            </div>
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "22px",
              borderWidth: "0px 0px 1px",
              borderTopStyle: "initial",
              borderRightStyle: "initial",
              borderBottomStyle: "solid",
              borderLeftStyle: "initial",
              borderTopColor: "initial",
              borderRightColor: "initial",
              borderBottomColor: "rgba(81, 71, 69, 0.28)",
              borderLeftColor: "initial",
              borderImage: "initial",
              background: "transparent",
              cursor: "pointer",
              padding: "0px 0px 8px",
              fontSize: "16px",
              color: "var(--nb1-dark-brown)"
            }} aria-expanded={how ? 'true' : 'false'} onClick={() => setHow((v: boolean) => !v)}>
              {how ? cost?.howLabelOpen : cost?.howLabel}
              <span style={{
                display: "inline-block",
                transition: "transform 0.2s",
                transform: "rotate(180deg)"
              }} aria-hidden="true">{"\u25be"}</span>
            </button>
            {(how) ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "10px",
                maxWidth: "640px"
              }}>
                {(cost?.howRows || []).map((hr, hrIdx) => (
                  <p key={hrIdx} style={hrIdx === 0 ? {
                    fontSize: "15.5px",
                    lineHeight: "1.6",
                    color: "var(--muted)",
                    padding: "12px 0px",
                    borderTop: "0px"
                  } : {
                    fontSize: "15.5px",
                    lineHeight: "1.6",
                    color: "var(--muted)",
                    padding: "12px 0px",
                    borderTop: "1px solid var(--nb1-hairline)"
                  }}>
                    <b style={{
                      fontWeight: "400",
                      color: "rgb(0, 0, 0)"
                    }}>
                      {hr.label}
                    </b>
                    {" "}
                    {hr.detail}
                  </p>
                ))}
              </div>
            ) : null}
            {(how) ? (
              <p style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "rgba(81, 71, 69, 0.7)",
                marginTop: "16px",
                maxWidth: "640px"
              }}>{cost?.note}</p>
            ) : null}
            <figure style={{
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
              marginTop: "30px",
              padding: "20px",
              borderRadius: "18px",
              background: "rgb(255, 255, 255)",
              boxShadow: "var(--elev)"
            }}>
              <img style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                objectFit: "cover",
                flex: "0 0 auto"
              }} src={mediaUrl(cost?.figureImage)} alt={mediaAlt(cost?.figureImage)} />
              <div>
                <blockquote style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(18px, 3cqi, 21px)",
                  lineHeight: "1.4"
                }}>{cost?.figureQuote}</blockquote>
                <figcaption style={{
                  fontSize: "14.5px",
                  color: "var(--muted)",
                  marginTop: "12px"
                }}>
                  <b style={{
                    fontWeight: "400",
                    color: "var(--nb1-black)"
                  }}>{cost?.figureName}</b>
                  {cost?.figureNote}
                </figcaption>
              </div>
            </figure>
          </section>
          <div style={{
            height: "1px",
            background: "var(--nb1-hairline)"
          }} />
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "44px 20px"
          }} data-m="pad">
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(26px, 4.4cqi, 38px)",
              lineHeight: "1.08"
            }}>{timeline?.heading}</h2>
            <div style={{
              marginTop: "20px",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "rgba(81, 71, 69, 0.16) 0px 0px 0px 1px inset"
            }}>
              {(timeline?.rows || []).map((tl, tlIdx) => (
                <div key={tlIdx} style={tlRowStyle(tl, tlIdx)}>
                  <span style={{
                    flex: "0 0 auto",
                    width: "92px",
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: "12px",
                    paddingTop: "3px"
                  }}>{tl.week}</span>
                  <span style={{
                    fontSize: "16px",
                    lineHeight: "1.5"
                  }}>
                    <b style={{
                      fontWeight: "400",
                      color: "var(--nb1-black)"
                    }}>{tl.title}</b>
                    {" "}
                    {tl.detail}
                    {(tl.isRetest && card()?.retestNote) ? (
                      <span style={{
                        display: "block",
                        fontSize: "14.5px",
                        color: "var(--muted)",
                        marginTop: "4px"
                      }}>{card()?.retestNote}</span>
                    ) : null}
                  </span>
                </div>
              ))}
              {(plan === 'advanced') ? (
                <div style={{
                  display: "flex",
                  gap: "20px",
                  padding: "18px 20px",
                  background: "var(--tint)",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  <span style={{
                    flex: "0 0 auto",
                    width: "92px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <span style={{
                      alignSelf: "flex-start",
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontSize: "11px",
                      background: "var(--nb1-blue-grey)",
                      color: "rgb(0, 0, 0)",
                      padding: "0.3em 0.6em",
                      borderRadius: "6px"
                    }}>{timeline?.advancedBadge}</span>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontSize: "12px"
                    }}>{timeline?.advancedCadence}</span>
                  </span>
                  <span style={{
                    fontSize: "16px",
                    lineHeight: "1.5"
                  }}>
                    <b style={{
                      fontWeight: "400",
                      color: "var(--nb1-black)"
                    }}>{timeline?.advancedLead}</b>
                    {timeline?.advancedNote}
                  </span>
                </div>
              ) : null}
            </div>
            <div style={{
              marginTop: "20px",
              borderRadius: "18px",
              background: "rgb(255, 255, 255)",
              boxShadow: "var(--elev)",
              padding: "24px 22px 20px"
            }}>
              <h3 style={{
                fontFamily: "var(--nb1-font-primary)",
                fontWeight: "400",
                fontSize: "clamp(22px, 3.6cqi, 28px)",
                lineHeight: "1.15"
              }}>{timeline?.changesHeading}</h3>
              <div style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px 22px",
                marginTop: "18px"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(52px, 9cqi, 68px)",
                  lineHeight: "0.9",
                  letterSpacing: "-0.03em"
                }}>{timeline?.scoreValue}</span>
                <span style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <span style={{
                    fontSize: "16px",
                    color: "rgb(0, 0, 0)"
                  }}>{timeline?.scoreLabel}</span>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{
                      fontSize: "13.5px",
                      background: "var(--nb1-lime)",
                      color: "rgb(0, 0, 0)",
                      padding: "0.3em 0.65em",
                      borderRadius: "999px",
                      whiteSpace: "nowrap"
                    }}>{timeline?.scoreDelta}</span>
                    <span style={{
                      fontSize: "14.5px",
                      color: "var(--muted)"
                    }}>{timeline?.scoreSource}</span>
                  </span>
                </span>
              </div>
              <div style={{
                position: "relative",
                height: "8px",
                borderRadius: "999px",
                background: "rgba(81, 71, 69, 0.1)",
                marginTop: "18px"
              }}>
                <span style={{
                  position: "absolute",
                  inset: "0px 19.8% 0px 68.3%",
                  background: "var(--nb1-lime)",
                  borderRadius: "999px"
                }} />
                <span style={{
                  position: "absolute",
                  left: "68.3%",
                  top: "50%",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgb(255, 255, 255)",
                  boxShadow: "rgba(81, 71, 69, 0.45) 0px 0px 0px 2px inset"
                }} />
                <span style={{
                  position: "absolute",
                  left: "80.2%",
                  top: "50%",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgb(81, 71, 69)",
                  boxShadow: "rgb(255, 255, 255) 0px 0px 0px 3px"
                }} />
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "var(--muted)",
                marginTop: "8px"
              }}>
                <span>{timeline?.scaleMin}</span>
                <span>{timeline?.scaleMax}</span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "24px",
                paddingTop: "18px",
                borderTop: "1px solid var(--nb1-hairline)"
              }}>
                <span style={{
                  fontSize: "16.5px",
                  color: "rgb(0, 0, 0)"
                }}>{timeline?.barsLabel}</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "13.5px",
                  color: "var(--muted)"
                }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      boxShadow: "rgba(81, 71, 69, 0.45) 0px 0px 0px 2px inset"
                    }} />
                    {"Before"}
                  </span>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      background: "rgb(81, 71, 69)"
                    }} />
                    {"After"}
                  </span>
                </span>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "6px"
              }}>
                {(timeline?.changes || []).map((ch, chIdx) => (
                  <div key={chIdx} style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0px, 92px) minmax(0px, 1fr) auto",
                    alignItems: "center",
                    gap: "14px",
                    padding: "13px 0px",
                    borderTop: "1px solid var(--nb1-hairline)"
                  }}>
                    <span style={{
                      fontSize: "15.5px"
                    }}>{ch.label}</span>
                    <span style={{
                      position: "relative",
                      height: "6px",
                      borderRadius: "999px",
                      background: "rgba(81, 71, 69, 0.1)"
                    }}>
                      <span style={{ ...{
                        position: "absolute",
                        top: "0px",
                        bottom: "0px",
                        background: "var(--nb1-lime)",
                        borderRadius: "999px"
                      }, left: barLo(ch) + '%', width: barSpan(ch) + '%' }} />
                      <span style={{ ...{
                        width: "12px",
                        height: "12px",
                        background: "rgb(255, 255, 255)",
                        boxShadow: "rgba(81, 71, 69, 0.45) 0px 0px 0px 2px inset",
                        position: "absolute",
                        top: "50%",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)"
                      }, left: barPct(ch.from) + '%' }} />
                      <span style={{ ...{
                        width: "14px",
                        height: "14px",
                        background: "rgb(81, 71, 69)",
                        boxShadow: "rgb(255, 255, 255) 0px 0px 0px 3px",
                        position: "absolute",
                        top: "50%",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)"
                      }, left: barPct(ch.to) + '%' }} />
                    </span>
                    <span style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "18px",
                      whiteSpace: "nowrap"
                    }}>{ch.from + ' → ' + ch.to}</span>
                  </div>
                ))}
              </div>
              <p style={{
                fontSize: "13.5px",
                lineHeight: "1.55",
                color: "var(--muted)",
                marginTop: "14px"
              }}>{timeline?.note}</p>
            </div>
            <figure style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              marginTop: "20px"
            }}>
              <img style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                flex: "0 0 auto"
              }} src={mediaUrl(timeline?.figureImage)} alt={mediaAlt(timeline?.figureImage)} />
              <blockquote style={{
                fontSize: "15.5px",
                lineHeight: "1.55"
              }}>
                {timeline?.figureQuote}
                <span style={{
                  display: "block",
                  fontSize: "14px",
                  color: "var(--muted)",
                  marginTop: "4px"
                }}>{timeline?.figureAttribution}</span>
              </blockquote>
            </figure>
          </section>
          <div style={{
            height: "1px",
            background: "var(--nb1-hairline)"
          }} />
          <section style={{
            maxWidth: "1040px",
            margin: "0px auto",
            padding: "44px 20px"
          }} data-m="pad">
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(26px, 4.4cqi, 38px)",
              lineHeight: "1.08"
            }}>{faq?.heading}</h2>
            <div style={{
              marginTop: "16px",
              borderTop: "1px solid var(--nb1-hairline)"
            }}>
              {(faq?.rows || []).map((q, qIdx) => (
                <div key={qIdx} style={{
                  borderBottom: "1px solid var(--nb1-hairline)"
                }}>
                  <button style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    width: "100%",
                    padding: "18px 0px",
                    border: "0px",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left"
                  }} aria-expanded={isOpen(qIdx) ? 'true' : 'false'} onClick={() => toggleFaq(qIdx)}>
                    <span style={{
                      fontSize: "17px",
                      lineHeight: "1.35",
                      color: "var(--nb1-black)"
                    }}>{q.q}</span>
                    <span style={{
                      fontSize: "20px",
                      lineHeight: "1",
                      flex: "0 0 auto"
                    }} aria-hidden="true">{isOpen(qIdx) ? '−' : '+'}</span>
                  </button>
                  {(isOpen(qIdx)) ? (
                    <div style={{
                      fontSize: "15.5px",
                      lineHeight: "1.6",
                      color: "var(--muted)",
                      padding: "0px 0px 18px",
                      maxWidth: "64ch"
                    }} className="rd-ort">
                      {(q.a)?.root ? (
                        <RichText data={q.a} enableGutter={false} enableProse={false} />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "14px",
              marginTop: "30px"
            }} data-m="two">
              {(faq?.stories || []).map((st, stIdx) => (
                <figure key={stIdx} style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "20px",
                  borderRadius: "18px",
                  background: "rgb(255, 255, 255)",
                  boxShadow: "var(--elev)"
                }}>
                  <img style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flex: "0 0 auto"
                  }} src={mediaUrl(st.image)} alt={mediaAlt(st.image)} />
                  <div>
                    <blockquote style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "19px",
                      lineHeight: "1.4"
                    }}>{st.quote}</blockquote>
                    <figcaption style={{
                      fontSize: "14px",
                      color: "var(--muted)",
                      marginTop: "10px"
                    }}>{st.name}</figcaption>
                  </div>
                </figure>
              ))}
            </div>
            <div style={{
              marginTop: "36px",
              padding: "32px 22px",
              borderRadius: "20px",
              background: "rgb(255, 255, 255)",
              boxShadow: "var(--elev)",
              textAlign: "center"
            }}>
              <h2 style={{
                fontFamily: "var(--nb1-font-primary)",
                fontWeight: "400",
                fontSize: "clamp(26px, 4.6cqi, 38px)",
                lineHeight: "1.1",
                maxWidth: "22ch",
                margin: "0px auto"
              }}>{faq?.closingHeading}</h2>
              <a style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                marginTop: "22px",
                border: "0px",
                cursor: "pointer",
                borderRadius: "999px",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "14px",
                padding: "1.1em 1.7em",
                whiteSpace: "nowrap",
                flexShrink: "0"
              }} href={path(nextSlug())}>
                <span>{ctaLabel()}</span>
                <span style={{
                  fontSize: "1.05em",
                  lineHeight: "1"
                }}>{"\u2197"}</span>
              </a>
            </div>
          </section>
          <div style={{
            position: "fixed",
            left: "0px",
            right: "0px",
            bottom: "0px",
            zIndex: "35",
            background: "rgba(240, 245, 255, 0.97)",
            borderTop: "1px solid var(--nb1-hairline)",
            boxShadow: "rgba(81, 71, 69, 0.4) 0px -12px 30px -20px"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: "10px",
              justifyContent: "space-between",
              maxWidth: "1040px",
              margin: "0px auto",
              padding: "12px 20px"
            }} data-m="sticky">
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "4px 10px",
                fontSize: "15px"
              }}>
                <span>
                  {sticky?.selectedPrefix}
                  <b style={{
                    fontWeight: "400",
                    color: "rgb(0, 0, 0)"
                  }}>{planLabel(plan)}</b>
                  {sticky?.selectedSuffix}
                </span>
                <button style={{
                  border: "0px",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "0px",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px"
                }} onClick={() => setPlan(plan === 'core' ? 'advanced' : 'core')}>{sticky?.switchLabel}</button>
                <span style={{
                  color: "var(--muted)"
                }}>{sticky?.note}</span>
              </div>
              <a style={{
                display: "flex",
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
                padding: "1em 1.6em",
                whiteSpace: "nowrap",
                flexShrink: "0"
              }} className="rd-or-asbtn" href={path(nextSlug())}>
                <span>{ctaLabel()}</span>
                <span style={{
                  fontSize: "1.05em",
                  lineHeight: "1"
                }}>{"\u2197"}</span>
              </a>
            </div>
          </div>
        </div>
      </>
  )
}

/* ── Exported wrapper (amount tokens) ─────────────────────────────────
 *
 * The seeded copy carries `{{149}}`, `{{463}}`, `{{fee:kit}}`. RenderBlocks
 * already resolved the REFS before this block was rendered — `usePriceTokens`
 * walks every block's props — but it resolves only `price:` and `fee:`:
 * `hasToken()` tests for those two words and `replaceTokens()` walks TOKEN_RE.
 * A plain amount matches neither and reaches the page literally, which is what
 * `{{463}}` did in the plan panel.
 *
 * So the amounts are resolved here, once, over the whole props tree. See
 * _shared/amountTokens.ts for why this is per-block rather than one line in
 * usePriceTokens.
 */
export const RdOrder: React.FC<Props & { locale?: AppLocale }> = (props) => (
  <RdOrderInner {...useAmountTokens(props, props.locale)} />
)

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdOrderComponent = RdOrder

export default RdOrder
