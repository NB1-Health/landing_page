# The Journal — what was built

A working reference for the content platform added under TICKET-SEO-007: the
collections, the URL scheme, what is generated rather than authored, and the
things that will bite someone who does not know them.

Scope is the Journal and the SEO work around it. The marketing site, checkout and
the influencer pages are untouched by this except where noted.

---

## 1. The one idea

Three **hubs** are the roots of the content platform. Everything else hangs off
them, and a hub is a CMS record — not a route, not a config file.

```
Journal            /en/journal          its own route, not a hub
├── Microbiome     /en/microbiome       hub · key: microbiome
│   └── 10 pillars /en/microbiome/gut-health
├── Research       /en/research         hub · key: research
│   └── articles   /en/research/<slug>
└── Lexicon        /en/lexicon          hub · key: lexicon
    ├── terms      /en/lexicon/<slug>
    └── categories /en/lexicon/topics/<slug>
```

The consequence worth internalising: **create a Hub with a slug in a locale and
that whole branch appears** — in the Discover menu, in the footer, in the Journal
index's hub strip, in the sitemaps. Delete the slug and it all disappears. None of
those places has a hardcoded list.

---

## 2. Collections

Eight new, three extended.

| Collection | What it is | Has a URL? |
|---|---|---|
| `hubs` | The three section roots. `key` is stable, `slug` and `intro` are localized. | `/{locale}/{slug}` |
| `pillars` | The ten Microbiome guides. Long-form, evidence table, FAQ. | `/{locale}/{hub}/{slug}` |
| `lexicon-terms` | Definitions. Three sections, synonyms, related terms. | `/{locale}/{hub}/{slug}` |
| `lexicon-categories` | Groupings for the lexicon browse pages. | `/{locale}/{hub}/{browse}/{slug}` |
| `scientific-articles` | Write-ups of published studies. Seven fixed sections. | `/{locale}/{hub}/{slug}` |
| `article-categories` | Subject labels for scientific articles. | no — a label |
| `disclaimers` | Reusable notices, looked up by `key`. Seven keys. | no |
| `conversion-blocks` | Reusable CTAs, looked up by `key`. Five keys. | no |
| `posts` *(extended)* | The Journal. Gained standfirst, excerpt, read time, primary category, references, localized slug. | `/{locale}/journal/{slug}` |
| `categories` *(extended)* | Journal topic chips. | **no, deliberately** |
| `authors` *(extended)* | Bylines and the medical reviewer. Gained credentials, role, affiliation, profile links. | no |

Topic chips carry no URL on purpose. A `/journal/category/gut-health` page would
compete with the `gut-health` pillar for the same query, so filtering is
client-side and the chips are not links.

### New lexical blocks

`ComplianceNote`, `EvidenceTable`, `HighlightCallout`, `PullQuote`, `StepFlow` —
available in pillar and article bodies.

---

## 3. URLs

Every segment is localized. That is the point of the scheme.

```
/en/microbiome/gut-health
/de/mikrobiom/darmgesundheit
 │   │         └── document slug   localized
 │   └── hub slug                  localized
 └── locale prefix
```

### One route, three collections

`src/app/(frontend)/[locale]/[slug]/[doc]/page.tsx` resolves `[slug]` to a hub,
then branches on its `key`:

```ts
hub.key === 'research' ? 'scientific-articles'
: hub.key === 'lexicon' ? 'lexicon-terms'
: 'pillars'
```

Terms sit **flat** under the lexicon hub rather than nested under a category, so a
term in two categories still has exactly one URL.

### The lexicon's extra level

```
/en/lexicon/topics/bacterial-taxa
/de/glossar/themen/bakterielle-taxa
             └── the browse segment
```

That word is per-locale config (`lexiconBrowseSegment` in `localeConfig.json`):
`topics` / `themen` / `sujets` / `onderwerpen` / `argomenti`.

**Why two route folders.** `topics/` and `themen/` are static folders, not one
dynamic `[browse]` segment. Next refuses two differently-named dynamic segments in
the same position — `[doc]` already occupies it — and fails the build with
`You cannot use different slug names for the same dynamic path ('browse' !== 'doc')`.
A new browse word needs a new four-line folder. Only locales with a Lexicon hub
slug need one.

### The Journal

Its own routes, and `journal` is **not** translated in any locale:

