import type { BreadcrumbRung } from '@/utilities/journalTrail'
import type { JournalCardData } from '@/utilities/journalCard'
import type { PublisherSchema } from '@/utilities/publisherSchema'

import { buildBreadcrumbSchema } from '@/utilities/buildSchema'

/**
 * Structured data for any index page — the Journal hub and the Microbiome /
 * Research / Lexicon hubs alike.
 *
 * SEO-007 §8 lists the absence of this as defect 2 and a launch blocker: *"No
 * JSON-LD of any kind — no BreadcrumbList, no CollectionPage, no ItemList. The
 * hierarchy in §5 has nothing to attach to. This is the ticket's core mechanism
 * missing."* The index shipped without any, so the whole hierarchy the ticket
 * exists to declare had nowhere to live.
 *
 * Three nodes in one `@graph`:
 *
 * - **BreadcrumbList** — Home › Journal, built from the same rungs the visible
 *   trail renders. Journal at position 2 is the hierarchy statement.
 * - **CollectionPage** — what this page *is*. Without it the hub is an untyped
 *   document and the ItemList has nothing to belong to.
 * - **ItemList** — the articles actually rendered, in rendered order. Only the
 *   cards on this page: claiming items a crawler cannot see on the page is the
 *   kind of mismatch that gets structured data ignored wholesale.
 *
 * Deliberately NOT emitted: an `Article` node per card. Each article has its own
 * page carrying its own Article schema, and duplicating it here would compete
 * with the canonical — §11.2 is explicit that the Journal indexes content, it
 * does not absorb it.
 */
export function buildIndexPageSchema({
  siteURL,
  canonicalPath,
  locale,
  rungs,
  cards,
  featured,
  title,
  description,
  publisher,
}: {
  siteURL: string
  /** Locale-prefixed path of this index, e.g. `/en/journal` or `/de/mikrobiom`. */
  canonicalPath: string
  locale: string
  rungs: BreadcrumbRung[]
  cards: JournalCardData[]
  featured?: JournalCardData | null
  title: string
  description: string
  publisher?: PublisherSchema
}) {
  const canonical = new URL(canonicalPath, siteURL).toString()

  // Rendered order: the featured slot sits above the grid, and it is excluded
  // from the grid, so there is no duplicate to guard against here.
  const listed = [...(featured ? [featured] : []), ...cards]

  const itemList = {
    '@type': 'ItemList',
    '@id': `${canonical}#articles`,
    name: title,
    numberOfItems: listed.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: listed.map((card, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: card.title,
      url: new URL(card.href, siteURL).toString(),
    })),
  }

  const collectionPage = {
    '@type': 'CollectionPage',
    '@id': canonical,
    url: canonical,
    name: title,
    description,
    inLanguage: locale,
    ...(publisher?.name
      ? { publisher: { '@type': 'Organization', name: publisher.name } }
      : {}),
    ...(listed.length ? { mainEntity: { '@id': itemList['@id'] } } : {}),
  }

  const graph: Record<string, unknown>[] = [
    buildBreadcrumbSchema({ siteURL, rungs }),
    collectionPage,
  ]

  // An empty ItemList is worse than none — it asserts the hub has no content.
  if (listed.length) graph.push(itemList)

  return { '@context': 'https://schema.org', '@graph': graph }
}
