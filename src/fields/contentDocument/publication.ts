import type { Field } from 'payload'

import { isPublishedForActiveLocale } from '@/utilities/publishedLocaleAvailability'
import { requiredOnPublish } from '@/collections/Posts/hooks/requiredOnPublish'

/**
 * Publication date, stamped on first publish.
 *
 * The hook only fills an empty value, so an editor can backdate an article and a
 * later save will not overwrite it. `isPublishedForActiveLocale` rather than a
 * plain `_status === 'published'` check because status is localized: publishing
 * the German version of a document that is still a draft in English is a publish.
 *
 * Posts had this hook and Pillars did not — a pillar published without a date
 * silently emitted no `datePublished` in its Article schema. Adopting the shared
 * field fixes that, and adds no column.
 */
export function publishedAtField(): Field {
  return {
    name: 'publishedAt',
    type: 'date',
    admin: {
      date: { pickerAppearance: 'dayAndTime' },
      position: 'sidebar',
    },
    hooks: {
      beforeChange: [
        ({ req, siblingData, value }) => {
          if (isPublishedForActiveLocale(siblingData._status, req.locale) && !value) {
            return new Date()
          }
          return value
        },
      ],
    },
  }
}

/**
 * Byline authors. Required to publish, not required to save — a draft in progress
 * should not be blocked on deciding who signs it.
 */
export function authorsField(): Field {
  return {
    name: 'authors',
    type: 'relationship',
    admin: { position: 'sidebar' },
    hasMany: true,
    relationTo: 'authors',
    validate: requiredOnPublish('Author'),
  }
}

/**
 * The optional medical reviewer.
 *
 * Optional in the field and load-bearing in the output: it renders the "Reviewed
 * by" line, which is the E-E-A-T signal on health content. Hidden entirely when
 * empty rather than rendering an empty label.
 */
export function reviewerField({ description }: { description?: string } = {}): Field {
  return {
    name: 'reviewer',
    type: 'relationship',
    relationTo: 'authors',
    hasMany: false,
    admin: {
      position: 'sidebar',
      description:
        description ??
        'Optional. Renders the "Reviewed by" line in the byline, which reinforces E-E-A-T on health content. The line is hidden when this is empty.',
    },
  }
}

/**
 * When the reviewer last checked the content.
 *
 * A real field, not `updatedAt`. "Last reviewed 12 August 2026" is a claim about
 * medical scrutiny; `updatedAt` changes when someone fixes a comma, which would
 * quietly restate that claim every time anyone touched the document.
 *
 * Empty renders nothing — the byline drops the segment rather than showing a
 * review date that nobody stands behind.
 */
export function reviewedAtField(): Field {
  return {
    name: 'reviewedAt',
    type: 'date',
    label: 'Last reviewed',
    admin: {
      position: 'sidebar',
      date: { pickerAppearance: 'dayOnly' },
      description:
        'Set when the reviewer actually re-checked the content. Not the last edit date.',
    },
  }
}

/**
 * Exclude from search engines while leaving the document live.
 *
 * Read by both the metadata robots directive and the sitemap routes, which is the
 * pairing that matters: a noindex page left in the sitemap tells a crawler to
 * fetch a page and then not to index what it fetched.
 */
export function noindexField({ description }: { description?: string } = {}): Field {
  return {
    name: 'noindex',
    type: 'checkbox',
    defaultValue: false,
    label: 'Exclude from search engines',
    admin: {
      position: 'sidebar',
      ...(description ? { description } : {}),
    },
  }
}

/**
 * The reference list. Every entry ends in a link.
 *
 * Pillars has this; Posts uses inline `Citation` blocks instead. Shared here so
 * P7's scientific articles — which need a formal reference list far more than a
 * pillar does — do not define a third variation.
 */
export function referencesField({ maxRows = 6 }: { maxRows?: number } = {}): Field {
  return {
    name: 'references',
    type: 'array',
    localized: true,
    maxRows,
    labels: { singular: 'Reference', plural: 'References' },
    admin: {
      initCollapsed: true,
      description: `2–${maxRows} entries. Each one ends in a link.`,
    },
    fields: [
      { name: 'text', type: 'textarea', required: true, localized: true },
      { name: 'url', type: 'text', required: true },
    ],
  }
}
