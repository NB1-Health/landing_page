'use client'

import React from 'react'

/**
 * Read-only admin cheat-sheet (rendered via a `ui` field) listing the
 * available live-price tokens. Mirrors the reference in
 * src/lib/plans/priceTokens.ts so editors can see them without leaving Payload.
 */
const TOKENS: Array<[string, string]> = [
  ['{{price:core:1}}', 'Core — monthly / flexible (1-month)'],
  ['{{price:core:4}}', 'Core — 4-month cycle'],
  ['{{price:core:12}}', 'Core — 12-month cycle'],
  ['{{price:advanced:1}}', 'Advanced — monthly / flexible (1-month)'],
  ['{{price:advanced:4}}', 'Advanced — 4-month cycle'],
  ['{{price:advanced:12}}', 'Advanced — 12-month cycle'],
]

const MATH_EXAMPLES: Array<[string, string]> = [
  ['{{(price:core:4-price:core:12)*12}}', 'Yearly saving: (4-month rate − 12-month rate) × 12'],
  ['{{price:core:4/2}}', 'Half of the 4-month rate'],
  ['{{floor(price:core:4/2)}}', 'Same, rounded down (49.5 → 49)'],
  ['{{ceil(price:core:4/2)}}', 'Same, rounded up (49.5 → 50)'],
]

const codeStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'var(--font-mono, monospace)',
  color: 'var(--theme-success-600, #0a8fb0)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginTop: 3,
  lineHeight: 1.45,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  opacity: 0.6,
  margin: '16px 0 8px',
}

function Entry({ token, label }: { token: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
      <code style={codeStyle}>{token}</code>
      <span style={labelStyle}>{label}</span>
    </div>
  )
}

export const PriceTokenHelp: React.FC = () => {
  return (
    <div
      className="field-type"
      style={{
        marginBottom: 0,
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
        padding: '16px 18px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Live-price tokens</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, lineHeight: 1.5 }}>
        Type a token anywhere in a text or rich-text field; it’s replaced at
        render time with the live rate in the visitor’s currency. Example:{' '}
        <code style={codeStyle}>or {'{{price:core:1}}'}/mo · cancel anytime</code>
      </div>

      <div style={sectionTitleStyle}>Available tokens</div>
      {TOKENS.map(([token, label]) => (
        <Entry key={token} token={token} label={label} />
      ))}

      <div style={sectionTitleStyle}>Math &amp; rounding</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, lineHeight: 1.5 }}>
        A token can also be a formula using the operators{' '}
        <code style={codeStyle}>+ - * /</code>, parentheses, and the rounding
        functions <code style={codeStyle}>floor()</code>,{' '}
        <code style={codeStyle}>ceil()</code>, <code style={codeStyle}>round()</code>.
        The result is shown as a price (rounded half-up unless you wrap it).
      </div>
      {MATH_EXAMPLES.map(([token, label]) => (
        <Entry key={token} token={token} label={label} />
      ))}

      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6, lineHeight: 1.5 }}>
        family = core | advanced (case-insensitive). Any month the plans API
        returns also works. An unknown token or invalid formula renders as empty
        text.
      </div>
    </div>
  )
}
