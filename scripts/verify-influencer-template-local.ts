/** Local-only CMS persistence/access test; retains the seeded fixture for visual QA. */
import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getInfluencerTemplate } from '../src/utilities/getInfluencerTemplate'

const url = new URL(process.env.DATABASE_URL ?? '')
assert.equal(url.hostname, 'localhost', 'Only localhost is allowed')
assert.match(
  url.pathname,
  /influencer_design_test$/,
  'Only the dedicated design test DB is allowed',
)
const payload = await getPayload({ config })
const publicRead = { draft: false, user: null }
const context = { disableRevalidate: true }
try {
  const { docs: templates } = await payload.find({
    collection: 'influencer-templates',
    where: { key: { equals: 'default' } },
    draft: true,
  })
  const { docs: pages } = await payload.find({
    collection: 'influencer-landing-pages',
    where: { slug: { equals: 'qa-influencer-design' } },
    draft: true,
    locale: 'en',
  })
  const template = templates[0],
    page = pages[0]
  assert.ok(template && page, 'Seed the reference first')
  const originalHeading = 'Three steps to'
  await payload.update({
    collection: 'influencer-templates',
    id: template.id,
    locale: 'en',
    data: { timelineHeading: originalHeading },
    context,
  })
  const editor = await payload.create({
    collection: 'users',
    data: {
      email: `design-qa-${Date.now()}@example.com`,
      password: crypto.randomUUID(),
      role: 'editor',
    },
  })
  try {
    await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      data: { _status: 'draft' },
      context,
    })
    assert.equal(
      await getInfluencerTemplate(payload, page, publicRead, 'en'),
      null,
      'Draft template leaked to public',
    )
    assert.equal(
      (await getInfluencerTemplate(payload, page, { draft: true, user: editor }, 'en'))?.id,
      template.id,
    )
    await assert.rejects(
      payload.update({
        collection: 'influencer-templates',
        id: template.id,
        data: { title: 'Unauthorized' },
        overrideAccess: false,
        context,
      }),
    )
    await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      data: { _status: 'published' },
      user: editor,
      overrideAccess: false,
      context,
    })
    assert.equal(
      (await getInfluencerTemplate(payload, page, publicRead, 'en'))?.timelineHeading,
      originalHeading,
    )
    await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      draft: true,
      data: { timelineHeading: 'Unpublished change' },
      user: editor,
      overrideAccess: false,
      context,
    })
    assert.equal(
      (await getInfluencerTemplate(payload, page, publicRead, 'en'))?.timelineHeading,
      originalHeading,
      'Unpublished edit leaked',
    )
    const published = await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      depth: 0,
      data: { timelineHeading: 'Shared published change', _status: 'published' },
      context,
    })
    for (const linked of [page, { ...page, template: null }]) {
      assert.equal(
        (await getInfluencerTemplate(payload, linked, publicRead, 'en'))?.timelineHeading,
        published.timelineHeading,
        'Linked or default template stale',
      )
    }
    await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      locale: 'de',
      data: { ...published, timelineHeading: 'Drei Schritte zu' },
      context,
    })
    assert.equal(
      (await getInfluencerTemplate(payload, page, publicRead, 'de'))?.timelineHeading,
      'Drei Schritte zu',
    )
    await payload.update({
      collection: 'influencer-templates',
      id: template.id,
      locale: 'en',
      data: { timelineHeading: originalHeading, _status: 'published' },
      context,
    })
    await payload.update({
      collection: 'influencer-landing-pages',
      id: page.id,
      locale: 'en',
      publishSpecificLocale: 'en',
      data: { _status: 'published' },
      context,
    })
    console.log(
      'PASS: draft isolation, editor preview, anonymous write denial, publishing, shared/default propagation, localization. Local preview: /en/influencers/qa-influencer-design',
    )
  } finally {
    await payload.delete({ collection: 'users', id: editor.id })
  }
} finally {
  await payload.destroy()
}
