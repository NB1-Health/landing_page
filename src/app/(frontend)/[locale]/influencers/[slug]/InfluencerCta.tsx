'use client'

import { storeInfluencerOffer } from '@/lib/influencerOffer'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  className?: string
  code: string
  errorLabel: string
  href: string
  label: string
  sourceSlug: string
}

export function InfluencerCta({
  className = '',
  code,
  errorLabel,
  href,
  label,
  sourceSlug,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState(false)

  function followOffer() {
    if (!storeInfluencerOffer({ code, sourceSlug })) {
      setError(true)
      return
    }
    router.push(href)
  }

  return (
    <>
      <button
        className={`influencer-cta inline-flex min-h-12 items-center justify-center rounded-full bg-[#c6ff5b] px-7 py-3 text-center text-base font-semibold text-[#0e2740] transition hover:bg-[#aaea42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a8fb0] ${className}`}
        onClick={followOffer}
        type="button"
      >
        {label}
      </button>
      {error ? (
        <p className="mx-auto mt-3 max-w-md text-sm" role="alert">
          {errorLabel}
        </p>
      ) : null}
    </>
  )
}
