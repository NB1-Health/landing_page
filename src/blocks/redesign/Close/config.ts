import type { Block } from 'payload'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-09.json — defaults are the mockup's own values,
 * injected from out/RdClose.defaults.json rather than retyped.
 *
 * The closing band: brand mark, headline, one line of copy, one button. It is the
 * last section of the page and the target of every "#close" link above it,
 * including the nav's own CTA — so its `anchorId` is load-bearing rather than
 * decorative.
 *
 * The mark is 25 hand-placed circles on a 133×148 viewBox, drawn in
 * `currentColor`, and is STATIC. It is the company's logo, not artwork an editor
 * picks between, and it has no second form to choose. Making it an upload would
 * also lose `currentColor` — which is the whole reason it takes the section's
 * foreground rather than carrying a colour of its own.
 *
 * The button's ↗ is likewise part of the drawing, sized in `em` off the label
 * beside it. Same treatment as every other primary CTA in this redesign.
 *
 * The mockup's own href is bare "#", which is a placeholder, not a destination —
 * reproduced because a default is the mockup's value, and noted on the punch list
 * alongside the other CTA targets still to be decided.
 */
export const RdCloseBlock: Block = {
  slug: 'rdClose',
  interfaceName: 'RdCloseBlock',
  labels: { singular: 'RD Close', plural: 'RD Close' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor id',
      admin: {
        description:
          'Rendered as the section id. Every "#close" link on the page lands here, '
          + 'including the nav CTA, so changing it breaks them. Deliberately NOT '
          + 'localized — the fragment must be identical in every locale.',
      },
      defaultValue: "close",
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: "Stop the guesswork.",
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      defaultValue: "Read your biology. Get a formula made for one. Nothing is charged until it is made.",
    },
    localizedLink({
      overrides: {
        name: 'cta',
        label: 'Button',
        admin: {
          description:
            'The ↗ glyph is drawn by the button — do not type it into the label.',
        },
        defaultValue: {
          "url": "#",
          "label": "Order your kit"
        },
      },
    }),
  ],
}
