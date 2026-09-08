import type { Field } from 'payload'

/**
 * Header and footer selection.
 *
 * Four fields that were written out four times — Pages, Posts, Hubs, and soon
 * every collection P7 and P8 add. They were already identical apart from one
 * noun in the descriptions, which `Posts/index.ts` acknowledged with the comment
 * "Same shape as the Pages fields of the same names, so the two collections
 * behave identically for editors". A comment asserting two definitions match is
 * the thing this replaces.
 *
 * Shapes are preserved exactly, so adopting this generates no migration. That is
 * also the test: if `migrate:create` produces DDL after a collection switches to
 * these, the shape drifted and the refactor is wrong.
 */
export function chromeFields({
  /** The word used in the descriptions: "page", "article", "hub". */
  noun,
  /**
   * Hubs shipped with terser copy and no description on the hide toggles. Keep
   * that rather than rewriting text in a refactor — a refactor that also edits
   * editor-facing copy is two changes wearing one commit.
   */
  terse = false,
}: {
  noun: string
  terse?: boolean
}): Field[] {
  return [
    {
      name: 'header',
      label: 'Header',
      type: 'relationship',
      relationTo: 'headers',
      required: false,
      admin: {
        description: terse
          ? 'Leave blank to use the site default.'
          : 'Leave blank to use the site default header.',
        position: 'sidebar',
      },
    },
    {
      name: 'hideHeader',
      label: 'Hide Header',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        ...(terse ? {} : { description: `Do not render any header on this ${noun}.` }),
        position: 'sidebar',
      },
    },
    {
      name: 'footer',
      label: 'Footer',
      type: 'relationship',
      relationTo: 'footers',
      required: false,
      admin: {
        description: terse
          ? 'Leave blank to use the site default.'
          : 'Leave blank to use the site default footer.',
        position: 'sidebar',
      },
    },
    {
      name: 'hideFooter',
      label: 'Hide Footer',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        ...(terse ? {} : { description: `Do not render any footer on this ${noun}.` }),
        position: 'sidebar',
      },
    },
  ]
}
