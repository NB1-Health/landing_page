import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { InfluencerVideo } from '@/app/(frontend)/[locale]/influencers/[slug]/InfluencerVideo'
import { getInfluencerVideoEmbedURL } from '@/lib/influencerVideo'

describe('influencer video', () => {
  it('canonicalizes supported providers and rejects lookalike origins', () => {
    expect(getInfluencerVideoEmbedURL('https://youtu.be/abcdefgh?t=12')).toBe(
      'https://www.youtube-nocookie.com/embed/abcdefgh',
    )
    expect(getInfluencerVideoEmbedURL('https://www.youtube.com/watch?v=abcdefgh')).toBe(
      'https://www.youtube-nocookie.com/embed/abcdefgh',
    )
    expect(getInfluencerVideoEmbedURL('https://vimeo.com/12345678')).toBe(
      'https://player.vimeo.com/video/12345678',
    )
    expect(getInfluencerVideoEmbedURL('https://youtube.com.evil.test/watch?v=abcdefgh')).toBeNull()
    expect(getInfluencerVideoEmbedURL('http://youtu.be/abcdefgh')).toBeNull()
  })

  it('does not contact the provider until the visitor clicks play', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() =>
      root.render(
        <InfluencerVideo
          embedURL="https://www.youtube-nocookie.com/embed/abcdefgh"
          locale="de"
          title="Creator video"
        />,
      ),
    )

    expect(container.querySelector('iframe')).toBeNull()
    const play = container.querySelector<HTMLButtonElement>('button')
    expect(play?.textContent).toContain('Video abspielen')

    act(() => play?.click())
    const frame = container.querySelector<HTMLIFrameElement>('iframe')
    expect(frame?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefgh')
    expect(frame?.getAttribute('sandbox')).toContain('allow-scripts')

    act(() => root.unmount())
    container.remove()
  })
})
