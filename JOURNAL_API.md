# Journal API — publishing pillars and body blocks

How to create, fill and publish Journal content over HTTP. Written for whoever is
building the content pipeline; every JSON shape here is taken from the live field
definitions rather than from an example that once worked.

**Base URL** `https://nb1.com`
**API root** `https://nb1.com/cms/api` — note the `/cms` prefix. `payload.config.ts`
sets `routes: { admin: '/cms/admin', api: '/cms/api' }`, so `POST /api/...` hits a
Next 404 page, not the API.

---

## 1. Authentication

`Users` has `auth: { useAPIKey: true }`. Generate a key on your own user in the
admin (Users → your record → API Key), then send it on every request:

```http
Authorization: users API-Key 1a2b3c4d-5e6f-7890-abcd-ef1234567890
Content-Type: application/json
```

The literal word `users` is the collection slug and is part of the syntax.

Alternatively log in and use the cookie:

```http
POST /cms/api/users/login
{ "email": "editor@nb1.com", "password": "…" }
```

The response sets a `payload-token` cookie which authenticates later requests. Use
this when something upstream has already claimed the `Authorization` header.

> **Staging is different.** `stg.nb1.com` sits behind Cloudflare and nginx Basic
> Auth. Basic Auth takes the `Authorization` header, so the API key cannot be used
> there — log in and use the cookie — and Cloudflare blocks write methods to
> `/cms/api` from outside the network entirely. Production has neither restriction.

### Access

`create`, `update` and `delete` on every collection below require an authenticated
user. `read` returns published documents to anyone and drafts only to an
authenticated user.

---

## 2. Before you can create a pillar

Four ids you need first. Fetch them once and cache them — they do not change.

**The Microbiome hub** — a pillar's `hub` is required and filtered to
`key: 'microbiome'`. Anything else is rejected.

```http
GET /cms/api/hubs?where[key][equals]=microbiome&depth=0
→ { "docs": [ { "id": 1, "key": "microbiome", "slug": "microbiome" } ] }
```

**An author** — required before a pillar can be published.

```http
GET /cms/api/authors?limit=10&depth=0
```

**A hero image** — required before publishing. Uploads are `multipart/form-data`,
not JSON:

```http
POST /cms/api/media
Content-Type: multipart/form-data

file=@hero.jpg
_payload={"alt":"A petri dish of gut bacteria"}
```

`alt` is what a screen reader announces. `heroCaption` on the pillar is a separate,
visible caption — do not use one as the other.

**A disclaimer**, if a body block references the library rather than inlining text:

```http
GET /cms/api/disclaimers?where[key][equals]=claims-note&depth=0
```

---

## 3. Create a pillar

Create as a **draft** first, then publish (§6). A draft accepts a partial document;
publishing enforces the content model.

```http
POST /cms/api/pillars?locale=en&draft=true
```

```json
{
  "_status": "draft",
  "title": "Gut Health: What It Means and What Actually Changes It",
  "slug": "gut-health",
  "hub": 1,
  "standfirst": "What the phrase actually describes, and the handful of things that move it.",
  "heroImage": 42,
  "heroCaption": "Faecalibacterium prausnitzii, one of the more abundant gut species.",
  "content": { "root": { "…": "see §4" } },
  "faq": [
    {
      "question": "Is gut health a medical diagnosis?",
      "answer": "No. It is a general description of how well the digestive system is working."
    }
  ],
  "references": [
    {
      "text": "Rinninella E et al. What is the healthy gut microbiota composition? Microorganisms, 2019.",
      "url": "https://doi.org/10.3390/microorganisms7010014"
    }
  ],
  "authors": [3],
  "reviewer": 5,
  "reviewedAt": "2026-09-01T00:00:00.000Z",
  "relatedResearch": [11, 12],
  "relatedPillars": [7, 9],
  "publishedAt": "2026-09-08T09:00:00.000Z",
  "noindex": false,
  "externalId": "pipeline-pillar-0001"
}
```

### Every field

