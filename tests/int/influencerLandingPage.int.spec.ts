import { describe, expect, it } from 'vitest'
import type { Field } from 'payload'

import { InfluencerLandingPages } from '@/collections/InfluencerLandingPages'

function dataField(name: string) {
  return InfluencerLandingPages.fields.find(
    (field): field is Extract<Field, { name: string }> => 'name' in field && field.name === name,
  )
}

describe('influencer landing page collection', () => {
  it('keeps public reads published-only and writes editor-only', () => {
    const publicRead = InfluencerLandingPages.access?.read
    const create = InfluencerLandingPages.access?.create

    expect(typeof publicRead).toBe('function')
    expect(
      typeof publicRead === 'function'
        ? publicRead({ req: { user: null } } as Parameters<typeof publicRead>[0])
        : null,
    ).toEqual({ _status: { equals: 'published' } })
    expect(
      typeof create === 'function'
        ? create({ req: { user: null } } as Parameters<typeof create>[0])
        : true,
    ).toBe(false)
    expect(
      typeof create === 'function'
        ? create({ req: { user: { role: 'editor' } } } as Parameters<typeof create>[0])
        : false,
    ).toBe(true)
  })

  it('stores only a canonical code string and restricts video providers', async () => {
    const discount = dataField('discountCode')
    const video = dataField('videoUrl')
    expect(discount?.type).toBe('text')
    expect(discount && 'relationship' in discount).toBe(false)

    if (!video || !('validate' in video) || typeof video.validate !== 'function') {
      throw new Error('videoUrl validator missing')
    }
    const validate = video.validate as (value: string, options: never) => unknown

    expect(await validate('javascript:alert(1)', {} as never)).toBe(
      'Use a valid HTTPS YouTube or Vimeo URL.',
    )
    expect(await validate('https://youtube.com.evil.test/watch?v=abcdefgh', {} as never)).toBe(
      'Use a valid HTTPS YouTube or Vimeo URL.',
    )
    expect(await validate('https://youtu.be/abcdefgh', {} as never)).toBe(true)
  })
})
