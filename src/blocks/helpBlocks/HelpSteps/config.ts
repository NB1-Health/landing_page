import type { Block } from 'payload'

import { helpBodyEditor, helpInlineEditor } from '../_shared/editors'

/**
 * The numbered body of a help article.
 *
 * Steps are numbered by CSS from their position in the array — never type a
 * number into a title. Each step's heading is what the on-page nav rail picks
 * up, so a title should read as a task ("Register your kit"), not as a label.
 *
 * A step renders its parts in ONE fixed order, whatever order the fields appear
 * in here:
 *
 *   heading → flow strip → [photo, if placed above] → body → code chips
 *   → [photo, if placed below] → callouts → example guide → sub-note
 *
 * That order was taken from the two kit mockups (stool + blood) and is
 * deliberately not configurable: a step that needs a different order is a
 * design request, not a new select.
 */
export const HelpStepsBlock: Block = {
  slug: 'helpSteps',
  interfaceName: 'HelpStepsBlock',
  dbName: 'hst',
  labels: { singular: 'Help: Steps', plural: 'Help: Steps Blocks' },
  fields: [
    {
      name: 'reserveTocSpace',
      label: 'Leave room for the contents rail',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Keep this on when the page has a "Help: On-page Nav" block — it indents the body so the rail sits in the left gutter. Turn it off for a full-width article with no rail.',
      },
    },
    {
      name: 'introImage',
      label: 'Intro photo',
      type: 'upload',
      relationTo: 'media',
      localized: true,
      admin: {
        description:
          'Optional unnumbered photo above step 1 — the "what\'s in the box" shot. Set per locale, since this one has labels baked into the image. When a labelled product photo already lists the parts, you do not also need a checklist.',
      },
    },
    { name: 'introImageCaption', type: 'text', localized: true },
    {
      name: 'intro',
      label: 'Lead paragraph',
      type: 'richText',
      localized: true,
      // helpBodyEditor rather than helpInlineEditor: the blood-kit mockup opens
      // with a "Kit content" line followed by a plain bulleted parts list, so
      // the lead needs lists. Headings and links come along with it; keep the
      // lead to a line or two regardless.
      editor: helpBodyEditor,
      admin: {
        description:
          'Optional. One short paragraph before step 1, and — where the kit has no labelled contents photo — a bulleted parts list under it.',
      },
    },
    {
      name: 'steps',
      type: 'array',
      // dbName replaces the WHOLE table name in this adapter (see rff / prh /
      // cvr), so it must be fully qualified — a bare 'st' would create a
      // top-level table called "st". Keeping it short also keeps the nested
      // array's locale index names under Postgres's 63-character limit.
      dbName: 'hst_st',
      required: true,
      minRows: 1,
      labels: { singular: 'Step', plural: 'Steps' },
      admin: {
        initCollapsed: true,
        description:
          'Numbered automatically in order. Write plainly, second person, short sentences. Bold the one or two words per line that matter most — a quantity, a warning, a required action — not whole sentences.',
      },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        {
          name: 'anchor',
          type: 'text',
          admin: {
            description:
              'Optional. Anchor id for this step, used by the contents rail and by links pointing at it. Defaults to a slug of the title. Not localized — keep links stable across locales.',
          },
        },
        {
          name: 'body',
          type: 'richText',
          localized: true,
          editor: helpBodyEditor,
          admin: {
            description:
              'Paragraphs, numbered or bulleted lists (Tab indents a nested list), links, and Heading 4 for a sub-heading like "Are you based in the EU?".',
          },
        },
        {
          name: 'flow',
          label: 'Flow strip',
          type: 'array',
          dbName: 'hst_st_fl',
          maxRows: 6,
          labels: { singular: 'Frame', plural: 'Frames' },
          admin: {
            initCollapsed: true,
            description:
              'A row of small numbered illustrations above the step body — the printed card\'s "do this, then this" strip. Leave empty for a step that has one photo instead; use the step photo below for that.',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              localized: true,
              admin: {
                description: 'Set per locale — a frame with words in it needs a translated version.',
              },
            },
            {
              name: 'label',
              type: 'text',
              localized: true,
              admin: { description: 'Optional caption under the frame, e.g. "Warm your hands".' },
            },
          ],
        },
        {
          name: 'codes',
          label: 'Code chips',
          type: 'array',
          dbName: 'hst_st_cd',
          maxRows: 4,
          labels: { singular: 'Code chip', plural: 'Code chips' },
          admin: {
            initCollapsed: true,
            description:
              'One boxed sample per row, shown side by side — a kit with two differently formatted codes gets two rows. The optional action link is rendered once, after the boxes.',
          },
          fields: [
            { name: 'label', type: 'text', localized: true, defaultValue: 'Example' },
            {
              name: 'value',
              type: 'text',
              admin: { description: 'e.g. DE013|A12BC345D6. Not localized — it is a literal sample.' },
            },
            { name: 'linkLabel', type: 'text', localized: true },
            {
              name: 'linkUrl',
              type: 'text',
              localized: true,
              admin: { description: 'Site-relative, e.g. /login.' },
            },
          ],
        },
        {
          name: 'code',
          label: 'Code chip (legacy)',
          type: 'group',
          admin: {
            description:
              'Superseded by "Code chips" above, which takes more than one sample. Still rendered so existing articles keep working — leave it empty on new steps.',
          },
          fields: [
            { name: 'label', type: 'text', localized: true, defaultValue: 'Code sample' },
            {
              name: 'value',
              type: 'text',
              admin: { description: 'e.g. 181723699XXXX. Not localized — it is a literal sample.' },
            },
            { name: 'linkLabel', type: 'text', localized: true },
            {
              name: 'linkUrl',
              type: 'text',
              localized: true,
              admin: { description: 'Site-relative, e.g. /login.' },
            },
          ],
        },
        {
          name: 'media',
          label: 'Step photo',
          type: 'upload',
          relationTo: 'media',
          localized: true,
          admin: {
            description:
              'Optional. One illustration for this step. Set per locale — a diagram with words in it needs a translated version.',
          },
        },
        { name: 'mediaCaption', type: 'text', localized: true },
        {
          name: 'mediaPosition',
          label: 'Photo position',
          type: 'select',
          defaultValue: 'below',
          options: [
            { label: 'Below the step body', value: 'below' },
            { label: 'Above the step body', value: 'above' },
          ],
          admin: {
            description:
              'Above is for a diagram the text then refers to ("use this finger"); below is for a photo of the result.',
          },
        },
        {
          name: 'mediaWidth',
          label: 'Photo width',
          type: 'select',
          defaultValue: 'full',
          options: [
            { label: 'Full column', value: 'full' },
            { label: 'Medium (300px)', value: 'medium' },
            { label: 'Small (190px)', value: 'small' },
          ],
          admin: {
            description:
              'Small and medium keep a single-object diagram from being blown up across the whole column.',
          },
        },
        {
          name: 'mediaPlaceholder',
          label: 'Photo placeholder text',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Shown in a grey 16:9 box while the photo is still missing, e.g. "Collection flow diagram". Leave empty to render nothing until there is an image.',
          },
        },
        {
          name: 'notes',
          label: 'Callouts',
          type: 'array',
          dbName: 'hst_st_nt',
          maxRows: 3,
          labels: { singular: 'Callout', plural: 'Callouts' },
          admin: {
            initCollapsed: true,
            description: 'Rendered under the step body, in order. Use sparingly.',
          },
          fields: [
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'info',
              options: [
                { label: 'Info (teal)', value: 'info' },
                { label: 'Quiet (grey)', value: 'quiet' },
              ],
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              admin: { description: 'Optional. A short line, e.g. "No rush on the same day".' },
            },
            { name: 'body', type: 'richText', localized: true, editor: helpInlineEditor },
          ],
        },
        {
          name: 'guide',
          label: 'Example guide',
          type: 'array',
          dbName: 'hst_st_gd',
          maxRows: 6,
          labels: { singular: 'Example', plural: 'Examples' },
          admin: {
            initCollapsed: true,
            description:
              'A grey panel of small labelled examples — right and wrong versions of the same thing, like the blood card\'s "too small / too big / perfect" drops. Order them so the correct one comes last.',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              localized: true,
              admin: {
                description:
                  'A small square diagram, ideally on a transparent background. Set per locale only if the drawing carries text.',
              },
            },
            {
              name: 'label',
              type: 'text',
              localized: true,
              admin: { description: 'Two or three words, e.g. "Too small".' },
            },
          ],
        },
        {
          name: 'subnote',
          label: 'Sub-note',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Optional quiet line closing the step, e.g. "Each circle should be filled evenly." Not a callout — it renders as small grey text, with no box.',
          },
        },
      ],
    },
    {
      name: 'outro',
      label: 'Closing',
      type: 'group',
      fields: [
        {
          name: 'doneText',
          type: 'text',
          localized: true,
          admin: { description: 'e.g. "…And you\'re done!". Leave empty to hide.' },
        },
        {
          name: 'note',
          type: 'richText',
          localized: true,
          editor: helpInlineEditor,
          admin: { description: 'Optional last line, e.g. a pointer to the sibling kit article.' },
        },
      ],
    },
  ],
}
