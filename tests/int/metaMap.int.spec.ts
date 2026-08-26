import { describe, expect, it } from 'vitest'

import { mapToMetaEvent } from '@/lib/meta/map'

const emailHash = '542d240129883c019e106e3b1b2d3f3cb3537c43c425364de8e951d5a3083345'

describe('Meta event matching identity', () => {
  it('uses the normalized email hash as external ID', () => {
    expect(
      mapToMetaEvent({
        event: 'add_shipping_info',
        event_id: 'shipping-1',
        user: { email: ' Person@Example.com ' },
        context: {},
        consent: true,
      }),
    ).toMatchObject({
      user_data: {
        em: emailHash,
        external_id: emailHash,
      },
    })
  })

  it('ignores an explicit backend ID and keeps the email-derived external ID', () => {
    expect(
      mapToMetaEvent({
        event: 'purchase',
        event_id: 'purchase-1',
        user: { email: 'person@example.com', external_id: 'backend-external-id' },
        context: {},
        consent: true,
      }),
    ).toHaveProperty('user_data.external_id', emailHash)
  })
})
