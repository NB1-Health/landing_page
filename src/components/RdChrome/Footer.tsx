'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { RdFooter as Props } from '@/payload-types'

import { trackLeadSuccess } from '@/lib/dataLayer'

// GENERATED from manifests/section-18.json + bindings/RdFooter.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// THE SIGN-UP FORM IS WIRED — to Klaviyo's client subscriptions endpoint, from
// our own submit handler. See useSignup below for the whole of it.
//
// NOT the hosted embed. The old site footer mounts an empty div and lets
// Klaviyo's script draw an input and a button inside it. That is the cheaper
// integration and it would have thrown away this field: there is no CSS
// anywhere in this repo for `.nb1-klaviyo-live-form`, so the mockup's pill
// input and lime arrow button would have been replaced by the Klaviyo template.
// Posting the address ourselves keeps the markup exactly as drawn.
//
// Off until configured. With no `klaviyoListId` the submit is prevented and
// nothing is sent — the behaviour this footer has had since it shipped — so
// deploying this changes nothing anywhere until a list id is entered.

/*
 * ─── the sign-up box ─────────────────────────────────────────────────────────
 *
 * Pinned, not floating. Klaviyo versions its API by date and an unpinned client
 * silently follows whatever is newest, so the request shape and the code reading
 * it can drift apart without a deploy. This is the revision whose reference the
 * body below was written against.
 */
const KLAVIYO_REVISION = '2024-07-15'
const KLAVIYO_SUBSCRIPTIONS = 'https://a.klaviyo.com/client/subscriptions/'

/*
 * PUBLIC key, and only ever the public key. Klaviyo's own docs are blunt about
 * it — "never use a private API key with our client-side endpoints" — and this
 * is the site id that is already inlined into every page by the onsite script
 * tag in [locale]/layout.tsx. Nothing secret reaches the browser here that was
 * not already there.
 */
const KLAVIYO_COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID?.trim() || ''

type SignupState = 'idle' | 'sending' | 'done' | 'error'

type SignupConfig = {
  klaviyoListId?: string | null
  form?: unknown
  signupNote?: string | null
  signupSending?: string | null
  signupSuccess?: string | null
  signupError?: string | null
}

/** The Payload form, as `depth: 2` returns it. Only three fields are read. */
type PayloadForm = {
  id?: string | number | null
  confirmationType?: string | null
  redirect?: { url?: string | null } | null
}

const asForm = (f: unknown): PayloadForm | null =>
  f && typeof f === 'object' ? (f as PayloadForm) : null

/**
 * Everything the sign-up box does, in one place.
 *
 * WHAT IT REPRODUCES. The old site footer's behaviour, minus the embed: on a
 * successful subscribe it fires the same `lead` dataLayer event, posts the same
 * copy into Payload's form-submissions, and honours the same redirect setting.
 * A reader comparing the two should find three steps in the same order.
 *
 * WHAT IT ADDS. Sending, success and error states. The mockup draws none —
 * the hosted embed used to supply its own success message, and with our own
 * field there is nothing to show unless we show it. The strings are CMS fields
 * rather than literals here, because a hardcoded English "You're on the list"
 * on nine locales is a bug with a long tail.
 *
 * ORDER OF OPERATIONS, and why Klaviyo goes first: it is the only step that
 * actually subscribes anyone. The analytics event, the Payload copy and the
 * redirect are all bookkeeping about a subscription that already happened, so
 * none of them may run unless Klaviyo accepted the address, and none of them
 * may turn a successful subscribe into a visible failure. Hence: await Klaviyo,
 * throw on a non-2xx, and let the rest run after — the Payload copy
 * fire-and-forget, exactly as the old footer has it.
 */