| Field | Type | Required | Localized | Notes |
|---|---|---|---|---|
| `title` | text | **yes** | yes | Max 110 chars. Real ones run 43–71; German ~8% longer. |
| `slug` | text | auto | yes | Generated from `title` per locale if omitted. Send it explicitly to keep one slug across locales. |
| `hub` | relationship → `hubs` | **yes** | no | Must be the hub whose `key` is `microbiome`. |
| `standfirst` | textarea | on publish | yes | One or two sentences. Also the card summary. |
| `heroImage` | upload → `media` | on publish | no | 16:8. |
| `heroCaption` | text | no | yes | Visible caption. Not alt text. |
| `content` | richText | on publish | yes | §4. Around 1,400 words. |
| `faq` | array, max 5 | no | yes | `question` + `answer`, both required per row. |
| `references` | array | no | yes | `text` + `url`, both required per row. |
| `authors` | relationship → `authors`, hasMany | on publish | no | At least one. |
| `reviewer` | relationship → `authors` | no | no | Renders "Last reviewed". Hidden when empty. |
| `reviewedAt` | date | no | no | ISO 8601. |
| `relatedResearch` | relationship → `scientific-articles`, hasMany | no | no | Empty = strip auto-fills with newest. |
| `relatedPillars` | relationship → `pillars`, hasMany | no | no | Empty = strip auto-fills. |
| `publishedAt` | date | no | no | Stamped on first publish if omitted. Drives `datePublished`. |
| `noindex` | checkbox | no | no | Default `false`. |
| `externalId` | text, unique | no | no | **Set this from the pipeline.** It is how a re-sync updates instead of duplicating. |

Fields that are **not** in the API because they are derived at render time:
breadcrumb, category label, author line, contents list, and both related strips.

---

## 4. The `content` field

Payload rich text is Lexical JSON. The outer shape never varies:

```json
{
  "root": {
    "type": "root",
    "children": [ "…nodes…" ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "version": 1
  }
}
```

### Text

Every property below is required. Omitting `detail`, `mode` or `style` produces a
node the editor cannot open.

```json
{ "type": "text", "text": "Gut health is a description, not a diagnosis.",
  "detail": 0, "format": 0, "mode": "normal", "style": "", "version": 1 }
```

`format` is a bitmask on the text node: `0` plain, `1` bold, `2` italic, `8`
underline. Combine by adding — bold italic is `3`.

### Paragraph

```json
{ "type": "paragraph", "children": [ "…text nodes…" ],
  "direction": "ltr", "format": "", "indent": 0, "textFormat": 0, "version": 1 }
```

### Heading

**Only `h2` and `h3`.** The page's single H1 is the title, and the contents list is
built from H2s. Deeper levels have nowhere to render.

```json
{ "type": "heading", "tag": "h2", "children": [ "…text nodes…" ],
  "direction": "ltr", "format": "", "indent": 0, "version": 1 }
```

### Links

```json
{ "type": "link", "fields": { "linkType": "custom", "url": "/en/microbiome/probiotics", "newTab": false },
  "children": [ "…text nodes…" ], "direction": "ltr", "format": "", "indent": 0, "version": 3 }
```

---

## 5. Body blocks

A block is a node in the same tree. The renderer identifies it by
`type: "block"` plus `fields.blockType` — that pair is what
`src/utilities/lexicalBlocks.ts` walks the tree looking for.

```json
{
  "type": "block",
  "version": 2,
  "format": "",
  "fields": {
    "blockType": "evidenceTable",
    "blockName": ""
  }
}
```

`blockName` is an editor-facing label in the admin sidebar. Send `""`.

> **Verify once against the real thing.** Build one of each block you plan to use
> in the admin, then `GET` that document and compare. Payload owns this
> serialization and node `version` numbers move between releases; the document it
> writes is the authoritative shape, and five minutes there is cheaper than
> debugging a body that saves but will not open.

### Eleven blocks are available in a pillar body

Five were built for the Journal and are documented in full below. The other six
predate it: `keyTakeaways` (`items`, `leadIn`, `explanation`), `dataTable`
(`sectionTitle`, `variant`, `columnHeaders`, `rows`, `highlightColumn`, `caption`),
`ctaBlock` (`conversionBlock`, `body`, `buttonUrl`), `bulletList` (`sectionTitle`,
`items`, `leadIn`, `body`), `expertQuote` (`quote`, `expert`, `expertName`,
`credentials`, `avatar`), `mediaBlock` (`media`).

---

### `evidenceTable`

The comparison table with the five-dot strength rating.

```json
{
  "type": "block", "version": 2, "format": "",
  "fields": {
    "blockType": "evidenceTable",
    "blockName": "",
    "sectionTitle": "What the evidence supports",
    "rows": [
      {
        "claim": "Fibre increases microbial diversity",
        "strength": "4",
        "note": "Consistent across cohorts; effect size varies by baseline diet."
      },
      {
        "claim": "Probiotics repopulate a depleted microbiome",
        "strength": "2",
        "note": "Most strains are transient and do not colonise."
      }
    ],
    "caption": "Ratings reflect the weight of human trial evidence as of 2026."
  }
}
```

