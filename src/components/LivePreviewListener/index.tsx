'use client'
import { getClientSideURL } from '@/utilities/getURL'
import { isLivePreviewEvent, ready } from '@payloadcms/live-preview'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef } from 'react'

type DocumentUpdate = {
  entitySlug?: unknown
  id?: unknown
  operation?: unknown
  updatedAt?: unknown
}

function getDocumentUpdateKey(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null

  const update = (data as { externallyUpdatedRelationship?: unknown }).externallyUpdatedRelationship
  if (!update || typeof update !== 'object') return null

  const { entitySlug, id, operation, updatedAt } = update as DocumentUpdate
  if (
    typeof entitySlug !== 'string' ||
    (id !== undefined && typeof id !== 'number' && typeof id !== 'string') ||
    (operation !== 'create' && operation !== 'update') ||
    typeof updatedAt !== 'string'
  ) {
    return null
  }

  return JSON.stringify([entitySlug, id ?? null, operation, updatedAt])
}

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  const serverURL = getClientSideURL()
  const hasBaseline = useRef(false)
  const hasSentReady = useRef(false)
  const lastUpdateKey = useRef<string | null>(null)

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (!isLivePreviewEvent(event, serverURL)) return

      const updateKey = getDocumentUpdateKey(event.data)
      // Payload sends the current update identity during the initial handshake.
      // Treat it as a baseline so opening Preview does not re-render the draft twice.
      if (!hasBaseline.current) {
        hasBaseline.current = true
        lastUpdateKey.current = updateKey
        // A keyed first message can be a save that completed while the iframe
        // was loading. Refresh once so that update is not mistaken for startup.
        if (updateKey) router.refresh()
        return
      }

      if (!updateKey || updateKey === lastUpdateKey.current) return

      lastUpdateKey.current = updateKey
      router.refresh()
    },
    [router, serverURL],
  )

  useEffect(() => {
    window.addEventListener('message', onMessage)

    if (!hasSentReady.current) {
      hasSentReady.current = true
      ready({ serverURL })
    }

    return () => window.removeEventListener('message', onMessage)
  }, [onMessage, serverURL])

  return null
}
