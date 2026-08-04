import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  buildTranslationReviewPack,
  checkTranslationReview,
} from '../../scripts/lib/payload-translation-review'

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true },
  { name: 'internalName', type: 'text' },
  {
    name: 'meta',
    type: 'group',
    fields: [{ name: 'description', type: 'textarea', localized: true }],
  },
  {
    name: 'layout',
    type: 'blocks',
    blocks: [
      {
        slug: 'hero',
        labels: { singular: 'Hero', plural: 'Heroes' },
        fields: [
          { name: 'heading', type: 'text', localized: true },
          { name: 'body', type: 'richText', localized: true },
          {
            name: 'points',
            type: 'array',
            fields: [{ name: 'label', type: 'text', localized: true }],
          },
        ],
      },
    ],
  },
]

const lexical = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text }],
      },
    ],
  },
})

const source = {
  title: 'About NB1',
  internalName: 'about-page',
  meta: { description: 'Built around your biology.' },
  layout: [
    {
      id: 'block-1',
      blockType: 'hero',
      heading: 'Start with your biology',
      body: lexical('Your formula starts with your sample.'),
      points: [{ id: 'point-1', label: 'Measured for you' }],
    },
  ],
}

const target = {
  title: 'Über NB1',
  internalName: 'about-page',
  meta: { description: '' },
  layout: [
    {
      id: 'block-1',
      blockType: 'hero',
      heading: 'Beginne mit deiner Biologie',
      body: lexical('Deine Formel beginnt mit deiner Probe.'),
      points: [{ id: 'point-1', label: 'Für dich gemessen' }],
    },
  ],
}

function buildPack() {
  return buildTranslationReviewPack({
    fields,
    pageId: '42',
    source,
    sourceVersion: '2026-08-04T12:00:00.000Z',
    target,
    targetLocale: 'de',
  })
}

describe('Payload translation review pack', () => {
  it('exports localized strings with stable row IDs and source hashes', () => {
    const pack = buildPack()

    expect(pack.items).toHaveLength(5)
    expect(pack.items.map(({ key }) => key)).toContain('pages:42/layout:block-1/field:heading')
    expect(pack.items.map(({ key }) => key)).toContain(
      'pages:42/layout:block-1/points:point-1/field:label',
    )
    expect(pack.items.find(({ context }) => context === 'Meta > Description')?.status).toBe(
      'missing',
    )
    expect(pack.items.some(({ key }) => key.includes('internalName'))).toBe(false)
    expect(pack.items.find(({ valueType }) => valueType === 'richTextText')?.source).toBe(
      'Your formula starts with your sample.',
    )
    expect(pack.page.sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('reports safe applies, stale source, target conflicts, and invalid keys without writing', () => {
    const pack = buildPack()
    const [first, second, third] = pack.items
    const review = {
      ...pack,
      changes: [
        {
          key: first.key,
          sourceHash: first.sourceHash,
          targetBefore: first.targetBefore,
          targetAfter: 'Neue Fassung',
        },
        {
          key: second.key,
          sourceHash: 'sha256:stale',
          targetBefore: second.targetBefore,
          targetAfter: 'Neue Fassung',
        },
        {
          key: third.key,
          sourceHash: third.sourceHash,
          targetBefore: 'Changed elsewhere',
          targetAfter: 'Neue Fassung',
        },
        {
          key: 'pages:42/field:missing',
          sourceHash: first.sourceHash,
          targetBefore: '',
          targetAfter: 'Neue Fassung',
        },
      ],
    }

    expect(checkTranslationReview(review, pack).summary).toEqual({
      applies: 1,
      conflicts: 1,
      invalid: 1,
      stale: 1,
      unchanged: 0,
    })
  })
})
