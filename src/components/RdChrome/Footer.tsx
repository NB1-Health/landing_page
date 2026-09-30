'use client'

import React from 'react'
import type { RdFooter as Props } from '@/payload-types'

// GENERATED from manifests/section-18.json + bindings/RdFooter.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// THE SIGN-UP FORM IS NOT WIRED. It renders exactly as the mockup draws it and
// its submit is prevented, so nothing is silently swallowed and no half-working
// request is made. The repo already has the integration to use — `Footers.form`
// is a relationship to a Payload Form Builder form, labelled "Klaviyo Form
// (Payload submission)" — and hooking this up to it is on the punch list. Until
// then the box collects nothing, deliberately and visibly.
//
// No state and no effects otherwise: the footer has no interactions. It stays a
// client component because it is imported alongside the header.

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

// THE ROOT IS THE SAME ON ALL THREE PAGES. Dark-brown ground, cool-grey ink, one
// hairline on top — byte-identical in the homepage, Our Plans, Protocol and Lab
// mockups. Only what sits inside it changes, which is what makes this a layout
// switch on one component rather than three components.
const ROOT: React.CSSProperties = {
  background: "var(--nb1-dark-brown)",
  color: "var(--nb1-cool-grey)",
  borderTop: "1px solid rgba(240, 245, 255, 0.12)",
}

const LINK_ROW_BASE: React.CSSProperties = {
  fontFamily: "var(--nb1-font-tertiary)",
  textTransform: "uppercase",
}

/**
 * Our Plans' footer. ONE FLEX ROW — logo, links, copyright — and 117px tall
 * against the homepage's 559px.
 *
 * No `data-d="pad"` on the container, deliberately: the mockup writes a flat
 * `padding: 48px` here and does not opt this row into the shared padding scale.
 * Adding the attribute would hand it the homepage's breakpoint padding and the
 * difference would not show until a phone.
 *
 * Its two opacities are literals rather than fields, because exactly one page
 * uses this layout. The `stack` variant below is the one drawn twice, and that
 * is where the tone fields earn their place.
 */
const SlimFooter: React.FC<Props> = ({ logo, copyright, ...props }) => {
  const links = props.columnOneLinks ?? []
  return (
    <footer style={ROOT} className="rd-block rd-chrome rd-footer">
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "24px"
      }}>
        {mediaUrl(logo) ? (
          <img src={mediaUrl(logo)} alt={mediaAlt(logo)} style={{
            height: "20px",
            width: "auto"
          }} />
        ) : null}
        <div style={{
          ...LINK_ROW_BASE,
          display: "flex",
          gap: "28px",
          letterSpacing: "0.1em",
          fontSize: "11.5px",
          opacity: "0.8"
        }}>
          {links.map((l, i) => (
            <a key={l.id ?? i} href={l.url ?? '#'}>{l.label}</a>
          ))}
        </div>
        <div style={{
          ...LINK_ROW_BASE,
          letterSpacing: "0.08em",
          fontSize: "10.5px",
          opacity: "0.5"
        }}>{copyright}</div>
      </div>
    </footer>
  )
}

/**
 * The Protocol's and The Lab's footer. Logo, tagline, a link row under its own
 * hairline, copyright — stacked, 279px.
 *
 * `data-d="pad"` IS on this container, because the mockup puts it there. That
 * opts it into the shared padding scale, which is what the two pages draw.
 *
 * The link row takes a COLOUR on The Protocol and an OPACITY on The Lab. Both
 * are carried rather than reconciled: see the `tone` group in the collection for
 * why, and for what to change if that decision is revisited.
 */
const StackFooter: React.FC<Props> = ({ logo, tagline, copyright, tone, ...props }) => {
  const links = props.columnOneLinks ?? []
  const linkColor = tone?.linkRowColor || undefined
  return (
    <footer style={ROOT} className="rd-block rd-chrome rd-footer">
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "52px 20px 40px"
      }} data-d="pad">
        {mediaUrl(logo) ? (
          <img src={mediaUrl(logo)} alt={mediaAlt(logo)} style={{
            height: "20px",
            width: "auto",
            alignSelf: "flex-start"
          }} />
        ) : null}
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15px",
          lineHeight: "1.5",
          opacity: tone?.taglineOpacity ?? "0.78",
          marginTop: "18px",
          maxWidth: "44ch"
        }}>{tagline}</p>
        <div style={{
          ...LINK_ROW_BASE,
          display: "flex",
          flexWrap: "wrap",
          gap: "22px",
          marginTop: "28px",
          paddingTop: "24px",
          borderTop: "1px solid rgba(240, 245, 255, 0.14)",
          letterSpacing: "0.08em",
          fontSize: "10.5px",
          ...(linkColor ? { color: linkColor } : { opacity: tone?.linkRowOpacity ?? "0.75" })
        }}>
          {links.map((l, i) => (
            <a key={l.id ?? i} href={l.url ?? '#'}>{l.label}</a>
          ))}
        </div>
        <div style={{
          ...LINK_ROW_BASE,
          letterSpacing: "0.08em",
          fontSize: "10.5px",
          color: tone?.copyrightColor ?? "rgba(240, 245, 255, 0.62)",
          marginTop: "20px"
        }}>{copyright}</div>
      </div>
    </footer>
  )
}

