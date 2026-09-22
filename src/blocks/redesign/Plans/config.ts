import type { Block } from 'payload'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-08.json — defaults are the mockup's own values.
 *
 * Two plan cards, three assurances, and a comparison table that is hidden until
 * the button under the cards is pressed.
 *
 * The table is the whole difficulty of this block. In the mockup it is ONE CSS
 * grid of 57 flat children — a corner cell, two plan headers, then per section a
 * heading plus two blanks, then three cells per row, then a spacer and two CTAs.
 * There is no repeating unit to map, so it is rendered from `compare` by
 * PlansCompareGrid and the cell styles are lifted from the manifest by
 * tools/plans_grid.py rather than typed.
 *
 * `coreKind` / `advancedKind` are a select, not free text, because the mockup
 * distinguishes a tick, a dash and a phrase by STYLING rather than by content: a
 * round blue-grey badge, a dimmed em dash, or plain 13.5px text. An editor
 * typing "✓" into a text field would get the character, not the badge. The
 * kind picks the treatment; `coreText` / `advancedText` only apply to "text".
 *
 * The two plan cards and the two comparison CTAs point at DIFFERENT urls in the
 * mockup (#close and #buy) and are separate fields for that reason — see the
 * punch list; both are mockup placeholders and need real destinations.
 *
 * `compareOpenLabel` is what the button says while the table is CLOSED. It is
 * not in the section manifest, which was captured with the table open, and was
 * read off the running mockup instead — tools/plans_defaults_check.py re-reads
 * both states and fails if either label drifts.
 */
export const RdPlansBlock: Block = {
  slug: 'rdPlans',
  interfaceName: 'RdPlansBlock',
  labels: { singular: 'RD Plans', plural: 'RD Plans' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id so in-page links like "#plans" '
          + 'land here. Deliberately NOT localized — the fragment must be '
          + 'identical in every locale or the links break on translated pages.' },
      defaultValue: "plans",
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: "Two plans. One difference.",
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      defaultValue: "Same method, both. Advanced reads more, every cycle.",
    },
    {
      name: 'core',
      type: 'group',
      label: 'Core plan',
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: "Core",
        },
        {
          name: 'tagline',
          type: 'textarea',
          localized: true,
          label: 'Tagline',
          defaultValue: "Your gut read, and the formula built from it.",
        },
        {
          name: 'price',
          type: 'text',
          localized: true,
          defaultValue: "€99",
        },
        {
          name: 'priceSuffix',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Follows the price in smaller type. The LEADING SPACE is the mockup\'s '
              + 'own and is the only space between this and the price — without it the '
              + 'line reads "€99/mo".',
          },
          defaultValue: " /mo",
        },
        {
          name: 'priceNote',
          type: 'text',
          localized: true,
          admin: { description: 'The line under the price.' },
          defaultValue: "Cancel anytime. No minimum commitment.",
        },
        {
          name: 'listLabel',
          type: 'text',
          localized: true,
          admin: { description: 'The small heading above the feature list.' },
          defaultValue: "What's inside",
        },
        {
          name: 'features',
          type: 'array',
          label: 'Feature list',
          admin: { description: 'The ✓ badge on each row is drawn by the card — do not type it.' },
          defaultValue: [
            {
              "label": "Your gut, read at species level"
            },
            {
              "label": "A formula built from your data"
            },
            {
              "label": "Three components, posted monthly"
            },
            {
              "label": "Presorted, travel-ready packaging"
            },
            {
              "label": "Recalibrate on demand"
            }
          ],
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
            },
          ],
        },
        localizedLink({ overrides: { name: 'cta', label: 'Card button', defaultValue: {
            "url": "#close",
            "label": "Start with Core"
          } } }),
        {
          name: 'ctaNote',
          type: 'text',
          localized: true,
          admin: { description: 'The reassurance line under the button.' },
          defaultValue: "Nothing charged until your formula is made",
        },
      ],
    },
    {
      name: 'advanced',
      type: 'group',
      label: 'Advanced plan',
      fields: [
        {
          name: 'badge',
          type: 'text',
          localized: true,
          admin: { description: 'The pill on the Advanced card. Leave empty to hide it.' },
          defaultValue: "Most informed",
        },
        {
          name: 'name',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: "Advanced",
        },
        {
          name: 'tagline',
          type: 'textarea',
          localized: true,
          label: 'Tagline',
          defaultValue: "Gut and blood. Your formula rebuilds every cycle.",
        },
        {
          name: 'price',
          type: 'text',
          localized: true,
          defaultValue: "€149",
        },
        {
          name: 'priceSuffix',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Follows the price in smaller type. The LEADING SPACE is the mockup\'s '
              + 'own and is the only space between this and the price — without it the '
              + 'line reads "€99/mo".',
          },
          defaultValue: " /mo",
        },
        {
          name: 'priceNote',
          type: 'text',
          localized: true,
          admin: { description: 'The line under the price.' },
          defaultValue: "Cancel anytime. No minimum commitment.",
        },
        {
          name: 'listLabel',
          type: 'text',
          localized: true,
          admin: { description: 'The small heading above the feature list.' },
          defaultValue: "Everything in Core, plus",
        },
        {
          name: 'features',
          type: 'array',
          label: 'Feature list',
          admin: { description: 'The ✓ badge on each row is drawn by the card — do not type it.' },
          defaultValue: [
            {
              "label": "Blood biomarkers, alternating with gut"
            },
            {
              "label": "Formula rebuilds from every diagnostic"
            },
            {
              "label": "96+ ingredient library, on request"
            },
            {
              "label": "Priority support from the team"
            }
          ],
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
            },
          ],
        },
        localizedLink({ overrides: { name: 'cta', label: 'Card button', defaultValue: {
            "url": "#close",
            "label": "Start with Advanced"
          } } }),
        {
          name: 'ctaNote',
          type: 'text',
          localized: true,
          admin: { description: 'The reassurance line under the button.' },
          defaultValue: "Nothing charged until your formula is made",
        },
      ],
    },
    {
      name: 'assurances',
      type: 'array',
      label: 'Assurances',
      minRows: 3,
      maxRows: 3,
      admin: { description: 'The three items under the plan cards. Each one has its own '
          + 'hand-drawn icon fixed in the design, so rows cannot be added or removed.' },
      defaultValue: [
        {
          "label": "You pay on production",
          "body": "Charged only when your formula is made, never before your diagnostic completes."
        },
        {
          "label": "Cancel anytime",
          "body": "No minimum commitment. Stay for as long as the data is useful to you."
        },
        {
          "label": "Diagnostic included",
          "body": "The diagnostic is the product. It's in your subscription, not an add-on."
        }
      ],
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
        },
      ],
    },
    {
      name: 'compareOpenLabel',
      type: 'text',
      localized: true,
      label: 'Compare button — closed',
      admin: { description: 'What the button says while the table is hidden.' },
      defaultValue: "Compare Core & Advanced in full",
    },
    {
      name: 'compareCloseLabel',
      type: 'text',
      localized: true,
      label: 'Compare button — open',
      admin: { description: 'What the button says while the table is showing.' },
      defaultValue: "Hide the full comparison",
    },
    {
      name: 'compare',
      type: 'array',
      label: 'Comparison table',
      admin: { description: 'Sections of the full comparison, in order. The two plan '
          + 'columns take their name and price from the cards above.' },
      defaultValue: [
        {
          "title": "Analysis",
          "rows": [
            {
              "label": "Gut microbiome sequencing, shotgun, species-level",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Summary analysis report",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Full data output + deeper interpretation",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Blood biomarker panel",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Alternating gut + blood cycles, from cycle 2",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Gut retests",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "On demand",
              "advancedText": "Every other cycle"
            }
          ]
        },
        {
          "title": "Your formula",
          "rows": [
            {
              "label": "Three-part formula, built from your data",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Presorted, travel-ready packaging",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Formula rebuilds every cycle",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "96+ add-on ingredients",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Priority support",
              "coreKind": "excluded",
              "advancedKind": "included"
            }
          ]
        },
        {
          "title": "Commitment & billing",
          "rows": [
            {
              "label": "Subscription terms",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "Cancel anytime",
              "advancedText": "Cancel anytime"
            },
            {
              "label": "Minimum commitment",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "None",
              "advancedText": "None"
            },
            {
              "label": "Charged on production, never before",
              "coreKind": "included",
              "advancedKind": "included"
            }
          ]
        }
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
          label: 'Section heading',
        },
        {
          name: 'rows',
          type: 'array',
          label: 'Rows',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'coreKind',
              type: 'select',
              label: 'Core',
              options: [
                { label: 'Included (✓)', value: 'included' },
                { label: 'Not included (—)', value: 'excluded' },
                { label: 'Text', value: 'text' },
              ],
              defaultValue: 'included',
              admin: { description: 'How this cell is drawn. "Text" uses the field below.' },
            },
            {
              name: 'coreText',
              type: 'text',
              localized: true,
              admin: { condition: (_: unknown, s: { coreKind?: string }) => s?.coreKind === 'text' },
            },
            {
              name: 'advancedKind',
              type: 'select',
              label: 'Advanced',
              options: [
                { label: 'Included (✓)', value: 'included' },
                { label: 'Not included (—)', value: 'excluded' },
                { label: 'Text', value: 'text' },
              ],
              defaultValue: 'included',
              admin: { description: 'How this cell is drawn. "Text" uses the field below.' },
            },
            {
              name: 'advancedText',
              type: 'text',
              localized: true,
              admin: { condition: (_: unknown, s: { advancedKind?: string }) => s?.advancedKind === 'text' },
            },
          ],
        },
      ],
    },
    {
      name: 'compareCta',
      type: 'group',
      label: 'Comparison table buttons',
      admin: { description: 'The two buttons in the last row of the table.' },
      fields: [
        {
          name: 'coreUrl',
          type: 'text',
          localized: true,
          defaultValue: "#buy",
        },
        {
          name: 'coreLabel',
          type: 'text',
          localized: true,
          defaultValue: "Start with Core",
        },
        {
          name: 'advancedUrl',
          type: 'text',
          localized: true,
          defaultValue: "#buy",
        },
        {
          name: 'advancedLabel',
          type: 'text',
          localized: true,
          defaultValue: "Start with Advanced",
        },
      ],
    },
    {
      name: 'compareFootnote',
      type: 'text',
      localized: true,
      admin: { description: 'The line under the table.' },
      defaultValue: "Nothing charged until your formula is made.",
    },
  ],
}
