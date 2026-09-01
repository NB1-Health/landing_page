import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds test data for the Journal: categories, authors, and three published
 * articles — enough to exercise every branch of the index.
 *
 *   npm run seed:journal            create or update the seed data
 *   npm run seed:journal -- --clean remove it again
 *
 * Everything is namespaced `test-*` by slug so it is obvious in the admin and
 * trivially removable. Re-running updates in place rather than duplicating.
 *
 * WHY THREE ARTICLES AND THREE CATEGORIES
 * One of each would not test much. Three of each exercises: the featured slot
 * and its exclusion from the grid, chip filtering across more than one topic,
 * varied read times on the cards, and the reviewer byline.
 *
 * NO COVER IMAGES, DELIBERATELY
 * Uploading media needs real image files, and leaving heroImage empty exercises
 * the category-gradient fallback (`.jr-thumb--science` and friends), which is a
 * real code path worth seeing. To check the image path, attach a cover to one
 * article in the admin afterwards.
 *
 * THE BODY TEXT IS OBVIOUS PLACEHOLDER, DELIBERATELY
 * NB1 is a wellness product and the brief is explicit that copy must not make
 * medical claims. Seed articles that read like publishable health writing are a
 * liability if one ever escapes to production, so the bodies say plainly that
 * they are test content and carry no claims.
 */

const LOCALE = 'en' as const

// ── lexical helpers ────────────────────────────────────────────────────────────

type Node = Record<string, unknown>

