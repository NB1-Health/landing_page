import type { Post } from '@/payload-types'

import type { PublisherSchema } from '@/utilities/publisherSchema'
import type { BreadcrumbRung } from '@/utilities/journalTrail'

/**
 * Generic shape for walking serialized Lexical content. The generated `Post.content`
 * children only expose `type`/`version`, so we describe the extra fields we read.
 */
type LexicalNodeLike = {
  type?: string
  children?: LexicalNodeLike[]
  fields?: Record<string, unknown>
  [k: string]: unknown
}

type SchemaMarkup = Omit<NonNullable<Post['schemaMarkup']>, 'type'> & {
  type?: 'Article' | 'TechArticle' | 'FAQPage' | 'MedicalWebPage'
  medical?: {
    aboutName?: string
    aboutType?: string
    medicalSpecialty?: string
  }
}

function absoluteURL(siteURL: string, maybeRelative?: string | null) {
  if (!maybeRelative) return undefined
  try {
    return new URL(maybeRelative, siteURL).toString()
  } catch {
    return undefined
  }
}

function mediaURL(media: Post['heroImage']): string | null | undefined {
  return media && typeof media === 'object' ? media.url : undefined
}

/**
 * `/{locale}/authors/[slug]` is described on the Authors collection but has never
 * been built. A `Person.url` that 404s is a worse signal than omitting an
 * optional property, so the link is suppressed until the route exists — flip
 * this when it does.
 */
const AUTHOR_ROUTE_EXISTS: boolean = false

function buildAuthors(post: Post, siteURL: string, locale: string) {
  const authors = post.populatedAuthors ?? undefined

  const clean = (authors ?? [])
    .map((a) => ({
      name: String(a?.name ?? '').trim(),
      slug: String(a?.slug ?? '').trim(),
    }))
    .filter((a) => a.name)

  if (!clean.length) return undefined

  const toPerson = (a: { name: string; slug?: string }) => ({
    '@type': 'Person',
    name: a.name,
    ...(AUTHOR_ROUTE_EXISTS && a.slug
      ? { url: `${siteURL}/${locale}/authors/${a.slug}` }
      : {}),
  })

  return clean.length === 1 ? toPerson(clean[0]) : clean.map(toPerson)
}

function extractFaqAccordionItems(post: Post) {
  const rootChildren = post.content?.root?.children as LexicalNodeLike[] | undefined
  if (!Array.isArray(rootChildren)) return []

  const items: Array<{ question: string; answer: string }> = []

  const walk = (node: LexicalNodeLike | null | undefined) => {
    if (!node) return
    const children = Array.isArray(node.children) ? node.children : []

    // Common Payload Lexical block shape:
    if (node.type === 'block' && node.fields?.blockType === 'faqAccordion') {
      const rawItems = node.fields?.items
      const arr: Array<Record<string, unknown>> = Array.isArray(rawItems) ? rawItems : []
      for (const it of arr) {
        const q = String(it?.question ?? '').trim()
        const a = String(it?.answer ?? '').trim()
        if (q && a) items.push({ question: q, answer: a })
      }
    }

    for (const c of children) walk(c)
  }

  for (const c of rootChildren) walk(c)
  return items
}

function extractComparisonProducts(post: Post) {
  const rootChildren = post.content?.root?.children as LexicalNodeLike[] | undefined
  if (!Array.isArray(rootChildren)) return []

  const products: Array<{
    name: string
    url?: string
    brand?: string
    manufacturer?: string
    description?: string
  }> = []

  const walk = (node: LexicalNodeLike | null | undefined) => {
    if (!node) return
    const children = Array.isArray(node.children) ? node.children : []

    if (node.type === 'block' && node.fields?.blockType === 'comparisonTable') {
      const generateSchema = Boolean(node.fields?.generateSchema)
      if (!generateSchema) return

      const rawRows = node.fields?.rows
      const rows: Array<Record<string, unknown>> = Array.isArray(rawRows) ? rawRows : []
      for (const r of rows) {
        const name = String(r?.productName ?? '').trim()
        if (!name) continue
        products.push({
          name,
          url: r?.productUrl ? String(r.productUrl) : undefined,
          brand: r?.brand ? String(r.brand) : undefined,
          manufacturer: r?.manufacturer ? String(r.manufacturer) : undefined,
          description: r?.description ? String(r.description) : undefined,
        })
      }
    }

    for (const c of children) walk(c)
  }

  for (const c of rootChildren) walk(c)
  return products
}

/**
 * Serialise a breadcrumb trail as `BreadcrumbList`.
 *
 * Takes the SAME `BreadcrumbRung[]` the visible `<Breadcrumb>` renders, built by
 * `buildJournalTrail`. That is deliberate: SEO-007 §5 requires the markup and the
 * rendered trail to agree character for character and calls any mismatch a P1
 * defect, and the reliable way to guarantee that is one array feeding both,
 * rather than two functions that happen to agree today.
 *
 * Every rung carries `item`, including the last. A self-referencing final item is
 * valid and is what the approved previews emit; the *visible* final rung is still
 * plain text with `aria-current`, which is a separate concern.
 *
 * Position 2 is always Journal — the hierarchy SEO-007 exists to declare, given
 * the URLs are flat and carry no `/journal/` segment for a crawler to read.
 */