function useSignup(cfg: SignupConfig) {
  const [state, setState] = useState<SignupState>('idle')
  const router = useRouter()
  const params = useParams()
  const warned = useRef(false)

  const listId = (cfg.klaviyoListId || '').trim()
  const ready = Boolean(listId && KLAVIYO_COMPANY_ID)
  const locale = typeof params?.locale === 'string' ? params.locale : 'en'

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Unconfigured: behave exactly as this footer did before it was wired —
      // silent, no request. Loud in the console for whoever is building, quiet
      // in front of whoever is reading. `warned` keeps it to once per mount.
      if (!ready) {
        if (process.env.NODE_ENV !== 'production' && !warned.current) {
          warned.current = true
          console.warn(
            '[rd-footer] sign-up not sent: ' +
              (!KLAVIYO_COMPANY_ID
                ? 'NEXT_PUBLIC_KLAVIYO_COMPANY_ID is empty'
                : `no klaviyoListId on this footer for locale "${locale}"`),
          )
        }
        return
      }
      if (state === 'sending') return

      // Read the field BEFORE anything async. `e.currentTarget` is nulled once
      // the handler returns, so the element is captured too — `form.reset()`
      // below runs after an await and needs a real node, not the event.
      const form = e.currentTarget
      const email = String(new FormData(form).get('email') ?? '').trim()
      if (!email) return

      setState('sending')
      try {
        const res = await fetch(
          `${KLAVIYO_SUBSCRIPTIONS}?company_id=${encodeURIComponent(KLAVIYO_COMPANY_ID)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', revision: KLAVIYO_REVISION },
            body: JSON.stringify({
              data: {
                type: 'subscription',
                attributes: {
                  profile: { data: { type: 'profile', attributes: { email } } },
                  // Shows in Klaviyo next to the profile as where it came from,
                  // which is the only way to tell these apart from the hosted
                  // forms still running on search and product pages.
                  custom_source: 'rd-footer',
                },
                relationships: { list: { data: { type: 'list', id: listId } } },
              },
            }),
          },
        )
        // 202, not 200 — the endpoint is asynchronous. Accept the whole 2xx
        // range rather than equality, so a later 200 does not read as failure.
        if (!res.ok) throw new Error(`klaviyo ${res.status}`)

        // `formId` is a constant, NOT the list id. It feeds a dimension the old
        // footer filled with a Klaviyo FORM id, and tipping list ids into it
        // would mix two kinds of identifier in one analytics field. The surface
        // is what that dimension is for, and `lead_source` already says footer.
        await trackLeadSuccess({
          leadType: 'form_submission',
          leadSource: 'footer',
          formId: 'rd-footer',
          provider: 'klaviyo',
          pageLanguage: locale,
          email,
        })

        const payloadForm = asForm(cfg.form)
        if (payloadForm?.id != null) {
          // Fire-and-forget, as in the old footer. This is a copy for the
          // record; the subscription is already made, and failing to log it
          // must not tell the person their sign-up did not work.
          void fetch('/cms/api/form-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              form: payloadForm.id,
              submissionData: [{ field: 'email', value: email }],
            }),
          }).catch(console.warn)
        }

        form.reset()
        setState('done')

        // Last, and only if asked. Navigating earlier would cut off the two
        // steps above mid-flight.
        //
        // The URL arrives ALREADY LOCALE-RESOLVED and that is not an accident
        // of this code: getRdChrome walks the whole document through
        // localizeUrls, which rewrites every key named `url`, and the form came
        // back populated at depth 2. So a relative `/thank-you` is `/de/danke`
        // by the time it reaches here, and an absolute one is untouched
        // (ABSOLUTE.test short-circuits). The old site footer did NOT do this —
        // it pushed the raw value — so a relative redirect that used to land on
        // the English page now lands on the reader's own.
        if (payloadForm?.confirmationType === 'redirect' && payloadForm.redirect?.url) {
          router.push(payloadForm.redirect.url)
        }
      } catch (err) {
        console.warn('[rd-footer] sign-up failed', err)
        // The field is deliberately NOT reset here: a failed attempt should
        // leave the address where it was so retrying is one click.
        setState('error')
      }
    },
    [ready, state, listId, locale, cfg.form, router],
  )

  const message =
    state === 'sending'
      ? cfg.signupSending || cfg.signupNote || ''
      : state === 'done'
        ? cfg.signupSuccess || cfg.signupNote || ''
        : state === 'error'
          ? cfg.signupError || cfg.signupNote || ''
          : cfg.signupNote || ''

  return { state, onSubmit, message, busy: state === 'sending' }
}

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

  // Called before the two early returns below, because hooks must run in the
  // same order on every render and `variant` can change between them. The slim
  // and stack layouts have no sign-up box, so this is unused there — a few
  // bytes of unused state is the correct price for not breaking the rules of
  // hooks.
  const signup = useSignup(props as SignupConfig)
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
            }} onSubmit={signup.onSubmit}>
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
              }} type={'email'} required={true} placeholder={signupPlaceholder || ''} aria-label={signupInputLabel || 'Your email'} name={'email'} disabled={signup.busy} />
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
                cursor: "pointer",
                opacity: signup.busy ? 0.6 : 1
              }} type="submit" disabled={signup.busy}>
                <span>{signupButtonLabel}</span>
                <span style={{
                  fontSize: "1.05em",
                  lineHeight: "1"
                }}>{"\u2197"}</span>
              </button>
            </form>
            {/*
              THE NOTE LINE IS THE STATUS LINE. The mockup draws one state — an
              empty box — so sending, success and failure had to come from
              somewhere. Reusing this slot rather than adding a fourth element
              means the footer never changes height as the state changes, and it
              introduces no new type style.

              role="status" + aria-live="polite" so the outcome is announced.
              The element is always in the tree, never conditionally mounted:
              aria-live only announces changes to a region that was already
              there, so mounting it on success would say nothing at all.
            */}
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "13px",
              lineHeight: "1.5",
              opacity: signup.state === 'idle' ? "0.55" : "0.85",
              marginTop: "12px"
            }} role="status" aria-live="polite">{signup.message}</p>
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
