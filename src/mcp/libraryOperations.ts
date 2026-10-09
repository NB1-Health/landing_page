import { APIError, type PayloadRequest } from 'payload'
import { z } from 'zod'

import { ARTICLE_SECTIONS } from '@/collections/ScientificArticles/sections'
import { TERM_SECTIONS } from '@/collections/LexiconTerms/sections'
import { META_DESCRIPTION_MAX, META_TITLE_MAX } from '@/fields/contentDocument'
import { appLocales, type AppLocale } from '@/i18n/config'
import { assertAgentRequest, lockDocumentRows } from '@/mcp/contentOperations'
import { HUB_KEY, type LibraryCollection } from '@/mcp/libraryCollections'
import { MarkdownError, markdownToRichText } from '@/mcp/markdownToRichText'

/**
 * The content library — pillars, scientific articles, lexicon terms and lexicon
 * categories — for MCP agents.
 *
 * Built for pipelines that own their records: everything is addressed by stable
 * keys rather than database ids. A record by its `externalId`, a category by its
 * `key`, an author by their `slug`, and the hub not at all (it follows from the
 * collection). Rich-text fields take markdown. One upsert item is one document
 * with all its locales, because an EN/DE pair is one document here and the
 * hreflang cluster is built from that pairing.
 *
 * Drafts only, like every agent write. Note that Payload skips field validation
 * on draft saves, so the schemas below are the only validation an agent write
 * gets before publish — they carry the collections' limits for that reason.
 */

const TABLE: Record<LibraryCollection, string> = {
  pillars: 'pillars',
  'scientific-articles': 'scientific_articles',
  'lexicon-terms': 'lexicon_terms',
  'lexicon-categories': 'lexicon_categories',
}

export const MAX_UPSERT_ITEMS = 25

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const text = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => text(max).nullable()
const stableKey = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.')
const slug = stableKey.max(70)
const markdown = z.string().max(100_000).nullable()
const date = z.union([z.string().date(), z.string().datetime({ offset: true })]).nullable()
const authors = z.array(stableKey).min(1).max(10)
const meta = z
  .object({
    title: optionalText(META_TITLE_MAX),
    description: optionalText(META_DESCRIPTION_MAX),
  })
  .partial()
  .strict()
const references = (maxRows: number) =>
  z
    .array(z.object({ text: text(2_000), url: z.string().trim().url().max(2_000) }).strict())
    .max(maxRows)
    .nullable()
const sectionBody = z.object({ body: markdown }).partial().strict()

const reviewFields = { reviewer: stableKey.nullable(), reviewedAt: date }

const SCHEMAS = {
  pillars: {
    shared: z
      .object({
        authors,
        ...reviewFields,
        heroImage: z.number().int().positive().nullable(),
        noindex: z.boolean(),
      })
      .partial()
      .strict(),
    localized: z
      .object({
        title: text(110),
        slug,
        standfirst: optionalText(1_000),
        heroCaption: optionalText(300),
        content: markdown,
        faq: z
          .array(z.object({ question: text(300), answer: text(2_000) }).strict())
          .max(5)
          .nullable(),
        references: references(6),
        meta,
      })
      .partial()
      .strict(),
  },
  'scientific-articles': {
    shared: z
      .object({
        category: stableKey.nullable(),
        authors,
        ...reviewFields,
        sourceTitle: optionalText(500),
        sourceJournal: optionalText(200),
        studyYear: z.number().int().min(1900).max(2100).nullable(),
        doi: optionalText(200),
        noindex: z.boolean(),
      })
      .partial()
      .strict(),
    localized: z
      .object({
        title: text(160),
        slug,
        standfirst: optionalText(1_000),
        lead: markdown,
        ...Object.fromEntries(
          ARTICLE_SECTIONS.map(({ key }) => [
            key,
            z.object({ heading: optionalText(120), body: markdown }).partial().strict(),
          ]),
        ),
        references: references(20),
        meta,
      })
      .partial()
      .strict(),
  },
  'lexicon-terms': {
    shared: z
      .object({
        category: stableKey.nullable(),
        italicName: z.boolean(),
        isCondition: z.boolean(),
        ...reviewFields,
        noindex: z.boolean(),
      })
      .partial()
      .strict(),
    localized: z
      .object({
        title: text(90),
        slug,
        alsoKnownAs: optionalText(300),
        definition: optionalText(600),
        ...Object.fromEntries(TERM_SECTIONS.map(({ key }) => [key, sectionBody])),
        references: references(3),
        meta,
      })
      .partial()
      .strict(),
  },
  'lexicon-categories': {
    shared: z.object({ key: stableKey, noindex: z.boolean() }).partial().strict(),
    localized: z
      .object({
        title: text(90),
        slug,
        intro: optionalText(1_000),
        exampleTerms: optionalText(300),
      })
      .partial()
      .strict(),
  },
} satisfies Record<LibraryCollection, { shared: z.ZodTypeAny; localized: z.ZodTypeAny }>

