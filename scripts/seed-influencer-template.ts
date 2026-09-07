/** Import the supplied standalone design into CMS DRAFTS. Never overwrites existing records.
 * INFLUENCER_REFERENCE_HTML=/absolute/path/to/reference.html npm run payload -- run scripts/seed-influencer-template.ts
 * Uses DATABASE_URL. Run only against the intended CMS. Publishing is a separate editorial action.
 */
import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { parse, type HTMLElement } from 'node-html-parser'
import { getPayload } from 'payload'
import type { RequiredDataFromCollectionSlug } from 'payload'
import config from '@payload-config'
import { referenceComparison } from './influencer-reference-comparison'

const referencePath = process.env.INFLUENCER_REFERENCE_HTML
if (!referencePath)
  throw new Error('INFLUENCER_REFERENCE_HTML must name the supplied standalone HTML.')
const file = await readFile(referencePath, 'utf8')
const bundle = (name: string) => {
  const match = file.match(new RegExp(`<script type="__bundler/${name}">([\\s\\S]*?)</script>`))
  if (!match) throw new Error(`Missing reference ${name}`)
  return JSON.parse(match[1])
}
const html = parse(bundle('template'))
const manifest = bundle('manifest') as Record<
  string,
  { mime: string; data: string; compressed?: boolean }
>
const payload = await getPayload({ config })
const context = { disableRevalidate: true }
const plain = (node: HTMLElement | null, selector?: string) =>
  (selector ? node?.querySelector(selector) : node)?.textContent.replace(/\s+/g, ' ').trim() ?? ''
const rich = (value: string, heading = false, accent = '') => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: heading ? 'heading' : 'paragraph',
        tag: heading ? 'h2' : undefined,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        children: (accent ? [value.replace(accent, ''), accent] : [value]).map((text, i) => ({
          type: 'text',
          version: 1,
          text,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: i === 1 ? 'color: #0A8FB0' : '',
        })),
      },
    ],
  },
})

async function media(node: HTMLElement | null, name: string, alt: string) {
  const uuid = node?.getAttribute('src')
  if (!uuid || !manifest[uuid]) throw new Error(`Missing reference asset: ${name}`)
  const asset = manifest[uuid]
  const ext = (
    {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    } as Record<string, string>
  )[asset.mime]
  if (!ext) throw new Error(`Unsupported reference image type: ${asset.mime}`)
  const filename = `influencer-reference-${name}.${ext}`
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id
  const encoded = Buffer.from(asset.data, 'base64')
  const data = asset.compressed ? gunzipSync(encoded) : encoded
  const result = await payload.create({
    collection: 'media',
    context,
    locale: 'en',
    data: { alt, agentTrashEligible: false },
    file: { data, name: filename, mimetype: asset.mime, size: data.length },
  })
  return result.id
}

