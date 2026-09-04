# Help article blocks

Five blocks that together build a help / FAQ article — kit instructions,
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
| 3 | **Help: Steps**             | the numbered body                                              |
| 4 | **Help: Common Questions**  | the accordion                                                  |
| 5 | **Help: CTA Banner**        | the navy support banner                                        |

The site header and footer come from the page's own Header / Footer
relationships as usual — the mockup's breadcrumb + language switcher strip is
deliberately **not** part of this kit.

## Two things that are easy to get wrong

**Step numbers are automatic.** They come from a CSS counter over the steps
array, so reordering steps in the CMS renumbers them. Never type a number into
a step title.

**The nav rail and the body column are aligned by arithmetic.** Each block is
its own DOM subtree (see `RenderBlocks`), so the rail cannot be a
`position: sticky` sidebar inside the article grid — it is `position: fixed`
and lines itself up with the body column using the constants in
`_shared/layout.ts`. Two consequences:

- Keep **"Leave room for the contents rail"** set the same way on the Steps
  block and the Common Questions block, or their two columns will not line up.
- If you change a number in `_shared/layout.ts`, change the matching literal in
  `HelpNav`, `HelpSteps` and `HelpFaq` and re-check the alignment in a browser.
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

## Schema

Tables: `hnv`, `hhr`, `hst` (+ `hst_st` steps, `hst_st_nt` callouts), `hfq`
(+ `hfq_qs` questions), `hct`, each with `_locales` and `_v` variants. Created
by `src/migrations/20260904_120000_help_article_blocks.ts`.

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
