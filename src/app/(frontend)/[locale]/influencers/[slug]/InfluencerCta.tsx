'use client'

import { storeInfluencerOffer } from '@/lib/influencerOffer'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  code: string
  errorLabel: string
  href: string
  label: string
  sourceSlug: string
}

export function InfluencerCta({ code, errorLabel, href, label, sourceSlug }: Props) {
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
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#a3e635] px-7 py-3 text-center text-base font-semibold text-[#0e2740] transition hover:bg-[#b8ef5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        onClick={followOffer}
        type="button"
      >
        {label}
      </button>
      {error ? (
        <p className="mx-auto mt-3 max-w-md text-sm text-white/80" role="alert">
          {errorLabel}
        </p>
      ) : null}
    </>
  )
}
