import type { PayloadRequest } from 'payload'
import { z } from 'zod'

import { appLocales, type AppLocale } from '@/i18n/config'
import {
  assertAgentRequest,
  clonePageDraft,
  createPostDraft,
  findContent,
  getContent,
  parsePagePatch,
  patchPageDraft,
  requireLocale,
  setContentTrashState,
  updatePostDraft,
  uploadMedia,
} from '@/mcp/contentOperations'
import { runIdempotentMutation } from '@/mcp/runIdempotentMutation'
import { commitBulkDrafts, planBulkDrafts } from '@/mcp/bulkDrafts'
import { LIBRARY_COLLECTIONS } from '@/mcp/libraryCollections'
import { MAX_UPSERT_ITEMS, parseUpsertItems, upsertDrafts } from '@/mcp/libraryOperations'

const localeSchema = z.enum(appLocales as [AppLocale, ...AppLocale[]])
const idSchema = z.union([z.number().int().positive(), z.string().trim().min(1).max(64)])
const idempotencySchema = z.string().trim().min(1).max(128)
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(70)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.')
const updatedAtSchema = z.string().datetime({ offset: true })
const relationshipIDsSchema = z.array(idSchema).max(50)
const readableCollectionSchema = z.enum(['pages', 'posts', ...LIBRARY_COLLECTIONS])

const createPostFields = {
  authorIDs: relationshipIDsSchema.optional(),
  categoryIDs: relationshipIDsSchema.optional(),
  contentHtml: z.string().trim().min(1).max(250_000),
  focusKeyword: z.string().trim().max(100).optional(),
  heroImageID: idSchema.optional(),
  introHtml: z.string().trim().min(1).max(25_000),
  metaDescription: z.string().trim().min(1).max(155),
  metaTitle: z.string().trim().min(1).max(60),
  slug: slugSchema,
  subtitle: z.string().trim().max(180).optional(),
  title: z.string().trim().min(1).max(70),
}

