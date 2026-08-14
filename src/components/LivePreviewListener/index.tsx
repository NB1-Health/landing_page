'use client'
import { getClientSideURL } from '@/utilities/getURL'
import { isDocumentEvent, isLivePreviewEvent, ready } from '@payloadcms/live-preview'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef } from 'react'

type LivePreviewListenerProps = {
  collection: 'pages' | 'posts'
  documentId: number | string
  locale: string
  updatedAt: string
}

export const LivePreviewListener: React.FC<LivePreviewListenerProps> = ({
  collection,
  documentId,
  locale,
  updatedAt,
}) => {
  const router = useRouter()
  const serverURL = getClientSideURL()
  const hasBaseline = useRef(false)
  const handshakeComplete = useRef(false)
  const handshakeTimer = useRef<number | null>(null)
  const lastUpdatedAt = useRef(updatedAt)
  const updateCheckInFlight = useRef(false)

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (isLivePreviewEvent(event, serverURL)) {
        hasBaseline.current = true
        if (handshakeTimer.current === null) {
          handshakeTimer.current = window.setTimeout(() => {
            handshakeComplete.current = true
          }, 0)
        }
        return
      }

      if (isDocumentEvent(event, serverURL) && handshakeComplete.current) router.refresh()
    },
    [router, serverURL],
  )

  useEffect(() => {
    window.addEventListener('message', onMessage)
    ready({ serverURL })

    const readyRetry = window.setInterval(() => {
      if (hasBaseline.current) {
        window.clearInterval(readyRetry)
        return
      }

      ready({ serverURL })
    }, 500)

    return () => {
      window.clearInterval(readyRetry)
      if (handshakeTimer.current !== null) window.clearTimeout(handshakeTimer.current)
      window.removeEventListener('message', onMessage)
    }
  }, [onMessage, serverURL])

  useEffect(() => {
    lastUpdatedAt.current = updatedAt
  }, [updatedAt])

  useEffect(() => {
    const checkForSavedDraft = async () => {
      if (updateCheckInFlight.current) return

      updateCheckInFlight.current = true
      try {
        const params = new URLSearchParams({
          depth: '0',
          draft: 'true',
          locale,
          'select[updatedAt]': 'true',
        })
        const response = await fetch(
          `/cms/api/${collection}/${encodeURIComponent(documentId)}?${params}`,
          { cache: 'no-store', credentials: 'include' },
        )

        if (!response.ok) return

        const result = (await response.json()) as { updatedAt?: unknown }
        if (typeof result.updatedAt !== 'string' || result.updatedAt === lastUpdatedAt.current) {
          return
        }

        lastUpdatedAt.current = result.updatedAt
        router.refresh()
      } catch {
        // Preview polling is a fallback for missed CMS events; a transient failure
        // should not interrupt editing or replace the currently rendered draft.
      } finally {
        updateCheckInFlight.current = false
      }
    }

    const updateCheck = window.setInterval(() => void checkForSavedDraft(), 1_000)
    return () => window.clearInterval(updateCheck)
  }, [collection, documentId, locale, router])

  return null
}
