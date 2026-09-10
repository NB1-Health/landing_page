'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import MentionMeTag from './MentionMeTag'

/**
 * Translated trigger for the Mention Me referee flow ("Been referred by a friend?").
 *
 * Mention Me builds its own anchor and fills it from the campaign payload
 * (`getRefereeText()`), so the copy is server-side per campaign and cannot be
 * localised from this repo. To show our own translated copy we keep MM's anchor in
 * the DOM but hidden, render our own button, and forward the click to it.
 *
 * That works because MM binds its handler with `addEventListener` *before* inserting
 * the anchor, so a synthetic `.click()` runs the real handler (which calls
 * preventDefault and opens the flow). It also means the anchor being present in the
 * DOM is a sound readiness signal: no anchor, no handler, so we render nothing until
 * it appears rather than showing a dead link.
 *
 * Only the anchor is hidden, never the wrapper — MM mounts the overlay separately and
 * hiding an ancestor could take the overlay with it.
 */
type Props = {
  /** Already-translated label, e.g. `t.referral.beenReferred`. */
  label: string
  situation?: string
  /** Mention Me campaign locale (`lang_REGION`), not the site locale. */
  locale?: string
}

export default function MentionMeRefereeLink({
  label,
  situation = 'checkout',
  locale = 'en_GB',
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  // Host first: MM normally falls back to appending into #mmWrapper, which we own.
  // A campaign configured with an injection selector can place the anchor elsewhere,
  // hence the document-wide fallback.
  const findLink = useCallback(
    () =>
      hostRef.current?.querySelector<HTMLAnchorElement>('a.mmLink') ??
      document.querySelector<HTMLAnchorElement>('a.mmLink'),
    [],
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    if (findLink()) {
      setReady(true)
      return undefined
    }
    // MM loads its chunks async and wraps the anchor in a div, so watch the subtree.
    const observer = new MutationObserver(() => {
      if (findLink()) setReady(true)
    })
    observer.observe(host, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [findLink])

  return (
    <div className="nb1-mm-referee" ref={hostRef}>
      <style jsx>{`
        /* MM injects the anchor at runtime, so it needs :global. Hidden rather than
           removed: it carries the click handler we forward to. display:none is safe
           here — MM's post-insert viewport check treats a zero-size rect as visible,
           so it does not trigger MM's scroll-into-view path. */
        .nb1-mm-referee :global(a.mmLink) {
          display: none !important;
        }
        .nb1-mm-referee-trigger {
          display: inline-block;
          padding: 12px 0 0;
          border: 0;
          background: none;
          font: inherit;
          font-weight: 600;
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(10, 143, 176, 0.3);
          cursor: pointer;
        }
        .nb1-mm-referee-trigger:hover {
          color: #087491;
        }
      `}</style>

      <MentionMeTag variant="referee" situation={situation} locale={locale} />

      {ready && (
        <button
          type="button"
          className="nb1-mm-referee-trigger"
          onClick={() => findLink()?.click()}
        >
          {label}
        </button>
      )}
    </div>
  )
}
