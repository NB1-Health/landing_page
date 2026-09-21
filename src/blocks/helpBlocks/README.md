# Help article blocks

Six blocks that together build a help / FAQ article — kit instructions,
"how do I…" pages, anything that needs steps, callouts and an inline FAQ.
They are the block port of the `NB1_How to _stool_kit` mockup, which is
itself a sibling of the Library Article template: same type system, same
sober look, no gradients, no scroll-reveal, no extra colour.

## Composing a page

Add them in this order, in the page's Content tab:

| # | Block                       | What it is                                                     |
| - | --------------------------- | -------------------------------------------------------------- |
| 1 | **Help: Article Header**    | eyebrow, h1, one-sentence dek, optional "also read", hero photo |
| 2 | **Help: On-page Nav**       | the sticky "On this page" contents rail                        |
| 3 | **Help: Callout**           | optional — a boxed aside before the steps ("Before you start")  |
| 4 | **Help: Steps**             | the numbered body                                              |
| 5 | **Help: Callout**           | optional — a boxed panel after them ("What to never do")        |
| 6 | **Help: Common Questions**  | the accordion                                                  |
| 7 | **Help: CTA Banner**        | the navy support banner                                        |

Only the Callout is optional, and it is the only one that can appear twice. Its
**"Show in the contents rail"** checkbox is what separates its two jobs: on for
a panel the reader should be able to jump to (its heading becomes an `h2` with
`data-help-heading`), off for an aside that only makes sense where it sits.

The site header and footer come from the page's own Header / Footer
relationships as usual — the mockup's breadcrumb + language switcher strip is
deliberately **not** part of this kit.

## Two things that are easy to get wrong

**Step numbers are automatic.** They come from a CSS counter over the steps
array, so reordering steps in the CMS renumbers them. Never type a number into
a step title.

**A step's parts render in a fixed order**, whatever order the fields sit in
inside a step: flow strip → photo (if placed above) → body → code chips → photo
(if placed below) → callouts → example guide → sub-note. A step that needs a
different order is a design request, not a new select.

**The nav rail and the body column are aligned by arithmetic.** Each block is
its own DOM subtree (see `RenderBlocks`), so the rail cannot be a
`position: sticky` sidebar inside the article grid — it is `position: fixed`
and lines itself up with the body column using the constants in
`_shared/layout.ts`. Two consequences:

- Keep **"Leave room for the contents rail"** set the same way on the Steps
  block, the Common Questions block and any Callout, or their body columns will
  not line up.
- If you change a number in `_shared/layout.ts`, change the matching literal in
  `HelpNav`, `HelpSteps`, `HelpFaq` and `HelpCallout` and re-check the alignment
  in a browser.
  The values are literals in each component's styled-jsx on purpose —
  interpolating them would compile a per-instance stylesheet.

The rail builds its list in the browser from every `h2` carrying
`data-help-heading`; the Steps block sets that on each step heading and the
Common Questions block sets it on its own heading. That attribute is the whole
contract between them, so a new block that wants to appear in the rail only has
to render a heading with an `id` and that attribute.

## Editing conventions

Carried over from the mockup's own instructions, worth keeping:

- Write plainly and human, second person, short sentences.
- Bold the one or two words per line that matter most — a quantity, a warning,
  a required action — so a skimming reader can still follow the step. Don't bold
  whole sentences.
- Use a callout for a warning or an aside, not for ordinary emphasis.
- Skip the "what's in the box" photo *or* the checklist, not both: a labelled
  product photo already does the job of a checklist.
- If a page needs a real design treatment, that's a design request, not a
  change to these blocks.

## Seeding the example articles

`npm run seed:help-stool-kit` creates (or updates) the English
"How to use your stool testing kit" page from the original mockup —
`scripts/seed-help-stool-kit.ts`, with the two photos in
`scripts/seed-assets/`. It is idempotent (media matched by filename, page by
slug) and saves the page as a **draft**.

`npm run seed:help-blood-kit` does the same for
"How to use your blood testing kit" (`scripts/seed-help-blood-kit.ts`), from the
blood-kit mockup. Between them they cover the whole content model: the stool
article is the plain case (labelled contents photo, three steps, one code chip),
the blood one exercises everything added for it — the flow strip, two code chips
in one step, photo width and position, the example guide, the sub-note, a parts
list in the lead paragraph, and both uses of the Callout block. Its nineteen
illustrations were extracted from the mockup; the five drop-quality diagrams
were rendered from its inline SVG.

Look in either script for how a step body, a code chip, a callout and an FAQ
answer are actually shaped.

One gotcha it documents: a `linkType: 'custom'` URL inside rich text is
rendered verbatim, so it has to carry its own `/en` prefix. Plain URL fields
(`ctaUrl`, `code.linkUrl`) are the opposite — the components localize those, so
store them unprefixed.

## Schema

Tables: `hnv`, `hhr`, `hst` (+ `hst_st` steps, and per step `hst_st_nt`
callouts, `hst_st_fl` flow frames, `hst_st_cd` code chips, `hst_st_gd` guide
examples), `hcl`, `hfq` (+ `hfq_qs` questions), `hct`, each with `_locales` and
`_v` variants. Created by
`src/migrations/20260904_120000_help_article_blocks.ts` and
`src/migrations/20260921_120000_help_blood_kit_blocks.ts` (the blood-kit wave:
`helpCallout`, the three new step arrays, and `mediaPosition` / `mediaWidth` /
`subnote` on a step).

`steps[].code`, the single code chip, is superseded by `steps[].codes` but still
rendered, so the stool article did not have to be re-seeded. Leave it empty on
new steps.

Every text field is localized, and so is every image field — `helpHero.image`,
`helpSteps.introImage`, `helpSteps.steps[].media`
(`20260904_140000_help_localize_images.ts`), and the newer
`helpSteps.steps[].flow[].image` and `helpSteps.steps[].guide[].image`, which
were localized from the start. Those photos carry baked-in
labels ("WASH HANDS", "Kit box"), so a locale that hasn't had its own version
uploaded shows no image rather than an English one. The step photo falls back
to the grey placeholder box if "Photo placeholder text" is filled in, which
makes a missing translation visible instead of silent.

Worth knowing when localizing an upload field here: the column moves from the
block table into its `_locales` sibling, the FK is renamed onto the locales
table (`hhr_locales_image_id_media_id_fk`), but the **index keeps its
base-table-prefixed name** (`hhr_image_idx`) and just moves. That asymmetry is
Payload's, not ours — `pages.meta.image` is the precedent in this schema.

Two things caught us out here, both worth remembering for the next block:

- **`dbName` replaces the whole table name**, not just the block segment — a
  block with `dbName: 'hst'` gets a table called `hst`, not
  `pages_blocks_hst`. So an array's `dbName` has to be fully qualified
  (`hst_st`), or you end up with a top-level table called `st`.
- **`migrate:create` is not usable in this repo right now.** The last schema
  snapshot in `src/migrations/` is 20260827 and everything since has been a
  hand-written migration, so the generator diffs against a stale snapshot and
  re-emits all that drift. Write the migration by hand, following
  `20260828_120000_customer_reviews_block.ts`.

## Not ported

The mockup's `HowTo` / `FAQPage` JSON-LD is not emitted. `buildPageJsonLd`
currently only produces `WebPage`, and its own comment notes that FAQ rich
snippets were unwired when the legacy `faq` block was dropped. Wiring
`helpSteps` → `HowTo` and `helpFaq` → `FAQPage` (via the existing
`buildFAQPageSchema`) is a separate, self-contained change.