```
/en/journal              index, topic chips, featured slot
/en/journal/page/2       pagination — crawlable, noindex
/en/journal/<slug>       an article
```

### Redirects

`/{locale}/posts/*` and `/{locale}/library/*` 301 to `/{locale}/journal/*` in
middleware. **Every previously indexed post URL moved.**

---

## 4. Localization

Nine locales in `localeConfig.json`: `en de fr nl it ch be uk uae`.

`AppLocale`, `appLocales` and `payloadLocales` are all derived from that one file,
so adding a locale there propagates. Four things do **not** propagate and must be
done by hand:

1. `lexiconBrowseSegment` in the same entry — there is now an import-time check
   that throws if it is missing, because a missing one silently produced
   `/it/lessico/undefined/…`.
2. `src/i18n/dictionaries/<locale>.ts` — full key parity with `en.ts` (285 leaf
   keys). Compare by loading both and diffing paths.
3. `src/i18n/getDictionary.ts` — the import and the `toDictLocale` mapping.
   Without it the locale silently renders English.
4. A Postgres migration adding the locale to the enums (`add_locale_it`).

Every content query sets `fallbackLocale: false`. A locale exists exactly where
content exists — a missing translation is a 404, never a duplicate of the English
page. `npm run check:locales` reports actual coverage from the database.

---

## 5. Generated, not authored

| Thing | Built from |
|---|---|
| Discover → Journal menu | `hubs` + `pillars`, via `journalNav.ts` |
| Footer "Content" column | `hubs`, plus a fixed Journal link |
| Journal index hub strip | `hubs` |
| Language switcher paths | the document's own per-locale slugs |
| Breadcrumbs | the hub trail, `journalTrail.ts` |
| All five new sitemaps | the collections |

No editor retypes `/de/mikrobiom/darmgesundheit` anywhere. Each of these drops a
row that has no slug in the current locale, so a partial translation shortens a
menu rather than adding a 404 to it.

Nav labels are **derived**: `navLabel()` takes the part of a pillar title before
the colon, because "Gut Health: What It Means and What Actually Changes It" is a
headline, not a menu row.

---

## 6. SEO

**Sitemaps** — five new: `hubs`, `pillars`, `lexicon`, `lexicon-categories`,
`research`, all per-locale and listed in the index.

**Structured data** — `Article` and `FAQPage` on pillars, `MedicalWebPage` +
`DefinedTerm` on terms, `DefinedTermSet` + `CollectionPage` on category pages,
`BreadcrumbList` everywhere. Only breadcrumbs, Article and FAQPage produce a rich
result; the rest validate at validator.schema.org. `npm run dump:jsonld` writes
paste-ready files.

**Canonical and hreflang** — every page self-canonicalises; hreflang clusters are
built only from locales where every localized part of the URL exists. Paginated
Journal pages are `follow, noindex` with page 1 canonical.

**Revalidation** — `createHubDocumentRevalidation` is shared by the new
collections. Tags are busted *before* the hub lookup, so a renamed hub still
clears the old paths. Every `unstable_cache` also carries a one-hour TTL, because
a script that publishes content cannot bust a tag.

---

## 7. Content library

`disclaimers` and `conversion-blocks` are keyed records, so the same notice or CTA
is written once and referenced by key.

Keys defined in `src/utilities/libraryQueries.ts`:

- **Disclaimers** — `educational`, `educational-browse`, `health-condition`,
  `claims-note`, `analysis-not-diagnostic`, `wellness-subscription`,
  `not-a-medical-test`
- **Conversion blocks** — `pillar-inline`, `pillar-closing`, `article-footer`,
  `microbiome-analysis`, `condition-analysis`

A page that finds no record for its key renders without that block rather than
breaking.

---

## 8. Seeds, and what the data actually is

```
npm run seed:hubs        3 hubs, en + de
npm run seed:pillars     10 pillars
npm run seed:lexicon     categories + 10 representative terms
npm run seed:lexicon -- --bulk    also fills "taxa" to 436 terms
npm run seed:examples    real example content (below)
npm run seed:journal     3 test-* articles — superseded by seed:examples
```

Each takes `-- --clean`.

**Read this before showing seeded content to anyone.**

