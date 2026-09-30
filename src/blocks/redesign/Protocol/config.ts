import type { Block } from 'payload'
import { redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-02.json — defaults are the mockup's own values.
 *
 * The four steps are a LOCKED array. They are not a repeat: the first three
 * carry a connector rail joining them to the next step and the last does not, so
 * the markup genuinely differs and a single template would draw a rail hanging
 * off the end of the journey. Each step binds to its own index, and the icons are
 * fixed line glyphs rather than fields.
 *
 * `week` is rich text on every step because ONE of them is — "Week 3 ★" carries a
 * lime star, and a colour belongs on the text node as a named token. Binding the
 * other three as plain text against the same field would render the Lexical
 * object as a React child and throw.
 */
export const RdProtocolBlock: Block = {
  slug: 'rdProtocol',
  interfaceName: 'RdProtocolBlock',
  labels: { singular: 'RD Protocol', plural: 'RD Protocols' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'protocol',
      label: 'Anchor id',
      admin: {
        description:
          'Rendered as the section id so in-page links like "#protocol" land here. '
          + 'Deliberately NOT localized — the fragment must be identical in every locale.',
      },
    },
    { name: 'heading', type: 'text', localized: true, required: true, defaultValue: "Four steps from your biology to your one-of-one protocol." },
    { name: 'intro', type: 'textarea', localized: true, defaultValue: "From the sample you collect at home to your first delivery takes about four weeks." },
    {
      name: 'callout',
      type: 'group',
      label: 'Callout',
      admin: { description: 'The boxed note beside the steps.' },
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: "Why week 3 matters" },
        {
          name: 'marker',
          type: 'text',
          localized: true,
          defaultValue: "3",
          label: 'Step number',
          admin: { description: 'The large numeral. The dot beside it is part of the design.' },
        },
        { name: 'body', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
          "root": {
                    "type": "root",
                    "children": [
                              {
                                        "type": "paragraph",
                                        "children": [
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 0,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": "Nothing is made in advance. Your formula is only made once we have read your results. ",
                                                            "version": 1
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 1,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": "Built for one. Never for everyone.",
                                                            "version": 1
                                                  }
                                        ],
                                        "direction": "ltr",
                                        "format": "",
                                        "indent": 0,
                                        "version": 1,
                                        "textFormat": 0
                              }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "version": 1
          }
} },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      minRows: 4,
      maxRows: 4,
      admin: {
        description:
          'The four stages, in order. Exactly four: each has its own icon and the '
          + 'connector rail between them is drawn per position, so rows cannot be '
          + 'added or removed without changing the design.',
      },
      defaultValue: [
      {
            "week": {
                  "root": {
                        "type": "root",
                        "children": [
                              {
                                    "type": "paragraph",
                                    "children": [
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 0,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "Week 0",
                                                "version": 1
                                          }
                                    ],
                                    "direction": "ltr",
                                    "format": "",
                                    "indent": 0,
                                    "version": 1,
                                    "textFormat": 0
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1
                  }
            },
            "title": "Collect",
            "body": "Take a sample at home. Five minutes."
      },
      {
            "week": {
                  "root": {
                        "type": "root",
                        "children": [
                              {
                                    "type": "paragraph",
                                    "children": [
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 0,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "Weeks 1–2",
                                                "version": 1
                                          }
                                    ],
                                    "direction": "ltr",
                                    "format": "",
                                    "indent": 0,
                                    "version": 1,
                                    "textFormat": 0
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1
                  }
            },
            "title": "Read",
            "body": "Our lab reads your biology at species level."
      },
      {
            "week": {
                  "root": {
                        "type": "root",
                        "children": [
                              {
                                    "type": "paragraph",
                                    "children": [
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 0,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "Week 3 ",
                                                "version": 1
                                          },
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 0,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "★",
                                                "version": 1,
                                                "$": {
                                                      "color": "rd-lime"
                                                }
                                          }
                                    ],
                                    "direction": "ltr",
                                    "format": "",
                                    "indent": 0,
                                    "version": 1,
                                    "textFormat": 0
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1
                  }
            },
            "title": "Make",
            "body": "We make your formula from scratch. Only for you."
      },
      {
            "week": {
                  "root": {
                        "type": "root",
                        "children": [
                              {
                                    "type": "paragraph",
                                    "children": [
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 0,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "Week 4",
                                                "version": 1
                                          }
                                    ],
                                    "direction": "ltr",
                                    "format": "",
                                    "indent": 0,
                                    "version": 1,
                                    "textFormat": 0
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1
                  }
            },
            "title": "Deliver",
            "body": "It arrives at your door, and tops up monthly."
      }
],
      fields: [
        {
          name: 'week',
          type: 'richText',
          localized: true,
          required: true,
          editor: redesignInlineEditor,
          admin: { description: 'e.g. "Week 0". Rich text so a word can take a palette colour.' },
        },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'body', type: 'textarea', localized: true },
      ],
    },
  ],
}
