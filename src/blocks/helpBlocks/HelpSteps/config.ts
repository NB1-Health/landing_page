import type { Block } from 'payload'

import { helpBodyEditor, helpInlineEditor } from '../_shared/editors'

/**
 * The numbered body of a help article.
 *
 * Steps are numbered by CSS from their position in the array — never type a
 * number into a title. Each step's heading is what the on-page nav rail picks
 * up, so a title should read as a task ("Register your kit"), not as a label.
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
      admin: {
        description:
          'Optional unnumbered photo above step 1 — the "what\'s in the box" shot. When a labelled product photo already lists the parts, you do not also need a checklist.',
      },
    },
    { name: 'introImageCaption', type: 'text', localized: true },
    {
      name: 'intro',
      label: 'Lead paragraph',
      type: 'richText',
      localized: true,
      editor: helpInlineEditor,
      admin: { description: 'Optional. One short paragraph before step 1.' },
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
          name: 'code',
          label: 'Code chip',
          type: 'group',
          admin: {
            description: 'The small boxed sample + action link. Leave the value empty to hide it.',
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
          admin: { description: 'Optional. Shown under the step body.' },
        },
        { name: 'mediaCaption', type: 'text', localized: true },
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
