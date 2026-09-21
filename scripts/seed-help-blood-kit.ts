import { getPayload } from 'payload'
import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import config from '@payload-config'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Seeds the English "How to use your blood testing kit" help article from the
 * design mockup (NB1_FAQ_Article_Template_blood_kit_example.html), using the
 * helpBlocks kit.
 *
 * Run:  npm run seed:help-blood-kit
 *
 * Idempotent: media are matched by filename and the page by slug, so re-running
 * updates in place rather than creating duplicates. The page is saved as a
 * DRAFT — review it in the CMS and publish it yourself.
 *
 * Only the `en` locale is written. Other locales inherit nothing; fill them the
 * usual way. The nineteen illustrations are the mockup's own, extracted from it
 * and converted to webp; the five drop-quality diagrams were rendered from the
 * mockup's inline SVG.
 *
 * Sibling of scripts/seed-help-stool-kit.ts. Where the stool article leans on a
 * labelled contents photo, this one uses the lead paragraph's parts list, and it
 * exercises the fields added for it: the flow strip, repeatable code chips, the
 * example guide, photo width / position, the sub-note, and two helpCallout
 * blocks.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.resolve(dirname, 'seed-assets')

const SLUG = 'how-to-use-your-blood-kit'
const LOCALE = 'en' as const

/**
 * Rich-text links.
 *
 * A `linkType: 'custom'` URL is rendered verbatim by LinkJSXConverter — only
 * `internal` doc links get the locale prefix — so custom paths inside rich text
 * have to carry it themselves. Plain text URL fields (ctaUrl, codes[].linkUrl)
 * are the opposite: the block components run them through `localizedHref`, so
 * those stay unprefixed. Bare `#fragment` links need no prefix either way.
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
const ul = (...items: ListChild[][]) => list('ul', items)

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

/** The mockup's illustrations, with the alt text a screen reader needs. */
const IMAGES: Record<string, string> = {
  'nb1-blood-kit-sampling-spot.webp':
    'A hand with the middle and ring finger pads marked as sampling spots and the pinky crossed out',
  'nb1-blood-kit-prick-1-supplies.webp':
    'Gauze, an alcohol swab and a plaster opened part-way, still in their wrappers',
  'nb1-blood-kit-prick-2-warm-hands.webp':
    'Hands washed under warm running water, dried with a towel, then the finger massaged',
  'nb1-blood-kit-prick-3-disinfect.webp': 'An alcohol swab wiped across a fingertip',
  'nb1-blood-kit-prick-4-lancet.webp':
    "The lancet's cap twisted off, then the lancet pressed against the finger pad until it clicks",
  'nb1-blood-kit-prick-5-first-drop.webp':
    'The first drop of blood wiped off the fingertip with a gauze compress',
  'nb1-blood-kit-dbs-1-drop.webp': 'A drop of blood hanging from a fingertip, ready to fall',
  'nb1-blood-kit-dbs-2-fill-circles.webp':
    'Drops of blood falling into the circles on the DBS card, filling them one by one',
  'nb1-blood-kit-adx-1-drop.webp': 'A drop of blood hanging from a fingertip, ready to fall',
  'nb1-blood-kit-adx-2-apply.webp':
    'A drop of blood applied to the square at the left end of the ADX strip card',
  'nb1-blood-kit-adx-3-spread.webp': 'Blood spreading along the ADX strip up to the first marking',
  'nb1-blood-kit-adx-4-filled.webp': 'The ADX strip card with the strip filled up to the marking',
  'nb1-blood-kit-plaster.webp': 'A plaster wrapped around the punctured fingertip',
  'nb1-blood-kit-write-date.webp':
    'The collection date written into the "Date Collected" field on the filled ADX strip card',
  'nb1-blood-kit-drop-false-position.webp': 'A drop placed off-centre, outside the printed circle',
  'nb1-blood-kit-drop-too-small.webp': 'A drop far too small for the printed circle',
  'nb1-blood-kit-drop-too-big.webp': 'A drop overflowing past the printed circle',
  'nb1-blood-kit-drop-double.webp': 'Two drops applied on top of each other',
  'nb1-blood-kit-drop-perfect.webp': 'A drop filling the printed circle evenly',
}

// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding "How to use your blood testing kit"...')

  const payload = await getPayload({ config })

  const media: Record<string, number> = {}
  for (const [filename, alt] of Object.entries(IMAGES)) {
    media[filename] = await upsertMedia(payload, filename, alt)
  }
  /** Shorthand: the media id for an asset, by its filename stem. */
  const m = (stem: string) => media[`${stem}.webp`]

  const layout = [
    {
      blockType: 'helpHero',
      heading: 'How to use your blood testing kit',
      dek: 'Follow these steps to collect and process your sample correctly.',
    },
    {
      blockType: 'helpNav',
      label: 'On this page',
      minHeadings: 2,
    },
    {
      // "Before you start" — an aside that only makes sense where it sits, so
      // it stays out of the contents rail.
      blockType: 'helpCallout',
      reserveTocSpace: true,
      variant: 'info',
      heading: 'Before you start',
      showInNav: false,
      body: doc(
        ul(
          [text('This kit is intended for adults aged 18 and over.')],
          [
            text('See '),
            link('#never', [text('What to never do')]),
            text(' and '),
            link('#faq', [text('Common questions')]),
            text(' below for other situations to check before you start.'),
          ],
        ),
      ),
    },
    {
      blockType: 'helpSteps',
      reserveTocSpace: true,
      // No contents photo for this kit — the mockup lists the parts instead.
      intro: doc(
        p(text('Kit content')),
        ul(
          [text('4× alcohol swabs')],
          [
            text(
              '1× DBS standard blood card ("the 4-circle test card"), in a transparent resealable bag with desiccant',
            ),
          ],
          [text('1× ADX blood collection card ("the strip test card")')],
          [text('2× gauze compresses')],
          [text('4× plasters')],
          [text('4× sterile lancets')],
          [text('1× sealed white specimen bag with desiccant')],
          [text('1× mailing envelope')],
        ),
      ),
      steps: [
        {
          title: 'Fast 12 hours prior',
          body: para(
            text(
              'Do not eat any food for 12 hours before collecting. Water is fine, and it actually helps.',
            ),
          ),
        },
        {
          title: 'Activate your blood sampling cards',
          body: para(
            text('Each card has a unique code printed on it. Visit '),
            link(L('/login'), [text('nb1.com')]),
            text(
              ' and log in to your account. Enter the code in the field provided to link your sample to your account.',
            ),
          ),
          // Two chips: the two cards carry differently formatted codes.
          codes: [
            { label: 'Example', value: 'DE013|A12BC345D6' },
            { label: 'Example', value: 'EU9FDJBD' },
          ],
        },
        {
          title: 'Choose your sampling spot',
          media: m('nb1-blood-kit-sampling-spot'),
          mediaPosition: 'above',
          mediaWidth: 'small',
          body: para(
            text(
              "Use your middle or ring finger, on your non-dominant hand (left hand if you're right-handed, right hand if you're left-handed). The best site for a finger puncture is just off the centre of the finger pad.",
            ),
          ),
          notes: [
            {
              variant: 'info',
              title: 'To avoid pain',
              body: para(
                text('Never use your pinky finger or the very tip of your finger to sample.'),
              ),
            },
          ],
        },
        {
          title: 'Prick your finger',
          // The frames are numbered in the artwork itself, so they carry no
          // labels — the alt text does that work.
          flow: [
            { image: m('nb1-blood-kit-prick-1-supplies') },
            { image: m('nb1-blood-kit-prick-2-warm-hands') },
            { image: m('nb1-blood-kit-prick-3-disinfect') },
            { image: m('nb1-blood-kit-prick-4-lancet') },
            { image: m('nb1-blood-kit-prick-5-first-drop') },
          ],
          body: doc(
            ol(
              [
                text(
                  'Find a clean, well-lit space. Open the gauze, alcohol swab and plaster part-way, without fully unwrapping them.',
                ),
              ],
              [
                text(
                  "Get your circulation going — move around for a few minutes, then wash your hands with warm water for at least 20 seconds and dry them. If your hands are still cold, massage the finger you'll use.",
                ),
              ],
              [
                text(
                  'Disinfect the fingertip with the alcohol swab and let it dry completely, about 30 seconds.',
                ),
              ],
              [
                text(
                  "Remove the lancet's protective cap by twisting it twice (don't pull on the cap). Press the lancet firmly against the sampling spot. You'll hear a click and feel a small prick.",
                ),
              ],
              [
                text(
                  'If a drop of blood has formed after the prick, proceed to the next step. If little or no blood appears, massage the finger gently and wipe away the first drop with a gauze compress.',
                ),
              ],
            ),
          ),
          subnote: '…You can now begin collecting the sample on the blood collection cards.',
        },
        {
          title: 'Fill the 4-circle test card (DBS)',
          flow: [
            { image: m('nb1-blood-kit-dbs-1-drop') },
            { image: m('nb1-blood-kit-dbs-2-fill-circles') },
          ],
          body: doc(
            ol(
              [
                text(
                  "You will need to fill all 4 circles with blood. For that, let the drop fall onto the card from your finger. Don't touch the card.",
                ),
              ],
              [
                text(
                  'Let it soak through and saturate the circle fully or almost, then fill all remaining circles.',
                ),
              ],
              [text('Keep going without interruption where possible.')],
            ),
          ),
          notes: [
            {
              variant: 'quiet',
              body: para(
                bold('Tip:'),
                text(' Not enough blood from the first finger? Repeat the prick on a different one.'),
              ),
            },
            {
              variant: 'info',
              title: 'Important',
              body: para(
                text("Never apply fresh blood on top of blood that's already dried."),
              ),
            },
          ],
          guide: [
            { image: m('nb1-blood-kit-drop-false-position'), label: 'False position' },
            { image: m('nb1-blood-kit-drop-too-small'), label: 'Too small' },
            { image: m('nb1-blood-kit-drop-too-big'), label: 'Too big' },
            { image: m('nb1-blood-kit-drop-double'), label: 'Double application' },
            { image: m('nb1-blood-kit-drop-perfect'), label: 'Perfect' },
          ],
          subnote: 'Each circle should be filled evenly.',
        },
        {
          title: 'Fill the strip test card (ADX)',
          flow: [
            { image: m('nb1-blood-kit-adx-1-drop') },
            { image: m('nb1-blood-kit-adx-2-apply') },
            { image: m('nb1-blood-kit-adx-3-spread') },
            { image: m('nb1-blood-kit-adx-4-filled') },
          ],
          body: doc(
            ol(
              [text('Hold your finger above the square on the left side, without touching the card.')],
              [
                text(
                  'Let the blood spread on its own along the strip until it reaches the first marking — around 4–5 drops.',
                ),
              ],
              [
                text(
                  "Don't interrupt the collection. Stroking your palm toward the finger, or holding the card vertically, can help the blood flow.",
                ),
              ],
            ),
          ),
          notes: [
            {
              variant: 'quiet',
              body: para(
                bold('Tip:'),
                text(' Not enough blood from the first finger? Repeat the prick on a different one.'),
              ),
            },
            {
              variant: 'info',
              title: 'Important',
              body: para(text("Never apply fresh blood on top of blood that's already dried.")),
            },
          ],
        },
        {
          title: 'Care for your finger',
          media: m('nb1-blood-kit-plaster'),
          mediaPosition: 'above',
          mediaWidth: 'small',
          body: para(
            text(
              'Press a gauze compress on the puncture site until the bleeding stops, then cover it with a plaster. Dispose of the lancet and other used items in household waste, or as your local regulations require.',
            ),
          ),
        },
        {
          title: 'Write the date of collection on the strip test card',
          media: m('nb1-blood-kit-write-date'),
          mediaPosition: 'above',
          mediaWidth: 'medium',
          // Emphasis follows the mockup, which bolds nothing here — the house
          // rule about bolding the words that matter is a writing guideline for
          // new copy, not a licence to re-emphasise a design-locked template.
          body: para(
            text('This is important — without a date, this test will be marked invalid by the lab.'),
          ),
        },
        {
          title: 'Dry all cards',
          body: para(
            text(
              'Air-dry all blood cards for 2–12 hours — somewhere clean, out of direct sunlight, and never on a radiator or other heat source.',
            ),
          ),
        },
        {
          title: 'Send your sample',
          body: doc(
            ul(
              [
                text('Put the DBS (or "circles") blood card back in its own transparent resealable bag.'),
              ],
              [text('Put the ADX (or "strip") blood card in the white specimen bag.')],
              [text('Keep all desiccant sachets inside their respective bags.')],
              [
                text('Log into your account on '),
                link(L('/login'), [text('nb1.com')]),
                text(' and follow the shipping instructions.'),
              ],
            ),
          ),
        },
      ],
      outro: {
        doneText: "…And you're done!",
        note: para(
          text('Also collecting a stool sample? See '),
          link(L('/help/how-to-use-your-stool-kit'), [
            text('How to use your stool testing kit'),
          ]),
          text('.'),
        ),
      },
    },
    {
      // "What to never do" — the reader should be able to jump to this, so it
      // takes an h2 and a rail entry. Its anchor is what the "Before you start"
      // callout links to.
      blockType: 'helpCallout',
      reserveTocSpace: true,
      variant: 'info',
      heading: 'What to never do',
      showInNav: true,
      anchor: 'never',
      body: doc(
        ul(
          [text("Use this kit if you're under 18.")],
          [text('Let anyone else give the sample — one kit is for one person.')],
          [
            text(
              "Reuse a lancet, or use one that's missing its protective cap or has a loose one.",
            ),
          ],
          [text('Use the kit past its expiry date.')],
          [text('Store it below 4°C or above 30°C.')],
          [text("Add fresh blood on top of blood that's already dried on a card.")],
        ),
      ),
    },
    {
      blockType: 'helpFaq',
      reserveTocSpace: true,
      title: 'Common questions',
      anchor: 'faq',
      items: [
        {
          question: "What if my blood doesn't come out?",
          answer: para(
            text(
              'Massage your finger gently, or gently stroke your palm toward it to encourage flow. Still nothing? Try warming your hands first (see ',
            ),
            // Step anchors default to a slug of the step title (helpAnchor), so
            // the mockup's #step-4 becomes #prick-your-finger. Leaving the
            // anchors unset keeps them stable across locales and readable.
            link('#prick-your-finger', [text('Step 4')]),
            text('), or use a different finger.'),
          ),
        },
        {
          question: 'What if seeing blood makes me feel faint?',
          answer: para(
            text(
              "That's common. Sit or lie down before you start, and have someone with you if you can. If you feel dizzy during collection, stop and rest before continuing.",
            ),
          ),
        },
        {
          question:
            'What if I have a bleeding or clotting disorder, take blood thinners, or am pregnant/breastfeeding?',
          answer: para(
            text(
              'Check with your doctor before using this kit — they can tell you whether a fingerstick sample is appropriate for you.',
            ),
          ),
        },
        {
          question: 'What if something goes wrong or I have questions during the procedure?',
          answer: para(
            text('Contact '),
            link(L('/contact'), [text('support')]),
            text(" and we'll help you sort it out."),
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
    title: 'How to use your blood testing kit',
    slug: SLUG,
    layout,
    meta: {
      title: 'How to use your blood testing kit',
      description:
        'Step by step: get in the right condition, register your cards, prick your finger, sample your blood cards, and send them to the lab.',
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
