import { getPayload } from 'payload'
import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import config from '@payload-config'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Seeds the English "How to use your stool testing kit" help article from the
 * design mockup (NB1_How to _stool_kit 20260827.html), using the helpBlocks kit.
 *
 * Run:  npm run seed:help-stool-kit
 *
 * Idempotent: media are matched by filename and the page by slug, so re-running
 * updates in place rather than creating duplicates. The page is saved as a
 * DRAFT — review it in the CMS and publish it yourself.
 *
 * Only the `en` locale is written. Other locales inherit nothing; fill them the
 * usual way.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.resolve(dirname, 'seed-assets')

const SLUG = 'how-to-use-your-stool-kit'
const LOCALE = 'en' as const

/**
 * Rich-text links.
 *
 * A `linkType: 'custom'` URL is rendered verbatim by LinkJSXConverter — only
 * `internal` doc links get the locale prefix — so custom paths inside rich text
 * have to carry it themselves. Plain text URL fields (ctaUrl, code.linkUrl) are
 * the opposite: the block components run them through `localizedHref`, so those
 * stay unprefixed.
 */
const L = (p: string) => `/${LOCALE}${p}`

// ---------------------------------------------------------------------------
// Lexical builders — shapes match src/utilities/parseHtmlToBlocks.ts
// ---------------------------------------------------------------------------

const BOLD = 1

const text = (value: string, format = 0) => ({
  type: 'text' as const,
  version: 1,
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
})

type TextNode = ReturnType<typeof text>

const bold = (value: string) => text(value, BOLD)

const link = (url: string, children: TextNode[], newTab = false) => ({
  type: 'link' as const,
  version: 3,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  fields: { linkType: 'custom' as const, newTab, url },
  children,
})

type Inline = TextNode | ReturnType<typeof link>

const p = (...children: Inline[]) => ({
  type: 'paragraph' as const,
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  children,
})

const h4 = (value: string) => ({
  type: 'heading' as const,
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  tag: 'h4' as const,
  children: [text(value)],
})

/** A list item's children: inline nodes, or a nested list (Tab in the editor). */
type ListChild = Inline | ListNode
type ListNode = {
  type: 'list'
  version: 1
  direction: 'ltr'
  format: ''
  indent: 0
  listType: 'number' | 'bullet'
  start: 1
  tag: 'ol' | 'ul'
  children: unknown[]
}

const list = (tag: 'ol' | 'ul', items: ListChild[][]): ListNode => ({
  type: 'list',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  listType: tag === 'ol' ? 'number' : 'bullet',
  start: 1,
  tag,
  children: items.map((children, i) => ({
    type: 'listitem' as const,
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    value: i + 1,
    children,
  })),
})

const ol = (...items: ListChild[][]) => list('ol', items)

const doc = (...children: unknown[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children,
  },
})

/** One-paragraph document — the common case for callouts and FAQ answers. */
const para = (...children: Inline[]) => doc(p(...children))

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

async function upsertMedia(payload: Payload, filename: string, alt: string): Promise<number> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
    locale: LOCALE,
  })

  const found = existing.docs[0]
  if (found) {
    console.log(`  media: reusing ${filename} (id ${found.id})`)
    return found.id as number
  }

  const created = await payload.create({
    collection: 'media',
    // `agentTrashEligible` is `required: true` on Media, so it lands in the
    // generated create type even though it is system-managed (create access is
    // denied and it has a defaultValue). Assert rather than set it, so the
    // default applies — otherwise `next build` type-checks this script and
    // fails, since tsconfig includes scripts/.
    data: { alt } as RequiredDataFromCollectionSlug<'media'>,
    filePath: path.resolve(ASSETS, filename),
    locale: LOCALE,
    // revalidatePages() calls Next's revalidateTag, which throws outside a
    // request context; the hook honours this flag, so skip it rather than
    // logging a stack trace per upload.
    context: { disableRevalidate: true },
  })
  console.log(`  media: uploaded ${filename} (id ${created.id})`)
  return created.id as number
}

// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding "How to use your stool testing kit"...')

  const payload = await getPayload({ config })

  const kitPhoto = await upsertMedia(
    payload,
    'nb1-stool-kit-contents.webp',
    'Everything included in your NB1 stool kit: kit box, stool collection tube, biohazard bag, stool collection paper, and printed instructions',
  )
  const flowIcons = await upsertMedia(
    payload,
    'nb1-stool-kit-collection-steps.webp',
    'Five icons showing the collection flow: wash hands, unfold paper, collect sample, seal tube, shake gently',
  )

  const layout = [
    {
      blockType: 'helpHero',
      heading: 'How to use your stool testing kit',
      dek: 'Follow these instructions to collect and process your sample correctly. This is easy and will take you less than 5 minutes.',
    },
    {
      blockType: 'helpNav',
      label: 'On this page',
      minHeadings: 2,
    },
    {
      blockType: 'helpSteps',
      reserveTocSpace: true,
      introImage: kitPhoto,
      introImageCaption: "What's included in your stool kit",
      steps: [
        {
          title: 'Register your kit',
          body: doc(
            p(
              text('Each tube has a unique code printed on it. Visit '),
              link(L('/login'), [text('nb1.com')]),
              text(' and log in to your account, then enter the code in the field provided.'),
            ),
          ),
          code: {
            label: 'Code sample',
            value: '181723699XXXX',
            linkLabel: 'Log in to register',
            linkUrl: '/login',
          },
        },
        {
          title: 'Collect your sample',
          body: doc(
            ol(
              [
                text(
                  "Unfold the stool collection paper and place it securely on your toilet seat, making sure it doesn't touch the water.",
                ),
              ],
              [
                text(
                  "Unscrew the cap of the collection tube. You'll find a small spoon attached underneath.",
                ),
              ],
              [
                text(
                  'Use the spoon to collect a pea to hazelnut-sized amount of stool from different parts of the sample, not only the surface.',
                ),
              ],
              [
                text(
                  'Place the collected material directly into the liquid inside the tube, without overfilling it.',
                ),
              ],
              [
                text(
                  'Screw the cap back on tightly and shake the tube gently several times so the sample mixes well with the transport solution.',
                ),
              ],
              [
                text(
                  "Place the sealed tube into the biohazard bag and make sure it's securely closed.",
                ),
              ],
            ),
          ),
          media: flowIcons,
        },
        {
          title: 'Send your sample to the lab',
          // The mockup nests the "original box" note and the EU / non-EU
          // sub-sections inside list item 2. The block model keeps callouts at
          // step level and sub-headings at body level, so those are flattened
          // out here — same reading order, same wording.
          body: doc(
            ol(
              [
                bold('Place your sample in the original box'),
                text(
                  ' provided with your kit, and use tape to keep it closed during transport.',
                ),
              ],
              [bold('Stick the return label to the parcel.')],
            ),
            h4('Are you based in the EU?'),
            ol(
              [
                text('Log in to your NB1 account and click '),
                bold('"Schedule pickup."'),
              ],
              [text('Select a date and address for pickup.')],
              [text("You'll receive a label by email — print it and stick it to your box.")],
              [text('Hand your parcel to the courier when they come to pick it up.')],
            ),
            h4('Are you based outside the EU?'),
            p(
              text(
                'Your kit already contains a pre-printed return label — stick it to the box and drop it in a dedicated mailbox.',
              ),
            ),
          ),
          notes: [
            {
              variant: 'quiet',
              body: para(
                text(
                  'Note: if the original box is no longer available, a similar small box or sealed plastic postage bag works too.',
                ),
              ),
            },
            {
              variant: 'info',
              title: 'No rush on the same day',
              body: para(
                text("You don't need to ship the same day. Just send your sample "),
                bold('within 1 to 3 days of collection'),
                text(
                  ". Keep the sealed tube at room temperature (5 to 25°C) until then, or in the fridge if it'll take a little longer.",
                ),
              ),
            },
          ],
        },
      ],
      outro: {
        doneText: "…And you're done!",
        note: para(
          text('Also collecting a blood sample? See '),
          link(L('/help/how-to-use-your-blood-kit'), [
            text('How to use your blood testing kit'),
          ]),
          text('.'),
        ),
      },
    },
    {
      blockType: 'helpFaq',
      reserveTocSpace: true,
      title: 'Common questions',
      anchor: 'faq',
      items: [
        {
          question: 'What if the stool catcher tears or breaks?',
          answer: para(
            text("Don't try to collect the sample without it. "),
            link(L('/contact'), [text('Get in touch')]),
            text(' and we\'ll send you a replacement free of charge, then you can collect as normal.'),
          ),
        },
        {
          question: "Do I need to remember what I've eaten?",
          answer: para(
            text('Yes, roughly. We ask about the '),
            bold('24 hours before you collect'),
            text(
              " because recent food shapes what we see in your sample. A rough overview is fine, it doesn't need to be meal by meal, and if you really can't remember we'll still make sense of your results.",
            ),
          ),
        },
        {
          question: 'Can I drink alcohol before collecting?',
          answer: para(
            text(
              "Yes, that's fine. There's no need to change what you normally drink or eat before collecting. We'd rather read your gut as it usually is than a version of it you've prepared for.",
            ),
          ),
        },
        {
          question: 'How long can I keep the sample before sending it?',
          answer: para(
            text(
              "Send it back as soon as you can, ideally the same day you collect. The tube contains a stabilising solution once shaken, so a short delay isn't a problem, but the sooner it reaches the lab the better the reading.",
            ),
          ),
        },
      ],
    },
    {
      blockType: 'helpCta',
      heading: "We'll walk you through any of it.",
      body: "If anything about your kit is unclear, get in touch and we'll help you get your sample on its way.",
      fine: para(text('More answers in our '), link(L('/help'), [text('Help center')]), text('.')),
      ctaLabel: 'Contact support',
      ctaUrl: '/contact',
    },
  ]

  const data = {
    title: 'How to use your stool testing kit',
    slug: SLUG,
    layout,
    meta: {
      title: 'How to use your stool testing kit',
      description:
        'Step by step: register your kit, collect your sample, and send it to the lab.',
      robots: 'index,follow',
    },
    // The lexical documents above are hand-built plain objects; the generated
    // types want DefaultTypedEditorState, so the whole payload is cast once
    // here rather than sprinkling casts through the content.
  } as unknown as RequiredDataFromCollectionSlug<'pages'>

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    locale: LOCALE,
    draft: true,
    limit: 1,
    pagination: false,
  })

  const found = existing.docs[0]

  if (found) {
    await payload.update({
      collection: 'pages',
      id: found.id,
      locale: LOCALE,
      draft: true,
      data,
      // No Next.js request context in a CLI script; the hook already guards on
      // this flag rather than warning its way through every revalidate call.
      context: { disableRevalidate: true },
    })
    console.log(`  page: updated draft (id ${found.id}, slug ${SLUG})`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      locale: LOCALE,
      draft: true,
      data,
      context: { disableRevalidate: true },
    })
    console.log(`  page: created draft (id ${created.id}, slug ${SLUG})`)
  }

  console.log(`Done. Preview it at /${LOCALE}/${SLUG} once published, or via draft preview.`)
}

/**
 * Top-level await, NOT `seed().then(...)`.
 *
 * `payload run` does `await import(scriptPath)` and then calls
 * `process.exit(0)` as soon as that resolves. A floating promise lets module
 * evaluation finish the instant `seed()` suspends on its first await, so the
 * process exits before any work happens — silently, with no output and nothing
 * written. Awaiting here keeps the module pending until the seed is done, and
 * lets a thrown error reach the bin's own handler (which prints it and exits 1).
 */
await seed()
