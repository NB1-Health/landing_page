# NB1 Landing Page

Welcome! This doc is written for someone opening this repository for the
first time. It explains what the project is, how the pieces fit together, how
to get it running on your machine, and where to look for specific things
(tracking, deploys, checkout, etc).

> Companion docs: [`DEV_SETUP.md`](DEV_SETUP.md) is a short, day-to-day
> cheat sheet for the local Postgres/migration workflow.
> [`AGENTS.md`](AGENTS.md) is a Payload CMS coding-convention reference aimed
> at AI coding assistants. This file is the one meant to be read
> start-to-finish when you're new here. For generic Payload CMS feature docs
> (not specific to this project), see [payloadcms.com/docs](https://payloadcms.com/docs).

## Contents

1. [What is this project?](#1-what-is-this-project)
2. [The big picture](#2-the-big-picture)
3. [Getting it running locally](#3-getting-it-running-locally)
4. [Repository layout](#4-repository-layout)
5. [Configuration (environment variables)](#5-configuration-environment-variables)
6. [Languages & country detection](#6-languages--country-detection)
7. [How checkout works](#7-how-checkout-works)
8. [Tracking & analytics](#8-tracking--analytics)
9. [Testing](#9-testing)
10. [How deploys work](#10-how-deploys-work)
11. [Database migrations](#11-database-migrations)
12. [Good to know / grab bag](#12-good-to-know--grab-bag)

## 1. What is this project?

This is the website for **NB1**, a health/supplements brand. It's a single
Next.js application that does three jobs at once:

1. **Marketing website** — the public pages (homepage, science/lab pages,
   blog posts, etc), all editable through a CMS admin panel.
2. **Order/checkout funnel** — a multi-step flow where a visitor picks a
   plan, enters shipping/billing details, and pays.
3. **CMS admin panel** — where content editors log in and manage pages,
   posts, navigation, redirects, etc, without touching code.

Note the important boundary: this app **does not** own subscriptions or
payments. When a visitor actually pays, this app forwards the request to a
**separate backend service** (a different codebase, reached over HTTP via
`NEXT_PUBLIC_BACKEND_URL`) that owns Stripe, subscriptions, and order state.
This app's checkout code is mostly UI + a thin proxy in front of that
backend. Keep this in mind — if you're debugging "why didn't my order go
through", the bug is more likely in that other backend than in this repo.

## 2. The big picture

```
                     ┌───────────────────────────────────────────┐
                     │   This repo (Next.js + Payload CMS)        │
                     │                                             │
  visitor  ───────▶  │  Public pages   Checkout UI   CMS admin     │
                     │  (/[locale]/*)  (/order/...)  (/cms/admin)  │
                     │        │              │              │      │
                     └────────┼──────────────┼──────────────┼──────┘
                              │              │              │
                              │              │              ▼
                              │              │      Postgres (content,
                              │              │       pages, redirects...)
                              │              ▼
                              │      External backend (separate
                              │      codebase) — owns Stripe,
                              │      subscriptions, order state
                              ▼
                    Third-party services: Google Tag Manager / GA4,
                    Meta Pixel + Conversions API, Klaviyo (email lead
                    capture), Chatwoot (support chat), Ketch (cookie
                    consent), Firebase (frontend auth), SMTP (email)
```

**Payload CMS**, if you haven't used it before, is a headless CMS that runs
*inside* your Next.js app rather than as a separate hosted product — content
types ("collections", e.g. Pages, Posts, Products) are defined in code
(`src/collections/`), and Payload generates an admin UI and a REST/GraphQL
API for them automatically. In this project the admin UI lives at `/cms/admin`.

## 3. Getting it running locally

You'll need: **Node** `^18.20.2` or `>=20.9.0`, **npm** `>=8`, and **Docker**
(used only to run a local Postgres database — you don't need to containerize
the app itself).

```bash
# 1. Start a local Postgres database in Docker
docker compose up -d postgres

# 2. Create your local env file from the template
cp .env.local.example .env
# open .env and fill in PAYLOAD_SECRET (see step below) — everything else
# already has sane local defaults

# 3. Create the database tables (runs the checked-in migrations)
npm run migrate

# 4. Start the app
npm run dev
```

Then open `http://localhost:3000` in your browser. The app will redirect you
to a locale-prefixed URL like `http://localhost:3000/en` — that's expected,
see [§6](#6-languages--country-detection). The CMS admin panel is at
`http://localhost:3000/cms/admin`; the first time you open it, it'll ask you
to create an admin user (there's no seed admin account).

For `PAYLOAD_SECRET`, generate any random string, e.g.:

```bash
openssl rand -hex 32
```

**Important:** never point your local `.env` at the staging (STG) or
production (PROD) database. `.env.local.example` already defaults to a local
`DATABASE_URL` for exactly this reason. See [`DEV_SETUP.md`](DEV_SETUP.md)
for the full day-to-day workflow of changing the database schema locally.

### Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in dev mode (hot reload) |
| `npm run build` then `npm run start` | Build and run a production build locally |
| `npm run migrate` | Apply any pending database migrations |
| `npm run migrate:create -- --name my-change` | Generate a new migration after you change a collection/global |
| `npm run migrate:status` | See which migrations have/haven't run |
| `npm run db:sync-stg` | Overwrite your **local** DB with a copy of staging's data (useful to get realistic content to develop against) |
| `npm run generate:types` | Regenerate TypeScript types (`src/payload-types.ts`) after changing a collection/global — do this whenever you edit `src/collections/` or `src/globals/` |
| `npm run generate:importmap` | Regenerate Payload's admin panel component registry after adding/moving a custom admin component |
| `npm run lint` / `npm run lint:fix` | Check / fix lint issues |
| `npm test` | Run all tests (see [§9](#9-testing)) |

### Optional: Docker for the app itself

There's a `Dockerfile` and `docker-compose.stg.yml` / `docker-compose.prod.yml`
that can build and run the whole app in a container. In practice, though,
staging and production are **not** deployed this way today — they run
directly on a server via PM2 (a Node.js process manager), as described in
[§10](#10-how-deploys-work). The Docker setup exists but isn't the live path;
don't be surprised if it's slightly behind.

## 4. Repository layout

```
src/
├── app/
│   ├── (frontend)/[locale]/   # Public site — every page URL starts with a locale, e.g. /en/...
│   ├── api/checkout/          # Checkout proxy route (forwards to the external backend)
│   ├── api/meta/              # Receives browser tracking events, forwards to Meta's API
│   └── cms/(payload)/         # The Payload admin panel + its REST/GraphQL API
├── middleware.ts              # Runs on every request: locale detection, redirects
├── payload.config.ts          # The main Payload setup file: collections, database, locales, plugins
├── collections/                # Content types: Pages, Posts, Products, Users, Media, Categories, Authors
├── globals/                    # Site-wide singletons: Navigation, SiteSettings, FAQ
├── blocks/                     # "Layout builder" building blocks editors use to compose a Page.
│                                #   There are a lot of these — this is a large, marketing-heavy site.
├── lib/
│   ├── checkoutApi.ts          # Functions that call the external checkout backend
│   ├── dataLayer.ts            # Helpers for pushing Google Analytics events
│   └── meta/                   # Meta (Facebook) Pixel + server-side tracking helpers
├── components/                  # Shared React components (chat widget, tracking scripts, etc)
├── i18n/                       # List of supported locales + translated text
├── migrations/                 # Database migration files (checked into git — never edit old ones)
└── plugins/index.ts            # Payload plugins in use: redirects, SEO, search, nested categories, forms
scripts/                        # One-off / maintenance scripts (e.g. copying STG data to local)
tests/
├── int/                        # Integration tests (Vitest)
└── e2e/                        # End-to-end browser tests (Playwright)
```

If you're looking for **where a specific page's content structure is
defined**, start in `src/collections/Pages/`. If you're looking for **how a
visual section of a page renders**, look under `src/blocks/<BlockName>/`. If
you're trying to understand **checkout**, start at [§7](#7-how-checkout-works).

## 5. Configuration (environment variables)

Environment files (`.env`, `.env.stg`, `.env.prod`) are git-ignored — only
[`.env.local.example`](.env.local.example) is checked in, as a template you
copy from. Below is what each variable is for, grouped by what it configures.

**Database & Payload core**

| Variable | What it's for |
|---|---|
| `DATABASE_URL` / `DATABASE_URI` | Postgres connection string the app uses day-to-day |
| `DATABASE_URL_DIRECT` | A connection that bypasses PgBouncer (a connection-pooling proxy sitting in front of the production database). Migrations may need this because they can hold locks that a pooled connection cannot sustain. Not needed locally. |
| `PAYLOAD_SECRET` | Random secret Payload uses to sign login tokens. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_SERVER_URL` | This site's own public URL — used for building links, CORS, and image loading |
| `CRON_SECRET` | Lets scheduled jobs (e.g. scheduled publish) authenticate without a logged-in user |
| `NEXT_PUBLIC_PREVIEW_SECRET` | Signs target-bound draft-preview links. Use a random value of at least 32 characters. |
| `PG_POOL_MAX` / `PG_POOL_MAX_BUILD` | Advanced: override how many DB connections the app opens. Rarely needed — see the comment in `payload.config.ts` if curious. |

**Email**

| Variable | What it's for |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM` | Outgoing email (e.g. account emails). Locally you can point these at a tool like Mailpit/Mailtrap. |

**Checkout & payments**

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the external backend that actually owns subscriptions/payments. Checkout requests get forwarded here. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe's publishable (safe-for-browser) key, used only to render the payment form — no payment logic runs in this repo |

**Accounts**

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | Firebase config for frontend user accounts (shares a Firebase project with another NB1 app, "frontend-web") |

**Support chat**

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` / `NEXT_PUBLIC_CHATWOOT_BASE_URL` | Configures the Chatwoot support-chat widget |

**Analytics & marketing tracking** (see [§8](#8-tracking--analytics) for how these are used)

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager / GA4 container ID |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta (Facebook) Pixel ID — used in the browser |
| `META_PIXEL_ID` | Same Pixel ID, used server-side |
| `META_CAPI_ACCESS_TOKEN` | Access token for Meta's server-side Conversions API |
| `META_GRAPH_API_VERSION` | Which version of Meta's Graph API to call |
| `META_TEST_EVENT_CODE` | Marks server-side events as test events in Meta's dashboard — **should only ever be set outside production** |

Note: the **Klaviyo** company ID (email lead-capture, [§8](#8-tracking--analytics))
is currently hardcoded in `src/app/(frontend)/[locale]/layout.tsx` rather than
coming from an environment variable.

Payload's own configuration (which collections exist, which plugins are
enabled, which locales, where the admin panel is mounted) lives in
[`src/payload.config.ts`](src/payload.config.ts), not in environment
variables — that file is the place to look if you want to understand what
the CMS is capable of.

## 6. Languages & country detection

The site supports 8 locales: `en, de, fr, nl, ch, be, uk, uae` (defined in
`src/i18n/config.ts`, and again in `payload.config.ts` so content in the CMS
can be translated per-locale). Every public URL is prefixed with one of
these, e.g. `/de/some-page`.

`src/middleware.ts` runs on every request and decides which locale to send a
visitor to:

- If the URL is already locale-prefixed, it's left alone (other than setting
  currency/country cookies).
- Otherwise, it looks at the visitor's country (from a header set by the
  hosting platform) to guess a locale + currency, unless the visitor already
  has a saved locale preference cookie — that always wins.
- It also checks for old URLs that should redirect elsewhere (the CMS's
  "Redirects" feature) before doing the locale redirect.
- `/cms/*` (the admin panel) is never locale-prefixed.

You don't need to touch this file often, but it's the first place to check
if a page is "redirecting to the wrong language" or "showing the wrong
currency".

## 7. How checkout works

As mentioned in [§1](#1-what-is-this-project), the actual business logic —
pricing, Stripe payment intents, creating the subscription — happens on a
**separate backend**, not in this repo. This app's job in checkout is:

1. Render the multi-step order UI (plan picker, shipping form, payment form,
   confirmation screen) — these are the blocks under
   `src/blocks/checkoutBlocks/*`.
2. Call that external backend to create a payment intent and confirm the
   order. The typed functions for this live in
   [`src/lib/checkoutApi.ts`](src/lib/checkoutApi.ts).
3. Fire tracking events at the right funnel steps (see [§8](#8-tracking--analytics)).

Four payment methods are supported — card, PayPal, Klarna, and SEPA Direct
Debit — all via Stripe.js, wired up in
[`CheckoutForm/Component.client.tsx`](src/blocks/checkoutBlocks/CheckoutForm/Component.client.tsx).
Klarna and PayPal use a Stripe SetupIntent + off-site redirect (the visitor
approves on Klarna's/PayPal's site and is redirected back), so nothing is
charged until the subscription is actually manufactured — the redirect
return handler restores in-flight form data from `sessionStorage`.

One extra wrinkle worth knowing: the final "confirm order" call doesn't go
straight to the external backend from the browser. It goes to this app's own
route, [`src/app/api/checkout/confirm/route.ts`](src/app/api/checkout/confirm/route.ts),
which forwards it to the real backend **and then**, if the visitor consented
to marketing tracking, also reports the purchase to Meta's server-side
Conversions API before responding. It's a small proxy step, but it exists
specifically so that server-side purchase tracking is reliable (it doesn't
depend on the visitor's browser still being open, or an ad-blocker not
interfering).

Plan/pricing content that editors manage lives in the `Products` collection
(`src/collections/Products`) and `src/lib/plans`.

## 8. Tracking & analytics

There's a fair amount of tracking wired up, because marketing needs accurate
conversion data. Here's the map of it. **All of it is gated on cookie
consent** — nothing marketing-related fires until the visitor has consented.

### Consent management: Ketch

[Ketch](https://www.ketch.com/) is the "cookie consent" tool (a "CMP" —
Consent Management Platform) used here. It's loaded by
`src/app/(frontend)/[locale]/KetchScriptLoader.tsx`. Once loaded, other code
checks `window.__nb1Consent?.targeted_advertising` before sending any
marketing event. If you're wondering why a tracking event isn't firing in
dev, check consent first — it's the most common reason.

### Google Tag Manager / GA4

- The GTM/`gtag.js` script itself is injected by
  `src/components/ConditionalGoogleTagManager/index.tsx` (using
  `NEXT_PUBLIC_GTM_ID`). It's skipped on `/cms/admin` pages.
- `src/lib/dataLayer.ts` has the helper functions used everywhere else to
  actually send events: `pushEvent(name, data)` pushes onto `window.dataLayer`,
  which is the array GTM reads from. It also implements **Enhanced
  Conversions** — before sending someone's email/phone/name, it's hashed
  (SHA-256, via the browser's built-in Web Crypto API) so raw PII never
  touches the dataLayer. (Postal code / city / country are sent as-is — that's
  allowed and expected by Google's spec.)
- `src/components/DataLayerEvents/PageViewTracker.tsx` automatically fires a
  `page_view` event on every page change, and a `start_order` event when the
  visitor lands on a URL ending in `/order`.

### Meta (Facebook) Pixel + Conversions API

This one is tracked **twice**, once from the browser (the classic Pixel) and
once from the server (Meta's "Conversions API", or "CAPI") — this is Meta's
recommended setup because browser-only tracking is unreliable with ad
blockers, while server-side tracking alone loses some browser signals. Both
copies of an event share the same `event_id` so Meta can de-duplicate them
into a single event.

- `src/lib/meta/browser.ts` — client-side: reads Meta's tracking cookies,
  checks consent, and sends the event to this app's own
  `/api/meta/events` route.
- `src/app/api/meta/events/route.ts` — receives that and hands it to:
- `src/lib/meta/server.ts` — actually POSTs to Meta's Conversions API, adding
  IP address and browser user-agent server-side (more trustworthy than
  anything the browser reports), with automatic retries on transient errors.
- The **purchase** event is a special case: it's also sent server-to-server
  directly from the checkout confirm route (see [§7](#7-how-checkout-works)),
  independent of whatever happens in the browser.

### Klaviyo (email lead capture)

Used to collect email signups (footer newsletter form, and the `ReserveCta`
landing block) — separate from the transactional/account email sent via SMTP.

- The Klaviyo script + async-queue shim is loaded globally in
  `src/app/(frontend)/[locale]/layout.tsx` (company ID is hardcoded there,
  not an env var).
- `src/Footer/FooterClient.tsx` and
  `src/blocks/newLandingBlocks/ReserveCta/Component.tsx` each render an empty
  `<div class="klaviyo-form-{id}">` that Klaviyo's script fills with an
  embedded form — the form ID differs by locale (a German-specific form vs.
  one for everyone else).
- Both listen for the `klaviyoForms` window event to detect a successful
  submit (deduped via `window.__lastLeadTime`) and optionally redirect
  afterwards.
- Both also push a `klaviyo_form_status` dataLayer event ~3s after mount,
  reporting whether the form actually rendered and whether the script
  loaded — useful as a quick health check if leads seem to be silently
  failing.
- `Footer/config.ts` has a CMS field ("Klaviyo Form (Payload submission)")
  that lets editors attach a Payload form-builder form purely to *log*
  Klaviyo submissions inside the CMS — it doesn't power the actual form.

### Chatwoot (support chat)

`src/components/ChatwootWidget/index.tsx` loads the Chatwoot chat widget
script, and if a visitor is logged in, tells Chatwoot who they are so
support agents see their identity. It also nudges the widget's position so
it doesn't overlap the site's sticky "buy now" bars.

## 9. Testing

- **Integration tests** — `tests/int/*.int.spec.ts`, run with Vitest:
  `npm run test:int`
- **End-to-end tests** — `tests/e2e/*.e2e.spec.ts`, run with Playwright
  (drives a real browser): `npm run test:e2e`
- `npm test` runs both. `test.env` provides the environment variables used
  during test runs.

## 10. How deploys work

There are two environments: **STG** (staging — for internal review) and
**PROD** (production — the live site). Both deploy automatically via GitHub
Actions when the right branch is pushed:

- **Push to `main`** → merged into the `stg` branch → GitHub Actions SSHes
  into the staging server and runs `deploy-stg.sh`, which reinstalls
  dependencies, applies pending database migrations, builds the app, and
  restarts it under PM2 (a process manager that keeps the Node.js app
  running and restarts it if it crashes).
- **Push to `prod`** → merged into the `prod` branch → GitHub Actions verifies
  that the deployment contains no database-copy commands, SSHes into the
  production server, and runs `deploy-prod.sh` (install, migrate, build,
  restart).

Production is the source of truth for editorial content. Editors can draft,
preview, and publish routine content in the production CMS without waiting for
a code deployment. Code and checked-in migrations move through staging and are
then applied to the existing production database; deployments never replace
production content with another environment's data.

Run `npm run deploy:guard` when changing production deployment automation. It
fails if the workflow or deploy script reintroduces staging-database copy or
destructive schema replacement commands.

Neither deploy actually uses the `Dockerfile`/`docker-compose.*.yml` in this
repo, despite them existing — both servers run the app directly via PM2.

## 11. Database migrations

Payload is configured with `push: false` (in `payload.config.ts`), which
means schema changes are **never** applied automatically — they always go
through an explicit, checked-in migration file. If you change a collection
or global (e.g. add a field to `Pages`), you need to:

```bash
npm run migrate:create -- --name add-my-field   # generates a migration file
npm run migrate                                  # applies it to your local DB
```

Commit the generated file(s) in `src/migrations/` along with your code
change. Staging and production each apply pending migrations to their own
existing database during deployment. Migrations must preserve existing content
unless a reviewed data migration explicitly changes it.

Other useful commands: `npm run migrate:status` (see what's pending),
`npm run migrate:down` (rollback the last migration — **local use only**,
never run this against a shared environment).

## 12. Good to know / grab bag

- **This is a big, block-heavy site.** Beyond Payload's standard template
  blocks (Hero, Content, CTA, Archive), `src/blocks/` has dozens of
  purpose-built sections for landing pages, checkout, and "your plan" pages.
  If you need a new page layout, it's usually faster to compose existing
  blocks than to build a new one from scratch — skim `src/blocks/` first.
- **SEO, search, and redirects** are handled by official Payload plugins
  (`plugin-seo`, `plugin-search`, `plugin-redirects`), wired up in
  `src/plugins/index.ts`. Redirects are also checked directly in
  `middleware.ts` before the locale-redirect logic runs.
- **Draft preview & auto-revalidation**: Pages and Posts use Payload's
  Versions/drafts feature, so a new or edited document is saved as a draft
  and isn't visible on the live site until published. A custom URL lets
  editors securely preview a draft before publishing (`NEXT_PUBLIC_PREVIEW_SECRET`
  validates these requests). Because the front-end isn't fully static, an
  `afterChange` hook triggers on-demand revalidation whenever a document's
  status flips to published, so the live pages stay in sync automatically.
- **`patches/` + `postinstall: patch-package`**: at least one npm dependency
  has a manual patch applied automatically after `npm install`. If a
  dependency is behaving oddly after an upgrade, check `patches/*.patch`.
- **`.npmrc` sets `legacy-peer-deps=true`**: expect peer-dependency
  conflicts if this gets removed — it's there on purpose.
