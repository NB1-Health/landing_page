'use client'

import React, { useState } from 'react'
import { getDictionary } from '@/i18n/getDictionary'

// Same backend base the checkout blocks use.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'

type Method = {
  icon?: string | null
  title?: string | null
  body?: string | null
  linkLabel?: string | null
  linkHref?: string | null
}
type LinkItem = { label?: string | null; url?: string | null }
type Topic = { label?: string | null }

type Props = {
  title?: string | null
  subheading?: string | null
  methodsLabel?: string | null
  methods?: Method[] | null
  legalLinks?: LinkItem[] | null
  formHeading?: string | null
  formNote?: string | null
  recipientEmail?: string | null
  topics?: Topic[] | null
  submitLabel?: string | null
  formHint?: string | null
  showName?: boolean | null
  showEmail?: boolean | null
  showTopic?: boolean | null
  showOrder?: boolean | null
  nameLabel?: string | null
  namePlaceholder?: string | null
  emailLabel?: string | null
  emailPlaceholder?: string | null
  topicLabel?: string | null
  orderLabel?: string | null
  orderPlaceholder?: string | null
  messageLabel?: string | null
  messagePlaceholder?: string | null
  calloutHeading?: string | null
  calloutBody?: string | null
  calloutCtaLabel?: string | null
  calloutCtaHref?: string | null
  locale?: string
}

const ICONS: Record<string, React.ReactNode> = {
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
  ),
  location: (
    <>
      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}

