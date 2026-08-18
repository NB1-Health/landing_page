import { NextResponse } from 'next/server'
import type { MetaEventPayload } from '@/lib/meta/types'
import { buildServerEvent, sendMetaEvents } from '@/lib/meta/server'

export async function POST(req: Request) {
  try {
    const payload: MetaEventPayload = await req.json()
    // Keep the legacy sender until the durable backend route is verified and explicitly owns
    // Purchase. During rollout, both paths reuse event_id so Meta can de-duplicate the overlap.
    if (
      payload.event === 'purchase' &&
      process.env.NEXT_PUBLIC_META_PURCHASE_OWNER === 'backend'
    ) {
      return NextResponse.json({ sent: 0, owner: 'backend' })
    }
    if (!payload.consent) {
      return NextResponse.json({ sent: 0 })
    }

    const event = buildServerEvent(payload, req)
    const result = await sendMetaEvents([event])
    return NextResponse.json(result)
  } catch (err) {
    console.error('[meta/events]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
