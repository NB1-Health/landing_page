# Payload editorial structure: audit and proposal

## Outcome

The backward-compatible first pilot is implemented without changing the Pages collection or renderer. Existing pages default to `legacy`, all 89 blocks remain editable there, and newly classified Legal or Contact pages receive a one-block approved palette. No block data was moved or rewritten.

## Audit baseline

- One `pages` collection serves every ordinary page, campaign, checkout, legal page, and bespoke long-form story.
- One required `layout` blocks field exposes 89 block types in a single chooser.
- The chooser has no `filterOptions` and the blocks have no chooser groups.
- The schema already reveals natural families: 12 Your Plan blocks, 17 checkout blocks, 5 Biology blocks, 8 Protocol blocks, 10 Lab blocks, plus general landing, homepage/company, legal, contact, FAQ, and shared section blocks.
- Hero is a separate field, while some page families also expose hero blocks inside `layout`. Editors therefore have more than one plausible way to start a page.
- Existing documents have no page-type identity or server-side palette validation.
- Any authenticated user can create, update, and delete Pages. There is no editor/reviewer role split.

The result is high choice cost for ordinary work, easy mixing of incompatible design systems, and no durable indication of which block combinations are supported. The 89-type union also contributes to the expensive full-page query shape documented in the performance baseline.

## Proposed target

Use one renderer-neutral `pageType` value to drive the chooser and validation. Suggested initial types:

| Page type | Intended palette |
| --- | --- |
| `legacy` | All current blocks; compatibility mode for every existing page |
| `standard` | Content, shared marketing sections, FAQ, CTA/close-band blocks |
| `landing` | Approved landing banners, outcomes, steps, proof, pricing, CTA blocks |
| `yourPlan` | The 12 `yp*` blocks plus explicitly approved shared CTA blocks |
| `checkout` | The 17 checkout blocks only |
| `biology` | The five Biology blocks only |
| `protocol` | The eight Protocol blocks only |
| `lab` | The ten Lab blocks only |
| `legal` | `LegalDoc` only |
| `contact` | `ContactPage` only |

The palette is an editorial contract, not a React or Astro contract. Any current or future renderer can consume the same page type and block data.

## Implemented first slice

The pilot uses `pageType` plus Payload's native blocks `filterOptions`:

1. Add a non-localized sidebar select named `pageType`, defaulting to `legacy`.
2. Define one central `allowedBlockSlugsByPageType` map.
3. Set `layout.filterOptions` to return all blocks for `legacy` and only the approved slugs for a selected type. Payload re-evaluates this as form state changes and validates disallowed existing rows on save.
4. Add block chooser groups (`Shared`, `Landing`, `Your Plan`, `Checkout`, `Company`, `Biology`, `Protocol`, `Lab`, `Legal & Support`) without renaming block slugs.
5. Generate a migration that adds only the new page-type column/default. Do not move `layout` data.
6. Pilot only on newly created `legal` and `contact` pages. Leave all existing documents as `legacy` until their real block composition has been audited.

Why this candidate is first: legal and contact already have purpose-built single-page blocks, so their supported palettes are unambiguous. The migration is reversible, and `legacy` keeps every current page editable.

## Independently shippable sequence

1. **Chooser labels/groups — implemented:** organize the 89 choices without changing stored block data.
2. **Page-type pilot — implemented:** add `pageType`, the central palette map, native `filterOptions`, migration, and tests; default all existing pages to `legacy`.
3. **Read-only usage report:** query real Pages and report block types/order per document. No mutations.
4. **Manual classification:** assign a proposed type to each existing page for review; do not write it yet.
5. **One-family adoption:** after approval, migrate one family such as Legal, with preview and regression checks.
6. **Only if justified:** consider fixed fields, separate collections, or removal of legacy blocks after usage reaches zero.

## Next approval

Before adding the proposed `standard`, `landing`, `yourPlan`, `checkout`, `biology`, `protocol`, or `lab` types, review a real block-usage report and approve each palette. Existing documents remain editable in `legacy` mode until then.