export function buildBreadcrumbSchema({
  siteURL,
  rungs,
}: {
  siteURL: string
  rungs: BreadcrumbRung[]
}) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: rungs.map((rung, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: rung.name,
      item: new URL(rung.path, siteURL).toString(),
    })),
  }
}

export function buildPostSchema({
  post,
  siteURL,
  locale,
  breadcrumb,
  publisher,
}: {
  post: Post
  siteURL: string
  locale: string
  /** The rendered trail. Omit to leave BreadcrumbList out of the graph. */
  breadcrumb?: BreadcrumbRung[]
  /** From Site Settings' Organization JSON-LD. Falls back to the legal name. */
  publisher?: PublisherSchema
}) {
  if (!post) return null

  const slug = typeof post.slug === 'string' ? post.slug : ''
  // Posts are served under /journal. This previously emitted /posts, so the
  // JSON-LD `url` and `mainEntityOfPage` pointed at a 301 while the canonical
  // said /journal — a direct contradiction in the structured data.
  const url = `${siteURL}/${locale}/journal/${encodeURIComponent(slug)}`

  const schemaMarkup = post.schemaMarkup as SchemaMarkup | undefined

  const schemaType = schemaMarkup?.type || 'Article'
  const headline =
    (schemaMarkup?.headline || '').trim() || (typeof post.title === 'string' ? post.title : '')

  const description = post.meta?.description || undefined
  const imageURL =
    absoluteURL(siteURL, mediaURL(post.meta?.image)) ||
    absoluteURL(siteURL, mediaURL(post.heroImage)) ||
    undefined

  const datePublished = post.publishedAt || undefined
  const dateModified = post.updatedAt || undefined

  const author = buildAuthors(post, siteURL, locale)

  // Google's Article guidance asks for publisher.logo, and the approved
  // template's JSON-LD stub includes it. Both were previously absent.
  const publisherLogo = absoluteURL(siteURL, publisher?.logoUrl)
  const publisherSchema = {
    '@type': 'Organization',
    name: publisher?.name || 'NB1 Health GmbH',
    ...(publisherLogo ? { logo: { '@type': 'ImageObject', url: publisherLogo } } : {}),
  }

  // ✅ Auto FAQ from FAQAccordion blocks
  const blockFaq = extractFaqAccordionItems(post)

  // ✅ Explicit FAQ items (if using schemaMarkup.type === FAQPage)
  const explicitFaq = (schemaMarkup?.faqItems ?? [])
    .map((i) => ({
      question: String(i?.question ?? '').trim(),
      answer: String(i?.answer ?? '').trim(),
    }))
    .filter((i) => i.question && i.answer)

  // If editor explicitly set FAQPage, use explicit items; otherwise use block items.
  const faqItems = schemaType === 'FAQPage' ? explicitFaq : blockFaq

  const faqSchema =
    faqItems.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: faqItems.map((i) => ({
            '@type': 'Question',
            name: i.question,
            acceptedAnswer: { '@type': 'Answer', text: i.answer },
          })),
        }
      : null

  // ✅ Auto schema from ComparisonTable blocks (simple ItemList of Products)
  const comparisonProducts = extractComparisonProducts(post)
  const comparisonSchema =
    comparisonProducts.length > 0
      ? {
          '@type': 'ItemList',
          itemListElement: comparisonProducts.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Product',
              name: p.name,
              ...(p.description ? { description: p.description } : {}),
              ...(p.url ? { url: p.url } : {}),
              ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
              ...(p.manufacturer
                ? { manufacturer: { '@type': 'Organization', name: p.manufacturer } }
                : {}),
            },
          })),
        }
      : null

  // ✅ Main schema (keeps your previous behavior)
  let main: Record<string, unknown> | null = null

  if (schemaType === 'Article' || schemaType === 'TechArticle') {
    main = {
      '@type': schemaType,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      headline,
      ...(description ? { description } : {}),
      ...(imageURL ? { image: [imageURL] } : {}),
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      ...(author ? { author } : {}),
      publisher: publisherSchema,
    }
  } else if (schemaType === 'MedicalWebPage') {
    const med = schemaMarkup?.medical || {}
    main = {
      '@type': 'MedicalWebPage',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      name: headline,
      ...(description ? { description } : {}),
      ...(imageURL ? { image: [imageURL] } : {}),
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      ...(author ? { author } : {}),
      ...(med?.aboutName
        ? { about: { '@type': med.aboutType || 'MedicalCondition', name: med.aboutName } }
        : {}),
      ...(med?.medicalSpecialty ? { medicalSpecialty: med.medicalSpecialty } : {}),
      publisher: publisherSchema,
    }
  } else if (schemaType === 'FAQPage') {
    main = faqSchema
  }

  // ✅ Merge everything with @graph (best practice when multiple schemas exist)
  const breadcrumbSchema =
    breadcrumb && breadcrumb.length ? buildBreadcrumbSchema({ siteURL, rungs: breadcrumb }) : null

  const graph = [
    main,
    breadcrumbSchema,
    schemaType !== 'FAQPage' ? faqSchema : null,
    comparisonSchema,
  ].filter(Boolean)
  if (!graph.length) return null

  return { '@context': 'https://schema.org', '@graph': graph }
}
