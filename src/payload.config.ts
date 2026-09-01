import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import {
  type Access,
  buildConfig,
  type CollectionConfig,
  type GlobalConfig,
  PayloadRequest,
  type Where,
} from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footers } from './Footer/config'
import { Headers } from './Header/config'
import { Hubs } from './collections/Hubs'
import { Pillars } from './collections/Pillars'
import { ConversionBlocks } from './collections/ConversionBlocks'
import { Disclaimers } from './collections/Disclaimers'
import { ScientificArticles } from './collections/ScientificArticles'
import { ArticleCategories } from './collections/ArticleCategories'
import { LexiconCategories } from './collections/LexiconCategories'
import { LexiconTerms } from './collections/LexiconTerms'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { Products } from './collections/Products'
import { Authors } from './collections/Authors'
import { FAQ } from './globals/FAQ'
import { defaultLocale, payloadLocales } from './i18n/config'
import { AgentOperations } from './collections/AgentOperations'
import { adminOnly, adminOrEditor, isAdmin, isEditor } from './access/roles'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
// `next build` prerenders pages in several parallel worker processes, each of
// which imports this config and opens its OWN Postgres pool. A large per-pool
// max × worker count can exhaust the DB connection limit ("sorry, too many
// clients already"). So use a small pool during the build phase; the long-lived
// runtime server (single PM2 fork process) gets the full pool.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'
const pgPoolDefault = isNextBuild ? 2 : 10
const pgPoolEnv = isNextBuild ? process.env.PG_POOL_MAX_BUILD : process.env.PG_POOL_MAX
const pgPoolParsed = Number(pgPoolEnv ?? pgPoolDefault)
const pgPoolMax = Number.isFinite(pgPoolParsed) && pgPoolParsed > 0 ? pgPoolParsed : pgPoolDefault
const adminManagedCollectionAccess = {
  admin: adminOnly,
  create: adminOnly,
  delete: adminOnly,
  read: adminOnly,
  readVersions: adminOnly,
  unlock: adminOnly,
  update: adminOnly,
}
const adminOrOwnLock: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true
  if (!user || user.collection !== 'users' || !isEditor(user)) return false
  const ownLock: Where = {
    and: [{ 'user.value': { equals: user.id } }, { 'user.relationTo': { equals: 'users' } }],
  }
  return ownLock
}
const editorLockAccess = {
  admin: adminOnly,
  create: adminOnly,
  delete: adminOrOwnLock,
  read: adminOrEditor,
  readVersions: adminOnly,
  unlock: adminOnly,
  update: adminOnly,
}
const hiddenFromNonAdmins = ({ user }: { user: unknown }) => !isAdmin(user)
const hideCollectionFromNonAdmins = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  admin: { ...collection.admin, hidden: hiddenFromNonAdmins },
})
const hideGlobalFromNonAdmins = (global: GlobalConfig): GlobalConfig => ({
  ...global,
  admin: { ...global.admin, hidden: hiddenFromNonAdmins },
})
export default buildConfig({
  // Canonical absolute URL for this deployment. Without it Payload falls back to
  // an empty serverURL and logs "Failed to create URL object from URL: , falling
  // back to http://localhost" on server-side requests that lack an origin header.
  serverURL: getServerSideURL(),
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, 'app', 'cms', '(payload)', 'admin', 'importMap.js'),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: defaultLexical,
  experimental: {
    localizeStatus: true,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: pgPoolMax,
      min: 0,
      idleTimeoutMillis: isNextBuild ? 1000 : 30000,
      // Generous connect timeout. `payload migrate` and cold starts need time to
      // establish a connection to the managed DB; cutting this to 10s can make
      // deploys fail at the migrate step when the DB is briefly slow to accept.
      connectionTimeoutMillis: 30000,
      // Recycle connections periodically (managed PG drops idle ones server-side).
      maxUses: 7500,
      // NOTE: statement_timeout / idle_in_transaction_session_timeout are set at
      // the DATABASE level (ALTER DATABASE payload_stg SET ...), NOT via the libpq
      // `options` startup param. The DO connection pool (DATABASE_URL) is PgBouncer
      // in transaction mode, which rejects unknown startup parameters and drops the
      // connection. DB-level settings apply on every path (pooled or direct).
    },
    push: false,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    // origin/main hides the operational collections from non-admins in the
    // admin UI. Kept as-is.
    hideCollectionFromNonAdmins(Categories),
    Users,
    hideCollectionFromNonAdmins(Products),
    hideCollectionFromNonAdmins(Authors),
    hideCollectionFromNonAdmins(Headers),
    hideCollectionFromNonAdmins(Footers),
    AgentOperations,
    // The Journal collections are deliberately NOT wrapped. They are editorial
    // content — an editor who cannot see Hubs, Pillars or LexiconTerms cannot do
    // the job the Journal exists for. The wrapper is for operational config
    // (products, headers, footers), not for the things editors write.
    Hubs,
    Pillars,
    // Keyed content library (SEO-007 P5). Referenced by the ComplianceNote and
    // CtaBlock lexical blocks rather than each document holding its own copy.
    Disclaimers,
    ConversionBlocks,
    ArticleCategories,
    ScientificArticles,
    LexiconCategories,
    LexiconTerms,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  folders: {
    collectionOverrides: [
      ({ collection }) => ({
        ...collection,
        access: { ...adminManagedCollectionAccess, read: adminOrEditor },
      }),
    ],
  },
  globals: [
    hideGlobalFromNonAdmins(Navigation),
    hideGlobalFromNonAdmins(SiteSettings),
    hideGlobalFromNonAdmins(FAQ),
  ],
  plugins,
  onInit: (payload) => {
    // The MCP plugin uses its key hash directly at /mcp. Its generated key
    // collection must not also authenticate against Payload's generic API.
    payload.authStrategies = payload.authStrategies.filter(
      ({ name }) => name !== 'payload-mcp-api-keys-api-key',
    )
    const lockedDocuments = payload.collections['payload-locked-documents']?.config
    if (lockedDocuments) lockedDocuments.access = editorLockAccess
  },
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  // File upload (express-fileupload) options. Raise the size ceiling so larger
  // media (e.g. video) uploads aren't rejected. The actual upload fix is the
  // middleware matcher excluding `/cms` (see src/middleware.ts) — without that
  // Next.js capped the request body at 10MB. NOTE: do NOT enable `useTempFiles`
  // here — in this setup it persists 0-byte files to the static dir.
  upload: {
    limits: {
      fileSize: 512 * 1024 * 1024, // 512 MB
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      cancel: ({ req }: { req: PayloadRequest }): boolean => isAdmin(req.user),
      queue: ({ req }: { req: PayloadRequest }): boolean => isAdmin(req.user),
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (isAdmin(req.user)) return true
        const cronSecret = process.env.CRON_SECRET
        if (!cronSecret) return false
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${cronSecret}`
      },
    },
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      access: adminManagedCollectionAccess,
    }),
    tasks: [],
  },
  localization: {
    locales: payloadLocales,
    defaultLocale,
    defaultLocalePublishOption: 'active',
    fallback: true,
  },
  routes: {
    admin: '/cms/admin',
    api: '/cms/api',
  },
})