try {
  const existing = await payload.find({
    collection: 'influencer-templates',
    where: { key: { equals: 'default' } },
    limit: 1,
    draft: true,
  })
  if (existing.docs.length) {
    console.log('Default template already exists; nothing overwritten.')
  } else {
    const scientists = await Promise.all(
      html.querySelectorAll('.gt-faces img').map(async (node, i) => ({
        name: node.getAttribute('alt') ?? `Science team ${i + 1}`,
        portrait: await media(
          node,
          `scientist-${i + 1}`,
          node.getAttribute('alt') ?? 'NB1 science team',
        ),
      })),
    )
    const cards = await Promise.all(
      html.querySelectorAll('.rto-card').map(async (card, i) => ({
        category: plain(card, '.rto-cat'),
        image: await media(
          card.querySelector('.cphoto'),
          `outcome-${i + 1}`,
          plain(card, '.rto-cat'),
        ),
        frontTitle: plain(card, '.rto-t'),
        deltaChip: plain(card, '.rto-chip2'),
        valueBefore: plain(card, '.rto-nums .b'),
        valueAfter: plain(card, '.rto-nums .n'),
        valueUnit: plain(card, '.rto-nums .u'),
        trackFootnote: plain(card, '.rto-gfoot'),
        backEyebrow: plain(card, '.rto-back-eyebrow'),
        backBody: plain(card, '.rto-back-body'),
        flipAriaLabel: card.querySelector('.rto-flip')?.getAttribute('aria-label'),
        trackSegLeft: card
          .querySelector('.rto-trk .seg')
          ?.getAttribute('style')
          ?.match(/left:\s*([^;]+)/)?.[1],
        trackSegRight: card
          .querySelector('.rto-trk .seg')
          ?.getAttribute('style')
          ?.match(/right:\s*([^;]+)/)?.[1],
        trackDotBefore: card
          .querySelector('.rto-trk .dot.b')
          ?.getAttribute('style')
          ?.match(/left:\s*([^;]+)/)?.[1],
        trackDotAfter: card
          .querySelector('.rto-trk .dot.n')
          ?.getAttribute('style')
          ?.match(/left:\s*([^;]+)/)?.[1],
      })),
    )
    const planCards = html.querySelectorAll('.il-plans .plan-card').map((card, i) => ({
      name: plain(card, '.pc-name'),
      tag: plain(card, '.pc-tag'),
      featured: i === 1,
      badge: plain(card, '.plan-badge'),
      planFamily: i === 0 ? ('core' as const) : ('advanced' as const),
      // Preserve live catalogue pricing, not prototype euro amounts.
      monthly: i === 0 ? 'or {{price:core:1}}/mo month-to-month · cancel anytime' : '',
      commit: '4-month plan. See checkout for available durations and offer eligibility.',
      listLabel: plain(card, '.pc-lbl'),
      listItems: card
        .querySelectorAll('.pc-list li')
        .map((item) => ({ text: plain(item).replace(/^✓\s*/, '') })),
      ctaLabel: plain(card, 'a'),
      ctaStyle: i === 0 ? ('out' as const) : ('cta' as const),
    }))
    const data: RequiredDataFromCollectionSlug<'influencer-templates'> = {
      title: 'Influencer — reference design',
      key: 'default',
      _status: 'draft',
      logo: await media(html.querySelector('.il-nav .logo img'), 'logo', 'NB1'),
      timelineHeading: 'Three steps to',
      timelineAccent: 'your formula.',
      timeline: [
        { when: 'Today', title: 'Order your kit', description: 'No charge today' },
        {
          when: 'Week 1',
          title: 'Send your sample',
          description: 'We read your gut at species level',
        },
        {
          when: 'By week 4',
          title: 'Formula ships',
          description: 'Your creator offer applies',
          gift: true,
        },
        {
          when: 'Next month',
          title: 'Your next formula',
          description: 'Continue your personalised plan',
        },
      ],
      scienceHeading: plain(html, '.gt-sci-t'),
      scienceCopy: plain(html, '.gt-sci-s'),
      scientists,
      sections: [
        {
          blockType: 'outcomes',
          heading: rich(plain(html, '.rto-h'), true, plain(html, '.rto-h .accent')),
          subheading: plain(html, '.rto-sub'),
          gaugeScore: '80.2',
          gaugeMax: '100',
          gaugeLabel: plain(html, '.rto-glabel'),
          deltaLabel: plain(html, '.rto-chip'),
          deltaFrom: plain(html, '.rto-from'),
          feltText: rich(plain(html, '.rto-felt')),
          cards,
          footnote: plain(html, '.rto-note'),
        },
        {
          blockType: 'ypPlans',
          backgroundColor: 'cream',
          grain: false,
          eyebrow: 'Your plan',
          heading: rich('Two plans. One difference.', true, 'One difference.'),
          lede: rich('Both built the same way. Advanced just goes deeper, every cycle.'),
          planCards,
          showComparison: true,
          comparison: referenceComparison,
        },
      ],
      offerBackground: await media(
        html.querySelector('.il-offer-bg'),
        'offer',
        'NB1 personalised supplements',
      ),
      offerBadge: 'Gift from {name}',
      // Kit fees and discount terms must be reviewed, not copied from stale prototype prices.
      offerFinePrint: 'See checkout for your offer, eligibility and kit terms before confirming.',
      footerCopy: plain(html, '.il-footer p'),
      footerLinks: [],
    }
    for (const [label, slug] of [
      ['Privacy', 'privacy-policy'],
      ['Terms', 'terms-and-conditions'],
      ['Imprint', 'imprint'],
      ['Contact', 'contact'],
    ]) {
      const result = await payload.find({
        collection: 'pages',
        locale: 'en',
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        limit: 1,
      })
      if (result.docs[0]) data.footerLinks!.push({ label, page: result.docs[0].id })
    }
    const template = await payload.create({
      collection: 'influencer-templates',
      locale: 'en',
      draft: true,
      context,
      data,
    })
    const hero = await media(
      html.querySelector('#influencer-hero'),
      'hero',
      'Influencer design reference portrait',
    )
    const fixture = await payload.create({
      collection: 'influencer-landing-pages',
      draft: true,
      locale: 'en',
      context,
      data: {
        internalTitle: 'QA — influencer reference design',
        slug: 'qa-influencer-design',
        template: template.id,
        influencerName: 'Alex',
        handle: '@template-preview',
        heroHeadline: '{name} thinks your biology deserves better.',
        heroCopy:
          'A personalised supplement built from your own biology. Explore your creator offer below.',
        giftQuote: 'A gift from {name}: your creator offer',
        discountCode: 'TEST2',
        primaryImage: hero,
        testimonial:
          'This is a design preview with sample content, not a real customer endorsement.',
        testimonialAttribution: 'Template preview',
        offerHeadline: 'Your next step starts with {name}.',
        offerCopy:
          'Choose your plan. Your creator offer is applied automatically at checkout, where you can review your total before confirming.',
        ctaLabel: 'Claim your offer →',
        _status: 'draft',
      },
    })
    console.log(
      `Created template ${template.id} and influencer ${fixture.id} as DRAFTS. Review claims, terms, footer links, media rights and translations before publishing.`,
    )
  }
} finally {
  await payload.destroy()
}
