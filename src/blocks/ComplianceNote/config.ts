import type { Block } from 'payload'

/**
 * The brief's `.art-note` — the standing reminder that NB1 is a wellness product,
 * not a medical one. Editors drop it into an article body wherever a claim needs
 * framing.
 *
 * Lexical blocks are serialized into the rich-text JSON, not into their own
 * tables, so this block needs no migration. The `Disclaimers` collection it now
 * points at does.
 *
 * Three ways to fill it, in resolution order:
 *
 * 1. `disclaimer` — a record from the library. The right answer, and the one that
 *    makes a wording change from legal a single edit rather than a sweep across
 *    2,800 documents in eight languages.
 * 2. `text` — a per-article override, for the rare case where this article needs
 *    different framing. Kept because it is what every existing note holds, and
 *    dropping it would have meant a content migration to add this feature.
 * 3. Neither — the standard translated disclaimer from the dictionary.
 *
 * The order matters: 1 before 2 so that picking a record is not silently
 * overridden by copy left in the textarea from before.
 */
export const ComplianceNote: Block = {
  slug: 'complianceNote',
  interfaceName: 'ComplianceNoteBlock',
  labels: {
    singular: 'Compliance note',
    plural: 'Compliance notes',
  },
  fields: [
    {
      name: 'disclaimer',
      type: 'relationship',
      relationTo: 'disclaimers',
      admin: {
        description:
          'Pick the wording from the library. Preferred — editing the record updates every article at once.',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Override for this article only. Ignored when a disclaimer is selected above. Leave both empty for the standard NB1 wellness disclaimer.',
        condition: (_, siblingData) => !(siblingData as { disclaimer?: unknown })?.disclaimer,
      },
    },
  ],
}