| Field | Type | Required | Localized |
|---|---|---|---|
| `sectionTitle` | text | no | yes |
| `rows` | array, 1–12 | **yes** | — |
| `rows[].claim` | text | **yes** | yes |
| `rows[].strength` | select `"1"`–`"5"` | **yes** | no |
| `rows[].note` | textarea | no | yes |
| `caption` | text | no | yes |

`strength` is a **string**, not a number, and only `"1"` to `"5"` are accepted.
The label ("Very limited" … "Strong") is translated at render time — send the
level, never a phrase. It draws as filled dots out of five, so do not put `●●●○○`
in a cell.

---

### `stepFlow`

A numbered sequence, rendered as an `<ol>`.

```json
{
  "type": "block", "version": 2, "format": "",
  "fields": {
    "blockType": "stepFlow",
    "blockName": "",
    "sectionTitle": "Changing your fibre intake without wrecking the week",
    "steps": [
      { "title": "Add one new plant food", "body": "Not five. One, for three days." },
      { "title": "Increase the amount", "body": "Same food, larger portion." },
      { "title": "Add the next one", "body": "Repeat until you are at thirty a week." }
    ]
  }
}
```

| Field | Type | Required | Localized |
|---|---|---|---|
| `sectionTitle` | text | no | yes |
| `steps` | array, **2–8** | **yes** | — |
| `steps[].title` | text | **yes** | yes |
| `steps[].body` | textarea | no | yes |

**Do not put numbers in the titles.** The `<ol>` supplies them; typed digits go
wrong the moment a step is reordered, and a screen reader already announces
"item 3 of 5". One step is rejected — `minRows` is 2.

---

### `highlightCallout`

A single point lifted out of the flow. Use as often as the article needs.

```json
{
  "type": "block", "version": 2, "format": "",
  "fields": {
    "blockType": "highlightCallout",
    "blockName": "",
    "title": "Worth knowing",
    "body": "A stool test measures what leaves the gut, not what lives in the small intestine.",
    "tone": "info"
  }
}
```

| Field | Type | Required | Localized |
|---|---|---|---|
| `title` | text | no | yes |
| `body` | textarea | **yes** | yes |
| `tone` | select `"info"` \| `"caution"` | **yes** | no |

`body` is plain text — no headings, lists or nested blocks. **`caution` is for
genuine "be careful" content**: interactions, dosage, when to see a doctor. Not
for emphasis. Use `info` for that.

---

### `pullQuote`

A line from the article's own prose, set large.

```json
{
  "type": "block", "version": 2, "format": "",
  "fields": {
    "blockType": "pullQuote",
    "blockName": "",
    "quote": "The same supplement does different things in two different guts.",
    "attribution": "",
    "duplicatesBody": true
  }
}
```

| Field | Type | Required | Localized | Default |
|---|---|---|---|---|
| `quote` | textarea | **yes** | yes | — |
| `attribution` | text | no | yes | — |
| `duplicatesBody` | checkbox | no | no | `true` |

**Leave `duplicatesBody` true when the quote repeats a sentence from the body**,
which is the normal case. The renderer then marks it `aria-hidden`, so a sighted
reader gets the emphasis and a listening reader does not hear the sentence twice.
Set it `false` only when the line appears nowhere else.

For a named person speaking, use `expertQuote` instead — that one carries an
author relationship, credentials and an avatar. A pull quote with an
`attribution` is still not an attributed quote.

---

### `complianceNote`

The standing wellness-not-medicine framing.

Three ways to fill it, in resolution order:

```json
// 1. From the library — preferred
{ "type": "block", "version": 2, "format": "",
  "fields": { "blockType": "complianceNote", "blockName": "", "disclaimer": 4 } }

// 2. Per-article override — ignored if `disclaimer` is set
{ "type": "block", "version": 2, "format": "",
  "fields": { "blockType": "complianceNote", "blockName": "",
              "text": "This article discusses research in progress, not established practice." } }

// 3. Neither — the standard translated disclaimer from the dictionary
{ "type": "block", "version": 2, "format": "",
  "fields": { "blockType": "complianceNote", "blockName": "" } }
```

| Field | Type | Required | Localized |
|---|---|---|---|
| `disclaimer` | relationship → `disclaimers` | no | no |
| `text` | textarea | no | yes |