const postPatchSchema = z
  .object({
    authorIDs: relationshipIDsSchema.optional(),
    categoryIDs: relationshipIDsSchema.optional(),
    contentHtml: z.string().trim().min(1).max(250_000).optional(),
    focusKeyword: z.string().trim().max(100).nullable().optional(),
    heroImageID: idSchema.nullable().optional(),
    introHtml: z.string().trim().min(1).max(25_000).optional(),
    metaDescription: z.string().trim().min(1).max(155).optional(),
    metaTitle: z.string().trim().min(1).max(60).optional(),
    slug: slugSchema.optional(),
    subtitle: z.string().trim().max(180).nullable().optional(),
    title: z.string().trim().min(1).max(70).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Patch must change at least one field.')

function jsonContent(value: unknown) {
  return {
    content: [{ text: JSON.stringify(value), type: 'text' as const }],
  }
}

function defineTool<TShape extends z.ZodRawShape>(
  name: string,
  description: string,
  parameters: TShape,
  run: (args: z.infer<z.ZodObject<TShape>>, req: PayloadRequest) => Promise<unknown>,
) {
  const schema = z.object(parameters).strict()
  return {
    description,
    handler: async (rawArgs: Record<string, unknown>, req: PayloadRequest) => {
      assertAgentRequest(req)
      return jsonContent(await run(schema.parse(rawArgs), req))
    },
    name,
    parameters,
  }
}

const findContentTool = defineTool(
  'find_content',
  'Find Pages, Posts, or content library documents (pillars, scientific-articles, lexicon-terms, lexicon-categories) in one explicit locale. Returns compact draft-aware results; never returns trashed content. Library results also carry externalId and the public path, and page up to 100 at a time for building internal links.',
  {
    collection: readableCollectionSchema,
    externalId: z.string().trim().min(1).max(100).optional(),
    limit: z.number().int().min(1).max(100).default(10),
    locale: localeSchema,
    page: z.number().int().min(1).default(1),
    search: z.string().trim().max(100).optional(),
  },
  async (args, req) => findContent({ ...args, locale: requireLocale(args.locale), req }),
)

const getContentTool = defineTool(
  'get_content',
  'Read one Page, Post, or content library draft in one explicit locale before editing it. Use its updatedAt value for optimistic locking.',
  {
    collection: readableCollectionSchema,
    id: idSchema,
    locale: localeSchema,
  },
  async (args, req) => getContent({ ...args, locale: requireLocale(args.locale), req }),
)

const createPostDraftTool = defineTool(
  'create_post_draft',
  'Create a validated blog Post draft from constrained HTML. This cannot publish.',
  {
    ...createPostFields,
    idempotencyKey: idempotencySchema,
    locale: localeSchema,
  },
  async ({ idempotencyKey, locale, ...input }, req) =>
    runIdempotentMutation({
      args: { ...input, locale },
      idempotencyKey,
      locale,
      req,
      targetCollection: 'posts',
      tool: 'create_post_draft',
      run: async () => {
        const result = await createPostDraft({ input, locale: requireLocale(locale), req })
        return { result, targetIDs: [result.id] }
      },
    }),
)

const updatePostDraftTool = defineTool(
  'update_post_draft',
  'Update selected fields on a blog Post draft. Requires the last-read updatedAt and cannot publish.',
  {
    expectedUpdatedAt: updatedAtSchema,
    id: idSchema,
    idempotencyKey: idempotencySchema,
    locale: localeSchema,
    patch: postPatchSchema,
  },
  async ({ idempotencyKey, ...args }, req) =>
    runIdempotentMutation({
      args,
      idempotencyKey,
      locale: args.locale,
      req,
      targetCollection: 'posts',
      tool: 'update_post_draft',
      run: async () => {
        const result = await updatePostDraft({
          ...args,
          locale: requireLocale(args.locale),
          req,
        })
        return { result, targetIDs: [result.id] }
      },
    }),
)

const clonePageDraftTool = defineTool(
  'clone_page_draft',
  'Clone an existing Page template into a new draft for one locale, replacing title and slug. This cannot publish.',
  {
    idempotencyKey: idempotencySchema,
    locale: localeSchema,
    slug: slugSchema,
    sourcePageID: idSchema,
    title: z.string().trim().min(1).max(120),
  },
  async ({ idempotencyKey, ...args }, req) =>
    runIdempotentMutation({
      args,
      idempotencyKey,
      locale: args.locale,
      req,
      targetCollection: 'pages',
      tool: 'clone_page_draft',
      run: async () => {
        const result = await clonePageDraft({
          ...args,
          locale: requireLocale(args.locale),
          req,
        })
        return { result, targetIDs: [result.id] }
      },
    }),
)

const patchPageDraftTool = defineTool(
  'patch_page_draft',
  'Patch title, slug, SEO meta, or bounded copy fields on existing landing blocks in a Page draft. copyEdits uses [{blockID, blockType, patch: {field: plainText}}] with IDs from get_content and cannot change variants, links, media, IDs, or order. Requires updatedAt; raw layout, hero, system, and publish fields are rejected.',
  {
    expectedUpdatedAt: updatedAtSchema,
    id: idSchema,
    idempotencyKey: idempotencySchema,
    locale: localeSchema,
    patchJson: z.string().trim().min(2).max(250_000),
  },
  async ({ idempotencyKey, patchJson, ...args }, req) =>
    runIdempotentMutation({
      args: { ...args, patchJson },
      idempotencyKey,
      locale: args.locale,
      req,
      targetCollection: 'pages',
      tool: 'patch_page_draft',
      run: async () => {
        const result = await patchPageDraft({
          ...args,
          locale: requireLocale(args.locale),
          patch: parsePagePatch(patchJson),
          req,
        })
        return { result, targetIDs: [result.id] }
      },
    }),
)

const uploadMediaTool = defineTool(
  'upload_media',
  'Upload one validated image for use in Page or Post drafts. Accepts JPEG, PNG, WebP, or GIF base64 with a bounded size.',
  {
    alt: z.string().trim().min(1).max(300),
    base64: z.string().min(4).max(35_000_000),
    filename: z.string().trim().min(1).max(120),
    idempotencyKey: idempotencySchema,
    locale: localeSchema,
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  },
  async ({ idempotencyKey, ...args }, req) =>
    runIdempotentMutation({
      args,
      idempotencyKey,
      locale: args.locale,
      req,
      targetCollection: 'media',
      tool: 'upload_media',
      run: async () => {
        const result = await uploadMedia({
          ...args,
          locale: requireLocale(args.locale),
          req,
        })
        return { result, targetIDs: [result.id] }
      },
    }),
)

const planBulkDraftsTool = defineTool(
  'plan_bulk_drafts',
  'Validate and stage up to 20 Page/Post draft operations. Returns a plan for an admin to approve; it makes no content changes.',
  {
    idempotencyKey: idempotencySchema,
    itemsJson: z.string().trim().min(2).max(250_000),
    locale: localeSchema,
  },
  async (args, req) => planBulkDrafts({ ...args, req }),
)

const commitBulkDraftsTool = defineTool(
  'commit_bulk_drafts',
  'Atomically execute an approved, unexpired bulk draft plan. Every item remains a draft and failures roll back the batch.',
  {
    idempotencyKey: idempotencySchema,
    planID: idSchema,
  },
  async (args, req) => commitBulkDrafts({ ...args, req }),
)

const upsertDraftsTool = defineTool(
  'upsert_drafts',
  [
    `Create or update up to ${MAX_UPSERT_ITEMS} content library drafts, matched on externalId. Cannot publish. The batch is all-or-nothing and counts as one write.`,
    'itemsJson is a JSON array of {externalId, expectedUpdatedAt?, fields?, locales: {en: {...}, de: {...}}}. One item is one document with all its locales.',
    '`fields` holds non-translated values; categories by key, authors and reviewer by author slug. The hub is set from the collection.',
    'Rich-text fields (pillar content, article lead and section bodies, lexicon section bodies) take markdown; lists must be "- **Lead-in.** Body" and become bullet-list blocks.',
    'Creating requires title and slug in every locale. Updating an existing record requires the updatedAt you last read as expectedUpdatedAt.',
  ].join(' '),
  {
    collection: z.enum(LIBRARY_COLLECTIONS),
    idempotencyKey: idempotencySchema,
    itemsJson: z.string().trim().min(2).max(1_000_000),
  },
  async ({ collection, idempotencyKey, itemsJson }, req) => {
    const items = parseUpsertItems(collection, itemsJson)
    return runIdempotentMutation({
      args: { collection, itemsJson },
      idempotencyKey,
      req,
      targetCollection: collection,
      tool: 'upsert_drafts',
      run: async () => {
        const result = await upsertDrafts({ collection, items, req })
        return { result, targetIDs: result.items.map(({ id }) => id) }
      },
    })
  },
)

function trashTool(action: 'restore' | 'trash') {
  const name = action === 'trash' ? 'trash_content' : 'restore_content'
  const description =
    action === 'trash'
      ? 'Soft-trash one draft Page or Post, or one unused, unmodified Media document uploaded through MCP, with an updatedAt check. Published Pages and Posts and other Media require an admin workflow; nothing is permanently deleted.'
      : 'Restore one trashed Page or Post, or one still-eligible Media document uploaded through MCP, with an updatedAt check; nothing is permanently deleted.'
  return defineTool(
    name,
    description,
    {
      collection: z.enum(['media', 'pages', 'posts']),
      expectedUpdatedAt: updatedAtSchema,
      id: idSchema,
      idempotencyKey: idempotencySchema,
      locale: localeSchema,
    },
    async ({ idempotencyKey, ...args }, req) =>
      runIdempotentMutation({
        args,
        idempotencyKey,
        locale: args.locale,
        req,
        targetCollection: args.collection,
        tool: name,
        run: async () => {
          const result = await setContentTrashState({
            ...args,
            action,
            locale: requireLocale(args.locale),
            req,
          })
          return { result, targetIDs: [result.id] }
        },
      }),
  )
}

export const agentMcpTools = [
  findContentTool,
  getContentTool,
  createPostDraftTool,
  updatePostDraftTool,
  clonePageDraftTool,
  patchPageDraftTool,
  uploadMediaTool,
  planBulkDraftsTool,
  commitBulkDraftsTool,
  upsertDraftsTool,
  trashTool('trash'),
  trashTool('restore'),
]
