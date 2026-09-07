const VIDEO_ID = /^[A-Za-z0-9_-]{6,32}$/

function cleanHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, '')
}

/** Convert supported public video links to a provider-owned, non-autoplay embed URL. */
export function getInfluencerVideoEmbedURL(value: string | null | undefined): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null

    const host = cleanHost(url.hostname)
    let youtubeID = ''
    if (host === 'youtu.be') youtubeID = url.pathname.split('/').filter(Boolean)[0] ?? ''
    if (host === 'youtube.com') {
      youtubeID =
        (url.pathname === '/watch' ? url.searchParams.get('v') : null) ??
        /^\/(?:embed|shorts)\/([^/]+)$/.exec(url.pathname)?.[1] ??
        ''
    }
    if (host === 'youtube-nocookie.com') {
      youtubeID = /^\/embed\/([^/]+)$/.exec(url.pathname)?.[1] ?? ''
    }
    if (VIDEO_ID.test(youtubeID)) {
      return `https://www.youtube-nocookie.com/embed/${youtubeID}`
    }

    const vimeoID =
      host === 'vimeo.com'
        ? /^\/(\d+)$/.exec(url.pathname)?.[1]
        : host === 'player.vimeo.com'
          ? /^\/video\/(\d+)$/.exec(url.pathname)?.[1]
          : null
    return vimeoID ? `https://player.vimeo.com/video/${vimeoID}` : null
  } catch {
    return null
  }
}