- **All pillar and term body copy is placeholder** and says so in every
  paragraph. Deliberate: NB1 is a wellness product, the brief forbids medical
  claims, and seed prose that reads publishable is a liability if it escapes.
- **Pillar slugs and titles are real**, from TICKET-SEO-007 §4.
- **The 436 bulk lexicon terms are generated** — 22 genera × 20 epithets. The
  genus and epithet lists are real vocabulary; most *pairings* name organisms
  that do not exist. `Akkermansia muciniphila` is real, `Akkermansia brevis` is
  not. Do not let these reach a crawlable environment.
- `seed:examples` is the only seed with **real editorial copy**: the five topic
  categories, seven article titles and standfirsts, the claims notice and the
  article CTA, all from `journal-templates/journal-index.reference.html`. Article
  bodies there are still placeholder — that reference is a template with no body
  text in it.

---

## 9. Verification

```
npm run check:seo -- <base-url>   79 assertions, discovers URLs from the site
npm run check:locales             coverage per locale, from the database
npm run dump:jsonld               JSON-LD for the validators
npm run test:int                  includes journal, journalTrail
npm run test:e2e                  journal, hubPillar, internalLinking
```

`check:seo` needs a running server and a real base URL. `check:locales` fails the
build if the default locale has no hub slug — that state silently disables
hreflang on *every* page in *every* locale, not just English.

---

## 10. Still to do

- **Scientific articles: zero records.** The Research hub resolves and lists
  nothing.
- **Six of seven disclaimers, four of five conversion blocks** have no records.
  The missing disclaimers are health and legal notices and need regulatory copy —
  they were deliberately not invented.
- **Real article, pillar and term bodies.** All of it.
- **German Journal slug** — `/de/journal` or `/de/magazin`, undecided.
- **`argomenti/` route folder** if Italian ever gets a Lexicon hub slug.
- **A real device touch test** of the three-level nav cascade.

---

## 11. Things that will bite you

Each of these cost real time to find.

**Postgres `NULL` and `noindex`.** `noindex != true` evaluates to NULL for a row
where the column is NULL, which is not TRUE — so the predicate silently drops
every document whose checkbox was never touched. **Filter `noindex` in JavaScript,
never in a `where` clause.** Every sitemap and query here does.

**`unstable_cache` survives code changes.** No tag covers "the function that built
this value changed". After changing what a cached function *returns*, bump the
version in its key (`lexicon-category-v2`, `journal-nav-v2`) or warm entries keep
serving the old shape indefinitely.

**`revalidateTag` throws outside a Next request.** A global or collection written
by a script or a job will fail the *save* if the hook is unguarded. Wrap it.

**`posts.slug` is localized now** (migration `20260825_135859`). Existing posts
got the one slug copied into every locale, so their URLs are unchanged. **New**
posts auto-generate a per-locale slug from that locale's title — so a translated
post gets `/de/journal/darmgesundheit-grundlagen`, not the English slug. Better for
German SEO, surprising if nobody says so.

**`primaryCategory` is a top-level field**, not `meta.primaryCategory`. It renders
under the Meta tab, but that tab has no `name`, so Payload keeps its data flat.
The `Meta >` in a validation error is the tab's label, not the data path.

**Length caps that only surface as "field is invalid".** `title` 70,
`meta.title` 60, `meta.description` 155, `excerpt` 160. Payload names the field but
not the overage.

**Publishing a Post requires four fields** — standfirst, excerpt, primary
category, author (`requiredOnPublish`). Drafts save freely. Any script or test that
publishes a Post must supply all four, and two of them are relationships needing
their own documents. `source: 'api'` is exempt, but that path runs
`parseApiContent`, which requires `htmlContent` and **reparses it into `content`**.

**Plural forms must all contain `{count}`.** `Intl.PluralRules` picks the form at
runtime, and French puts zero in the `one` category.

**Two differently-named dynamic route segments cannot share a position.** See §3.

**The dictionaries are CRLF.** A regex anchored `{$` will not match `{\r` and will
report sections as missing when they are present. Normalise line endings before any
structural comparison.

**Staging blocks scripted writes.** Cloudflare fronts `stg.nb1.com` and rejects
POST to `/cms/api` from outside; the admin UI works because it is a browser
session. Seed via `payload run` on the box, or an SSH tunnel to `localhost:3000`.
Payload's API is at **`/cms/api`**, not `/api`.