**Prefer option 1.** A wording change from legal then means editing one record
rather than sweeping every document in every language. `disclaimer` wins over
`text` when both are present.

A pillar gets a compliance note automatically if the body contains none — so
adding one is only necessary to control *where* it appears.

---

## 6. Publishing

`_status` is `"draft"` or `"published"`, and it is **localized** — a document can
be live in English and draft in German.

Publish one locale:

```http
PATCH /cms/api/pillars/17?locale=en&publishSpecificLocale=en
{ "_status": "published" }
```

### What publishing enforces

Four fields are optional on a draft and required to publish a pillar:

```
standfirst · heroImage · content · authors
```

Fail any and you get HTTP 400:

```json
{ "errors": [ { "label": "Standfirst", "path": "standfirst",
                "message": "Standfirst is required before publishing." } ] }
```

> Posts have a `source: "api"` escape from these checks. **Pillars do not** — the
> collection has no `source` field, so the exemption can never apply. A pillar
> needs all four, every time.

### Scheduled publishing

`schedulePublish` is enabled on the collection, so a future `publishedAt` with a
scheduled job will publish on time.

---

## 7. Locales

Nine locales: `en de fr nl it ch be uk uae`.

**One request per locale.** The `?locale=` parameter decides which translation
you are writing; localized fields in the body apply to that locale only.

```http
PATCH /cms/api/pillars/17?locale=de
{
  "title": "Darmgesundheit: Was der Begriff bedeutet und was ihn verändert",
  "slug": "darmgesundheit",
  "standfirst": "Was der Begriff tatsächlich beschreibt …",
  "content": { "root": { "…": "the German body" } }
}
```

Non-localized fields (`hub`, `heroImage`, `authors`, `reviewer`, `noindex`,
`externalId`, and every `select` and `checkbox` inside a block) are shared. Writing
them under `?locale=de` overwrites them for all locales.

**`slug` is localized, and auto-generates from that locale's `title` if you omit
it.** So a German pillar with no slug gets `darmgesundheit-was-der-begriff…`. Send
the slug you want.

Reading back is the same parameter, plus one worth knowing:

```http
GET /cms/api/pillars/17?locale=de&fallbackLocale=false
```

`fallbackLocale=false` matches how the site reads content. Without it you get
English text back and cannot tell what is actually translated.

To fetch every locale at once for a diff:

```http
GET /cms/api/pillars/17?locale=all&depth=0
```

---

## 8. Errors you will actually hit

| Status | Body | Cause |
|---|---|---|
| 404 | Next HTML page | Used `/api/…` instead of `/cms/api/…` |
| 403 | HTML error page | Cloudflare on staging blocking a write. Not an auth problem — production is unaffected |
| 401 | JSON | Bad or missing API key. On staging, may be nginx Basic Auth instead |
| 400 | `errors[]` with `path` | Validation. The four publish-gated fields, or a length cap |
| 400 | `The following field is invalid: Hub` | `hub` is not the Microbiome hub |
| 500 | — | Malformed Lexical JSON. Usually a text node missing `detail`, `mode` or `style` |

### Length caps that report only as "field is invalid"

| Field | Max |
|---|---|
| `pillars.title` | 110 |
| `posts.title` | 70 |
| `meta.title` | 60 |
| `meta.description` | 155 |
| `posts.excerpt` | 160 |
| `article-categories.title` | 80 |

Payload names the field but not the overage. Measure before sending.

---

## 9. Quick reference

```
GET    /cms/api/hubs?where[key][equals]=microbiome
GET    /cms/api/authors
POST   /cms/api/media                      multipart/form-data
POST   /cms/api/pillars?locale=en&draft=true
PATCH  /cms/api/pillars/{id}?locale=de
PATCH  /cms/api/pillars/{id}?locale=en&publishSpecificLocale=en
GET    /cms/api/pillars/{id}?locale=all&depth=0
DELETE /cms/api/pillars/{id}
```

Block types available in a pillar body:

```
evidenceTable · stepFlow · highlightCallout · pullQuote · complianceNote
keyTakeaways · dataTable · ctaBlock · bulletList · expertQuote · mediaBlock
```

Sibling collections take the same shapes: `lexicon-terms` and
`scientific-articles` are also hub documents with a `hub` relationship, a
localized slug and the same publish gating. `posts` differ — they live at
`/{locale}/journal/{slug}`, have no `hub`, and do accept `source: "api"`.
