'use client'

import { useEffect, useRef } from 'react'

/**
 * Mention Me referral tag loader.
 *
 *   - variant="referee"  -> refereefind   (checkout: a referred friend finds/claims their reward code)
 *   - variant="referrer" -> referreroffer (post-purchase: the buyer shares + becomes a referrer)
 *
 * Partner code + host come from env (NEXT_PUBLIC_*) so demo vs live is a config switch. Mention Me
 * requires NO server-side signature; the partner code in the URL is the identifier. Renders nothing
 * when the partner code is not configured.
 */
const HOST = process.env.NEXT_PUBLIC_MENTION_ME_TAG_HOST || 'tag-demo.mention-me.com'
const PARTNER = process.env.NEXT_PUBLIC_MENTION_ME_PARTNER_CODE || ''

const SEGMENT: Record<string, string> = { referee: 'refereefind', referrer: 'referreroffer' }

type Props = {
  variant: 'referee' | 'referrer'
  situation: string
  locale?: string
  params?: Record<string, string | number | null | undefined>
}

export default function MentionMeTag({ variant, situation, locale = 'en_GB', params = {} }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const seg = SEGMENT[variant]
    if (!PARTNER || !seg) return undefined

    const wrapper = wrapRef.current // capture for cleanup (ref may change by unmount)
    const qs = new URLSearchParams({ situation, locale })
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}` !== '') qs.set(k, `${v}`)
    })

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://${HOST}/api/v2/${seg}/${PARTNER}?${qs.toString()}`
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch {
        /* already gone */
      }
      if (wrapper) wrapper.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, situation, locale, JSON.stringify(params)])

  if (!PARTNER || !SEGMENT[variant]) return null
  return <div id="mmWrapper" ref={wrapRef} />
}