const text = (value: string): Node => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const paragraph = (value: string): Node => ({
  type: 'paragraph',
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const heading = (tag: 'h2' | 'h3', value: string): Node => ({
  type: 'heading',
  tag,
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const doc = (children: Node[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const FILLER =
  'This paragraph is placeholder text for layout testing only. It makes no health ' +
  'claim of any kind and should be replaced before this article is published. It ' +
  'exists so the page has enough body copy to show realistic spacing, a working ' +
  'table of contents and a plausible read-time estimate on the index card.'

/** Repeats the filler paragraph until the body is roughly `words` long. */
function body(intro: string, sections: string[], words: number): Node[] {
  const nodes: Node[] = [paragraph(intro)]
  const fillerWords = FILLER.split(/\s+/).length
  const perSection = Math.max(1, Math.round(words / sections.length / fillerWords))

  for (const section of sections) {
    nodes.push(heading('h2', section))
    for (let i = 0; i < perSection; i++) nodes.push(paragraph(FILLER))
  }
  return nodes
}

// ── seed data ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'gut-health', title: 'Gut health' },
  { slug: 'science', title: 'The science' },
  { slug: 'nutrition', title: 'Nutrition' },
]

const AUTHORS = [
  {
    slug: 'test-author',
    name: 'Test Author',
    credentials: 'PhD',
    roleTitle: 'Science writer',
    bio: 'Seed data. Replace or remove before launch.',
  },
  {
    slug: 'test-reviewer',
    name: 'Test Reviewer',
    credentials: 'MD',
    roleTitle: 'Medical reviewer',
    bio: 'Seed data. Replace or remove before launch.',
  },
]

const ARTICLES = [
  {
    slug: 'test-what-your-gut-microbiome-does',
    category: 'gut-health',
    featured: true,
    title: 'What your gut microbiome actually does',
    subtitle:
      'A plain-English tour of the microbes involved in digestion, and why the same advice does not suit everyone.',
    excerpt:
      'A plain-English tour of the gut microbiome and why general advice rarely fits one person. Seed article for layout testing.',
    metaTitle: 'What your gut microbiome actually does',
    words: 1300,
    sections: ['Where the microbiome sits', 'Why individuals differ', 'What this means for you'],
  },
  {
    slug: 'test-shotgun-sequencing-vs-16s',
    category: 'science',
    featured: false,
    title: 'Shotgun sequencing versus 16S',
    subtitle:
      'Two ways to read a gut sample, at two very different levels of detail. Here is what separates them.',
    excerpt:
      'Two ways to read a gut sample, at two very different levels of detail. Seed article for layout testing.',
    metaTitle: 'Shotgun sequencing versus 16S',
    words: 1800,
    sections: ['How 16S works', 'How shotgun differs', 'Choosing between them', 'Limitations'],
  },
  {
    slug: 'test-prebiotics-probiotics-postbiotics',
    category: 'nutrition',
    featured: false,
    title: 'Prebiotics, probiotics and postbiotics',
    subtitle: 'The "-biotics" family, untangled: what each term refers to and how they differ.',
    excerpt:
      'The "-biotics" family untangled: what each term refers to and how they differ. Seed article for layout testing.',
    metaTitle: 'Prebiotics, probiotics and postbiotics',
    words: 650,
    sections: ['The three terms', 'Where they overlap'],
  },
]

// ── run ───────────────────────────────────────────────────────────────────────

const clean = process.argv.includes('--clean')
const payload = await getPayload({ config })

// Revalidation calls next/cache APIs, which are not available outside a Next
// request. The hooks log a warning and continue, but silencing it keeps the
// output readable. In dev just reload the page; nothing is cached statically.
const ctx = { context: { disableRevalidate: true }, overrideAccess: true }

async function findBySlug(collection: 'categories' | 'authors' | 'posts', slug: string) {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    locale: LOCALE,
    overrideAccess: true,
    pagination: false,
  })
  return res.docs[0] ?? null
}

/** Create or update in place, so re-running never duplicates. */
async function upsert(
  collection: 'categories' | 'authors' | 'posts',
  slug: string,
  data: Record<string, unknown>,
): Promise<{ id: number | string }> {
  const existing = await findBySlug(collection, slug)
  if (existing) {
    const updated = await payload.update({
      collection,
      id: existing.id,
      data,
      locale: LOCALE,
      ...ctx,
    })
    console.log(`  updated  ${collection}/${slug}`)
    return updated
  }
  // One helper seeds three collections, so `collection` is a union and `data` is
  // deliberately loose. Payload's `create` is overloaded per collection slug and
  // cannot resolve against a union — it collapses to demanding every overload's
  // required keys at once, including `draft: true`. Narrowing at this single
  // boundary keeps the helper usable for all three; the alternative is three
  // near-identical copies of it. `update` above resolves fine, so only `create`
  // needs it.
  const created = await payload.create({
    // Pinned to one slug so the generic resolves; `collection` is still the real
    // runtime value, and `data` is validated by Payload at runtime regardless.
    collection: collection as 'posts',
    data: data as never,
    locale: LOCALE,
    ...ctx,
  })
  console.log(`  created  ${collection}/${slug}`)
  return created
}

try {
  if (clean) {
    console.log('Removing Journal seed data...\n')
    for (const article of ARTICLES) {
      const doc = await findBySlug('posts', article.slug)
      if (doc) {
        await payload.delete({ collection: 'posts', id: doc.id, ...ctx })
        console.log(`  deleted  posts/${article.slug}`)
      }
    }
    for (const author of AUTHORS) {
      const doc = await findBySlug('authors', author.slug)
      if (doc) {
        await payload.delete({ collection: 'authors', id: doc.id, ...ctx })
        console.log(`  deleted  authors/${author.slug}`)
      }
    }
    // Categories are intentionally NOT deleted: they are real taxonomy the
    // agency will keep, and other posts may already reference them.
    console.log('\nDone. Categories were left in place — they are real taxonomy.')
    process.exit(0)
  }

  console.log('Seeding Journal test data...\n')

  console.log('Categories')
  const categoryIds = new Map<string, number | string>()
  for (const category of CATEGORIES) {
    const doc = await upsert('categories', category.slug, {
      title: category.title,
      slug: category.slug,
    })
    categoryIds.set(category.slug, doc.id)
  }

  console.log('\nAuthors')
  const authorIds = new Map<string, number | string>()
  for (const author of AUTHORS) {
    const doc = await upsert('authors', author.slug, author)
    authorIds.set(author.slug, doc.id)
  }

  console.log('\nArticles')
  for (const article of ARTICLES) {
    const categoryId = categoryIds.get(article.category)
    if (!categoryId) throw new Error(`No category for ${article.category}`)

    await upsert('posts', article.slug, {
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      primaryCategory: categoryId,
      categories: [categoryId],
      authors: [authorIds.get('test-author')],
      reviewer: authorIds.get('test-reviewer'),
      featured: article.featured,
      publishedAt: new Date().toISOString(),
      intro: doc([
        paragraph(
          'Seed content for layout testing. This introduction carries no health claim and should be replaced before publication.',
        ),
      ]),
      content: doc(body(article.subtitle, article.sections, article.words)),
      // readTime is left unset on purpose so the auto-calculation hook fills it
      // — that is one of the things worth verifying.
      meta: {
        title: article.metaTitle,
        // description is left unset on purpose so the excerpt fallback fills it.
      },
      schemaMarkup: { type: 'Article' },
      _status: 'published',
    })
  }

  console.log('\nDone.\n')
  console.log('Check:')
  console.log('  /en/journal                                        index, chips, featured slot')
  console.log('  /en/journal/test-what-your-gut-microbiome-does      the featured article')
  console.log('  /cms/admin/collections/posts                       read time + meta description')
  console.log('\nExpected: three cards, one in the featured slot, read times roughly 6 / 8 / 3')
  console.log('minutes, and a meta description auto-filled from each excerpt.')
  console.log('\nRemove with: npm run seed:journal -- --clean')
  process.exit(0)
} catch (err) {
  console.error('\nSEED FAILED:', err)
  process.exit(1)
}
