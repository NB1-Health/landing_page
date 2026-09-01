/**
 * The field set every content document shares.
 *
 * SEO-007 P5. Before this, `publishedAt`, `authors`, `reviewer`, `noindex` and
 * the four chrome fields were written out once per collection — twice for the
 * content types, four times counting Pages and Hubs, and about to become six
 * with the scientific articles and the lexicon. Each copy had drifted slightly:
 * a hook present on one and missing on another, a description rewritten, a
 * `hasMany` stated in one place and inferred in the other.
 *
 * Every factory here reproduces the existing shape exactly, so adopting them
 * produces no DDL. Run `migrate:create` after switching a collection over: if it
 * generates a migration, the shape drifted and the refactor is wrong.
 *
 * Deliberately NOT in here:
 *
 * - `slug` — already shared, as `costomSlugField` in `fields/slug.ts`.
 * - `title` — every collection constrains it differently (Pillars caps at 110
 *   for the two-line card, Posts does not), and a factory with a length option
 *   is just the field again.
 * - `hub` — only documents that live under a hub have one, and each filters
 *   `filterOptions` to a different key. Sharing it would mean passing the whole
 *   definition in as options.
 * - SEO meta — it comes from the `@payloadcms/plugin-seo` field group, which is
 *   already a shared generator.
 */
export { chromeFields } from './chrome'
export {
  authorsField,
  noindexField,
  publishedAtField,
  referencesField,
  reviewedAtField,
  reviewerField,
} from './publication'