/** Rich-text fields, as paths into the localized data. */
const MARKDOWN_PATHS: Record<LibraryCollection, ReadonlyArray<readonly string[]>> = {
  pillars: [['content']],
  'scientific-articles': [['lead'], ...ARTICLE_SECTIONS.map(({ key }) => [key, 'body'])],
  'lexicon-terms': TERM_SECTIONS.map(({ key }) => [key, 'body']),
  'lexicon-categories': [],
}

const CATEGORY_COLLECTION: Partial<Record<LibraryCollection, 'article-categories' | 'lexicon-categories'>> =
  {
    'scientific-articles': 'article-categories',
    'lexicon-terms': 'lexicon-categories',
  }

const localeSchema = z.enum(appLocales as [AppLocale, ...AppLocale[]])

function itemSchema(collection: LibraryCollection) {
  const { shared, localized } = SCHEMAS[collection]
  return z
    .object({
      externalId: z.string().trim().min(1).max(100),
      expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
      fields: shared.optional(),
      locales: z
        .record(localeSchema, localized)
        .refine((value) => Object.keys(value).length > 0, 'At least one locale is required.'),
    })
    .strict()
}

type UpsertItem = {
  externalId: string
  expectedUpdatedAt?: string
  fields?: Record<string, unknown>
  locales: Partial<Record<AppLocale, Record<string, unknown>>>
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

type Problem = string

function badRequest(problems: Problem[]): never {
  const shown = problems.slice(0, 30)
  const more = problems.length - shown.length
  throw new APIError(
    `Nothing was written. ${problems.length} problem(s):\n- ${shown.join('\n- ')}${more > 0 ? `\n- …and ${more} more` : ''}`,
    400,
  )
}

export function parseUpsertItems(collection: LibraryCollection, itemsJson: string): UpsertItem[] {
  let raw: unknown
  try {
    raw = JSON.parse(itemsJson)
  } catch {
    badRequest(['itemsJson is not valid JSON.'])
  }

  const parsed = z.array(itemSchema(collection)).min(1).max(MAX_UPSERT_ITEMS).safeParse(raw)
  if (!parsed.success) {
    badRequest(
      parsed.error.issues.map((issue) => `items.${issue.path.join('.')}: ${issue.message}`),
    )
  }
  return parsed.data as UpsertItem[]
}

function label(item: UpsertItem) {
  return `[${item.externalId}]`
}

/** Stable key → id, in one query per related collection. */
async function resolveKeys(
  req: PayloadRequest,
  collection: 'authors' | 'article-categories' | 'lexicon-categories',
  field: 'slug' | 'key',
  values: Set<string>,
): Promise<Map<string, number | string>> {
  if (values.size === 0) return new Map()

  const result = await req.payload.find({
    collection: collection as 'authors',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: false,
    req,
    select: { [field]: true } as never,
    where: { [field]: { in: [...values] } },
  })

  const docs = result.docs as unknown as Array<Record<string, unknown> & { id: number | string }>
  return new Map(docs.map((doc) => [String(doc[field]), doc.id]))
}

async function hubID(req: PayloadRequest, key: string): Promise<number | string> {
  const result = await req.payload.find({
    collection: 'hubs',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    req,
    where: { key: { equals: key } },
  })
  const hub = result.docs[0]
  if (!hub) throw new APIError(`The "${key}" hub does not exist.`, 500)
  return hub.id
}

type Resolved = {
  item: UpsertItem
  id?: number | string
  shared: Record<string, unknown>
  locales: Array<[AppLocale, Record<string, unknown>]>
}

export async function upsertDrafts({
  collection,
  items,
  req,
}: {
  collection: LibraryCollection
  items: UpsertItem[]
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  const problems: Problem[] = []

  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.externalId)) problems.push(`${label(item)} appears twice in this batch.`)
    seen.add(item.externalId)
  }

  // Existing records, by externalId. The main table holds every document, draft
  // or not, and carries the unique index this matching relies on.
  const existing = await req.payload.find({
    collection: collection as 'pillars',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: false,
    req,
    select: { externalId: true, ...(collection === 'lexicon-categories' ? { key: true } : {}) },
    where: { externalId: { in: [...seen] } },
  })
  const idByExternalId = new Map(
    existing.docs.map((doc) => [String((doc as { externalId?: unknown }).externalId), doc.id]),
  )
  const categoryKeyByID = new Map(
    existing.docs.map((doc) => [doc.id, (doc as { key?: unknown }).key]),
  )

  // Hold the rows until the batch commits, so freshness checked here is still
  // true when the write lands.
  if (idByExternalId.size > 0) {
    await lockDocumentRows(req, TABLE[collection], [...idByExternalId.values()])
  }

  // Related records by stable key.
  const authorSlugs = new Set<string>()
  const categoryKeys = new Set<string>()
  for (const { fields } of items) {
    for (const value of (fields?.authors as string[] | undefined) ?? []) authorSlugs.add(value)
    if (typeof fields?.reviewer === 'string') authorSlugs.add(fields.reviewer)
    if (typeof fields?.category === 'string') categoryKeys.add(fields.category)
  }
  const categoryCollection = CATEGORY_COLLECTION[collection]
  const [authorIDs, categoryIDs] = await Promise.all([
    resolveKeys(req, 'authors', 'slug', authorSlugs),
    categoryCollection
      ? resolveKeys(req, categoryCollection, 'key', categoryKeys)
      : Promise.resolve(new Map<string, number | string>()),
  ])
  const missing = (kind: string, keys: Set<string>, found: Map<string, unknown>) =>
    [...keys].filter((key) => !found.has(key)).map((key) => `Unknown ${kind}: "${key}".`)
  problems.push(...missing('author slug', authorSlugs, authorIDs))
  problems.push(...missing('category key', categoryKeys, categoryIDs))

  const resolved: Resolved[] = []
  const batchSlugs = new Map<string, string>()

  for (const item of items) {
    const id = idByExternalId.get(item.externalId)
    const locales = Object.entries(item.locales) as Array<[AppLocale, Record<string, unknown>]>

    if (id === undefined) {
      for (const [locale, data] of locales) {
        if (!data.title || !data.slug) {
          problems.push(`${label(item)} locales.${locale}: title and slug are required to create.`)
        }
      }
      if (collection === 'lexicon-categories' && !item.fields?.key) {
        problems.push(`${label(item)} fields.key is required to create a category.`)
      }
    } else if (
      collection === 'lexicon-categories' &&
      item.fields?.key !== undefined &&
      item.fields.key !== categoryKeyByID.get(id)
    ) {
      problems.push(`${label(item)} fields.key cannot change: it is the category's URL identity.`)
    } else if (!item.expectedUpdatedAt) {
      problems.push(
        `${label(item)} already exists (id ${id}). Pass the expectedUpdatedAt you last read to update it.`,
      )
    } else {
      const current = await req.payload.findByID({
        collection: collection as 'pillars',
        id,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
        select: { updatedAt: true },
      })
      if (current.updatedAt !== item.expectedUpdatedAt) {
        problems.push(
          `${label(item)} changed since it was read (expected ${item.expectedUpdatedAt}, found ${current.updatedAt}). Read it again.`,
        )
      }
    }

    // Relationships and rich text.
    const shared: Record<string, unknown> = { ...item.fields }
    if (Array.isArray(shared.authors)) {
      shared.authors = (shared.authors as string[]).map((value) => authorIDs.get(value))
    }
    if (typeof shared.reviewer === 'string') shared.reviewer = authorIDs.get(shared.reviewer)
    if (typeof shared.category === 'string') shared.category = categoryIDs.get(shared.category)

    const localesOut: Array<[AppLocale, Record<string, unknown>]> = []
    for (const [locale, data] of locales) {
      const out = structuredClone(data)

      for (const path of MARKDOWN_PATHS[collection]) {
        const parent = path.slice(0, -1).reduce<Record<string, unknown> | undefined>(
          (node, key) => node?.[key] as Record<string, unknown> | undefined,
          out,
        )
        const leaf = path.at(-1)!
        const value = parent?.[leaf]
        if (typeof value !== 'string') continue
        try {
          parent![leaf] = markdownToRichText({
            payload: req.payload,
            collection,
            fieldPath: path,
            markdown: value,
          })
        } catch (error) {
          if (!(error instanceof MarkdownError)) throw error
          problems.push(`${label(item)} locales.${locale}.${path.join('.')} ${error.message}`)
        }
      }

      if (typeof out.slug === 'string') {
        const key = `${locale}:${out.slug}`
        const other = batchSlugs.get(key)
        if (other && other !== item.externalId) {
          problems.push(`${label(item)} locales.${locale}.slug "${out.slug}" is also used by [${other}].`)
        }
        batchSlugs.set(key, item.externalId)

        const clash = await req.payload.find({
          collection: collection as 'pillars',
          depth: 0,
          draft: true,
          limit: 1,
          locale,
          pagination: false,
          overrideAccess: false,
          req,
          select: { externalId: true },
          where: {
            and: [
              { slug: { equals: out.slug } },
              ...(id === undefined ? [] : [{ id: { not_equals: id } }]),
            ],
          },
        })
        if (clash.docs.length > 0) {
          problems.push(
            `${label(item)} locales.${locale}.slug "${out.slug}" is taken by id ${clash.docs[0].id}.`,
          )
        }
      }

      localesOut.push([locale, out])
    }

    resolved.push({ item, id, shared, locales: localesOut })
  }

  if (problems.length > 0) badRequest(problems)

  const hubKey = HUB_KEY[collection]
  const hub = hubKey ? await hubID(req, hubKey) : undefined
  const results = []

  for (const { item, id: existingID, shared, locales } of resolved) {
    const [[firstLocale, firstData], ...rest] = locales
    let id = existingID
    const common = {
      collection: collection as 'pillars',
      depth: 0 as const,
      draft: true,
      overrideAccess: false,
      req,
    }

    if (id === undefined) {
      const created = await req.payload.create({
        ...common,
        locale: firstLocale,
        data: {
          ...shared,
          ...firstData,
          ...(hub === undefined ? {} : { hub }),
          externalId: item.externalId,
          _status: 'draft',
        } as never,
      })
      id = created.id
    } else {
      await req.payload.update({
        ...common,
        id,
        locale: firstLocale,
        data: { ...shared, ...firstData } as never,
      })
    }

    for (const [locale, data] of rest) {
      await req.payload.update({ ...common, id, locale, data: data as never })
    }

    const saved = await req.payload.findByID({
      ...common,
      id,
      select: { updatedAt: true },
    })
    results.push({
      externalId: item.externalId,
      id,
      action: existingID === undefined ? 'created' : 'updated',
      locales: locales.map(([locale]) => locale),
      status: 'draft',
      updatedAt: saved.updatedAt,
    })
  }

  return { collection, items: results }
}
