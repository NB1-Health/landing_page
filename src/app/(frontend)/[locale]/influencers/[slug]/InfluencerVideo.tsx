'use client'

import { useState } from 'react'

import type { AppLocale } from '@/i18n/config'

const PLAY_LABELS: Record<AppLocale, string> = {
  en: 'Play video',
  de: 'Video abspielen',
  fr: 'Lire la vidéo',
  nl: 'Video afspelen',
  it: 'Riproduci video',
  ch: 'Video abspielen',
  be: 'Video afspelen',
  uk: 'Play video',
  uae: 'Play video',
}

export function InfluencerVideo({
  embedURL,
  locale,
  title,
}: {
  embedURL: string
  locale: AppLocale
  title: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="aspect-video overflow-hidden rounded-3xl bg-[#0e2740] shadow-xl">
      {loaded ? (
        <iframe
          allow="encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          src={embedURL}
          title={title}
        />
      ) : (
        <button
          className="flex h-full w-full items-center justify-center text-lg font-semibold text-white transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
          onClick={() => setLoaded(true)}
          type="button"
        >
          <span className="mr-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#a3e635] text-2xl text-[#0e2740]">
            ▶
          </span>
          {PLAY_LABELS[locale]}
        </button>
      )}
    </div>
  )
}