export const RdFooter: React.FC<Props> = (props) => {
  const {
    logo, tagline, signupLabel, signupPlaceholder, signupInputLabel,
    signupButtonLabel, signupNote,
    columnOneTitle, columnTwoTitle, columnThreeTitle,
    copyright, social, disclaimer,
  } = props
  // The two new layouts return BEFORE the homepage's markup, so that markup is
  // not touched at all — not wrapped, not re-indented, not made conditional. A
  // row with no variant (every row that existed before this field) falls
  // through to it, which is what keeps the shipped footer exactly as it was.
  if (props.variant === 'slim') return <SlimFooter {...props} />
  if (props.variant === 'stack') return <StackFooter {...props} />

  const columnOneLinks = props.columnOneLinks ?? []
  const columnTwoLinks = props.columnTwoLinks ?? []
  const columnThreeLinks = props.columnThreeLinks ?? []
  const legalLinks = props.legalLinks ?? []
  return (
    <footer style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)",
      borderTop: "1px solid rgba(240, 245, 255, 0.12)"
    }} className="rd-block rd-chrome rd-footer">
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "52px 20px 40px"
      }} data-d="pad" data-m="stack">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "40px"
        }} data-d="foot">
          <div style={{
            maxWidth: "38ch"
          }}>
            <img style={{
              height: "22px",
              width: "auto",
              display: "block"
            }} src={mediaUrl(logo)} alt={mediaAlt(logo)} />
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "15.5px",
              lineHeight: "1.5",
              opacity: "0.72",
              marginTop: "18px"
            }}>{tagline}</p>
            <div style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "10.5px",
              opacity: "0.55",
              marginTop: "30px"
            }}>{signupLabel}</div>
            <form style={{
              display: "flex",
              gap: "10px",
              marginTop: "14px",
              flexWrap: "wrap"
            }} onSubmit={(e) => e.preventDefault()}>
              <input style={{
                flex: "1 1 200px",
                minWidth: "0px",
                background: "transparent",
                border: "1px solid rgba(240, 245, 255, 0.28)",
                borderRadius: "999px",
                padding: "0.95em 1.2em",
                color: "var(--nb1-cool-grey)",
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15px"
              }} type={'email'} required={true} placeholder={signupPlaceholder || ''} aria-label={signupInputLabel || 'Your email'} name={'email'} />
              <button style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "11.5px",
                background: "var(--cta)",
                color: "var(--nb1-black)",
                border: "0px",
                padding: "0.95em 1.4em",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                flexShrink: "0",
                cursor: "pointer"
              }} type="submit">
                <span>{signupButtonLabel}</span>
                <span style={{
                  fontSize: "1.05em",
                  lineHeight: "1"
                }}>{"\u2197"}</span>
              </button>
            </form>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "13px",
              lineHeight: "1.5",
              opacity: "0.55",
              marginTop: "12px"
            }}>{signupNote}</p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "36px 28px"
          }} data-m="footcols">
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "13px"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(240, 245, 255, 0.72)"
              }}>{columnOneTitle}</div>
              {(columnOneLinks || []).map((c1, c1Idx) => (
                <a key={c1Idx} style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15.5px",
                  color: "var(--nb1-cool-grey)",
                  opacity: "0.86"
                }} href={c1.url || '#'}>{c1.label}</a>
              ))}
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "13px"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(240, 245, 255, 0.72)"
              }}>{columnTwoTitle}</div>
              {(columnTwoLinks || []).map((c2, c2Idx) => (
                <a key={c2Idx} style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15.5px",
                  color: "var(--nb1-cool-grey)",
                  opacity: "0.86"
                }} href={c2.url || '#'}>{c2.label}</a>
              ))}
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "13px"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(240, 245, 255, 0.72)"
              }}>{columnThreeTitle}</div>
              {(columnThreeLinks || []).map((c3, c3Idx) => (
                <a key={c3Idx} style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15.5px",
                  color: "var(--nb1-cool-grey)",
                  opacity: "0.86"
                }} href={c3.url || '#'}>{c3.label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{
          height: "1px",
          background: "rgba(240, 245, 255, 0.16)",
          margin: "40px 0px 24px"
        }} />
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "14px",
            opacity: "0.6"
          }}>{copyright}</div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "26px",
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "14px",
            opacity: "0.72"
          }}>
            {(legalLinks || []).map((legal, legalIdx) => (
              <a key={legalIdx} style={{
                color: "var(--nb1-cool-grey)"
              }} href={legal.url || '#'}>{legal.label}</a>
            ))}
          </div>
          <a style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "14px",
            color: "var(--nb1-cool-grey)",
            opacity: "0.72"
          }} href={social?.url || '#'}>{social?.label}</a>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "12.5px",
            lineHeight: "1.55",
            opacity: "0.42",
            maxWidth: "74ch",
            marginTop: "6px"
          }}>{disclaimer}</p>
        </div>
      </div>
    </footer>
  )
}

export const RdFooterComponent = RdFooter

export default RdFooter