export const ContactPageComponent: React.FC<Props> = ({
  title,
  subheading,
  methodsLabel,
  methods,
  legalLinks,
  formHeading,
  formNote,
  recipientEmail,
  topics,
  submitLabel,
  formHint,
  showName,
  showEmail,
  showTopic,
  showOrder,
  nameLabel,
  namePlaceholder,
  emailLabel,
  emailPlaceholder,
  topicLabel,
  orderLabel,
  orderPlaceholder,
  messageLabel,
  messagePlaceholder,
  calloutHeading,
  calloutBody,
  calloutCtaLabel,
  calloutCtaHref,
  locale,
}) => {
  const dict = getDictionary(locale)
  const topicList = (topics ?? []).map((t) => t.label).filter(Boolean) as string[]
  // Per-field visibility (default on — null/undefined means show).
  const nameOn = showName !== false
  const emailOn = showEmail !== false
  const topicOn = showTopic !== false && topicList.length > 0
  const orderOn = showOrder !== false
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: topicList[0] || 'My order',
    order: '',
    message: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Sends through the backend (POST /contact/public → Postmark) instead of a
  // mailto: link — mailto silently does nothing on devices without a default
  // mail app, which read as "the button is broken".
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError(null)

    const email = form.email.trim()
    const message = form.message.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!message) {
      setError('Please write a message.')
      return
    }

    // "Jane van Doe" → firstName "Jane", lastName "van Doe"
    const nameParts = form.name.trim().split(/\s+/).filter(Boolean)

    setSending(true)
    try {
      const res = await fetch(`${BACKEND_URL}/contact/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: nameParts[0] || undefined,
          lastName: nameParts.slice(1).join(' ') || undefined,
          email,
          message,
          about: topicOn ? form.topic : undefined,
          kit_number: orderOn && form.order.trim() ? form.order.trim() : undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSent(true)
    } catch {
      setError(
        `Something went wrong — please try again, or email us directly at ${recipientEmail || 'support@nb1.com'}.`,
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <section className="lg-hero">
        <div className="lg-hero-in">
          <h1>{title}</h1>
          {subheading && <p className="lg-hero-sub">{subheading}</p>}
        </div>
      </section>

      <div className="ct-body">
        <div className="ct-grid">
          {/* ways to reach us */}
          <aside>
            {methodsLabel && <p className="ct-aside-label">{methodsLabel}</p>}
            {(methods ?? []).map((m, i) => (
              <div className="ct-method" key={i}>
                <div className="ct-ico">
                  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[m.icon || 'email'] ?? ICONS.email}
                  </svg>
                </div>
                <div>
                  <h3>{m.title}</h3>
                  {m.body && (
                    <p>
                      {m.body.split('\n').map((line, j, arr) => (
                        <React.Fragment key={j}>
                          {line}
                          {j < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  )}
                  {m.linkLabel && (
                    <a className="ct-mail" href={m.linkHref || '#'}>
                      {m.linkLabel}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {legalLinks && legalLinks.length > 0 && (
              <div className="ct-legal-row">
                {legalLinks.map((l, i) => (
                  <a key={i} href={l.url || '#'}>
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </aside>

          {/* message form */}
          <div className="ct-form-card">
            {formHeading && <h2>{formHeading}</h2>}
            {formNote && <p className="ct-form-note">{formNote}</p>}
            {sent ? (
              <div className="ct-status ct-status--success">
                Thank you! Your message has been sent — we usually reply within 1–2 working days.
              </div>
            ) : (
            <form onSubmit={onSubmit} noValidate>
              {(nameOn || emailOn) && (
                <div className={nameOn && emailOn ? 'ct-row2' : undefined}>
                  {nameOn && (
                    <div className="ct-field">
                      <label htmlFor="ct-name">{nameLabel || 'Your name'}</label>
                      <input
                        id="ct-name"
                        type="text"
                        autoComplete="name"
                        placeholder={namePlaceholder || 'Jane Doe'}
                        value={form.name}
                        onChange={set('name')}
                      />
                    </div>
                  )}
                  {emailOn && (
                    <div className="ct-field">
                      <label htmlFor="ct-email">{emailLabel || 'Your email'}</label>
                      <input
                        id="ct-email"
                        type="email"
                        autoComplete="email"
                        placeholder={emailPlaceholder || 'jane@example.com'}
                        value={form.email}
                        onChange={set('email')}
                      />
                    </div>
                  )}
                </div>
              )}
              {topicOn && (
                <div className="ct-field">
                  <label htmlFor="ct-topic">{topicLabel || 'What’s it about?'}</label>
                  <select id="ct-topic" value={form.topic} onChange={set('topic')}>
                    {topicList.map((t, i) => (
                      <option key={i} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {orderOn && (
                <div className="ct-field">
                  <label htmlFor="ct-order">{orderLabel || 'Order number (optional)'}</label>
                  <input
                    id="ct-order"
                    type="text"
                    placeholder={orderPlaceholder || 'e.g. NB1-10428'}
                    value={form.order}
                    onChange={set('order')}
                  />
                </div>
              )}
              <div className="ct-field">
                <label htmlFor="ct-msg">{messageLabel || 'Message'}</label>
                <textarea
                  id="ct-msg"
                  placeholder={messagePlaceholder || dict.forms.contactMessagePlaceholder}
                  value={form.message}
                  onChange={set('message')}
                />
              </div>
              {error && <div className="ct-status ct-status--error">{error}</div>}
              <button
                className="ct-send"
                type="submit"
                disabled={sending}
                style={sending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {sending ? dict.forms.contactSending : submitLabel || dict.forms.contactSubmit}
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
              {formHint && <p className="ct-hint">{formHint}</p>}
            </form>
            )}
          </div>
        </div>
      </div>

      {calloutHeading && (
        <div className="lg-callout">
          <div>
            <h3>{calloutHeading}</h3>
            {calloutBody && <p>{calloutBody}</p>}
          </div>
          {calloutCtaLabel && (
            <a className="lg-co-btn" href={calloutCtaHref || '#'}>
              {calloutCtaLabel}
            </a>
          )}
        </div>
      )}

      <style jsx>{`
        .lg-hero {
          position: relative;
          background: #f7fafc;
          overflow: hidden;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(64% 84% at 90% -12%, rgba(10, 143, 176, 0.12) 0%, transparent 56%),
            radial-gradient(56% 74% at -4% 112%, rgba(120, 162, 196, 0.1) 0%, transparent 58%);
        }
        .lg-hero-in {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 62px 40px 52px;
        }
        .lg-hero h1 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4.6vw, 54px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #12314d;
          margin: 0;
        }
        .lg-hero-sub {
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.58;
          color: rgba(18, 49, 77, 0.7);
          margin: 20px 0 0;
          max-width: 620px;
          text-wrap: pretty;
        }

        .ct-body {
          max-width: 1180px;
          margin: 0 auto;
          padding: 64px 40px 96px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .ct-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 54px;
          align-items: start;
        }
        .ct-aside-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          margin: 0 0 18px;
        }
        .ct-method {
          display: flex;
          gap: 16px;
          padding: 22px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .ct-method:first-of-type {
          border-top: none;
          padding-top: 0;
        }
        .ct-ico {
          flex: none;
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: rgba(10, 143, 176, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ct-ico svg {
          width: 20px;
          height: 20px;
          stroke: #0a8fb0;
          fill: none;
          stroke-width: 1.8;
        }
        .ct-method h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: #12314d;
          margin: 2px 0 4px;
        }
        .ct-method p {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.7);
          margin: 0;
        }
        .ct-method a.ct-mail {
          display: inline-block;
          margin-top: 4px;
          font-size: 15px;
          font-weight: 600;
          color: #0a8fb0;
          text-decoration: none;
        }
        .ct-method a.ct-mail:hover {
          color: #0a8fb0;
        }
        .ct-legal-row {
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ct-legal-row a {
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(18, 49, 77, 0.55);
          text-decoration: none;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 100px;
          padding: 6px 13px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ct-legal-row a:hover {
          color: #12314d;
          border-color: rgba(18, 49, 77, 0.4);
        }

        .ct-form-card {
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 30px 30px 32px;
          box-shadow: 0 30px 60px -42px rgba(18, 49, 77, 0.5);
        }
        .ct-form-card h2 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 21px;
          letter-spacing: -0.02em;
          color: #12314d;
          margin: 0 0 4px;
        }
        .ct-form-card .ct-form-note {
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.55);
          margin: 0 0 24px;
        }
        .ct-field {
          margin-bottom: 17px;
        }
        .ct-field label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #12314d;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }
        .ct-field input,
        .ct-field select,
        .ct-field textarea {
          width: 100%;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 14.5px;
          color: #12314d;
          background: #fbfcfd;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 11px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .ct-field textarea {
          min-height: 128px;
          resize: vertical;
          line-height: 1.55;
        }
        .ct-field input:focus,
        .ct-field select:focus,
        .ct-field textarea:focus {
          border-color: #0a8fb0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.12);
        }
        .ct-field select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237C8B9A' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 13px center;
          padding-right: 40px;
        }
        .ct-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ct-send {
          width: 100%;
          margin-top: 8px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 15px;
          font-weight: 650;
          color: #12314d;
          background: #c6ff5b;
          border: none;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: filter 0.15s, transform 0.05s;
        }
        .ct-send:hover {
          filter: brightness(0.96);
        }
        .ct-send:active {
          transform: translateY(1px);
        }
        .ct-send svg {
          width: 17px;
          height: 17px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
        }
        .ct-hint {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.45);
          margin: 12px 2px 0;
          text-align: center;
          line-height: 1.5;
        }

        .lg-callout {
          max-width: 1180px;
          margin: 0 auto 96px;
          background: #0e2740;
          border-radius: 18px;
          padding: 32px 36px;
          color: #fff;
          display: flex;
          flex-wrap: wrap;
          gap: 22px 40px;
          align-items: center;
          justify-content: space-between;
        }
        .lg-callout h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .lg-callout p {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
          max-width: 430px;
        }
        .lg-callout .lg-co-btn {
          flex: none;
          font-size: 14px;
          font-weight: 650;
          color: #12314d;
          background: #fff;
          border-radius: 11px;
          padding: 13px 22px;
          text-decoration: none;
          white-space: nowrap;
        }

        @media (max-width: 880px) {
          .lg-hero-in {
            padding: 48px 26px 40px;
          }
          .ct-body {
            padding: 40px 26px 70px;
          }
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 42px;
          }
          .lg-callout {
            margin: 0 26px 70px;
          }
        }
        @media (max-width: 480px) {
          .ct-row2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
