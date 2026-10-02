import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * The FAQ page, one block.
 *
 * ONE BLOCK, TWO SCREENS. The mockup draws `Hero` and `Questions` separately; a
 * visitor sees one page, so the hero is mounted as the questions screen's own
 * sibling rather than asked for as a second block an editor could forget to add.
 *
 * THE LOGIC IS THE CURRENT FAQ PAGE'S, carried across rather than reinvented —
 * src/blocks/FaqPage/Component.tsx. Three decisions come with it:
 *
 *   * Rows open as a SET, not one at a time. Several answers stand open at once
 *     and closing one leaves the rest alone. The funnel's duration FAQ is the
 *     opposite, so this is not a detail to guess at.
 *   * The category chips are DERIVED from the groups and shown only when there is
 *     more than one — never their own field, which could fall out of step with
 *     the sections they jump to.
 *   * The numbers — 01, 02 … — are derived from position for the same reason.
 *
 * THE ROW IS A NATIVE <details>, which is what the mockup draws, and it keeps
 * every style the design put on it. React drives it: `open` comes from the Set and
 * the summary's click is handled rather than left to the browser, so the DOM and
 * the state cannot disagree.
 *
 * PRICES ARE TOKENS. Any text or rich text here resolves `{{price:core:4}}` and
 * `{{fee:kit}}` against the visitor's selected currency, re-resolved when they
 * switch — RenderBlocks runs usePriceTokens over every block's props. The seeded
 * answers carry them, so the mockup's pounds are not shown to a German visitor.
 */
export const RdFaqBlock: Block = {
  slug: "rdFaq",
  interfaceName: "RdFaqBlock",
  labels: { singular: "RdFaq", plural: "RdFaq" },
  fields: [
    { name: "anchorId", type: "text" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Frequently asked questions." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Everything about your kit, your formula, billing, and the science, in one place. Can’t find what you need? Our team is one email away." },
      ],
    },
    {
      name: "groups", type: 'array',
      defaultValue: [
        {
          "label": "Billing & payment",
          "items": [
            {
              "question": "When am I charged?",
              "answer": {
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
                          "text": "Your card is authorised when you order, but charged only when your formula is produced, roughly four weeks after your analysis completes. Nothing is produced before your analysis is, so nothing is charged before then either.",
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
              }
            },
            {
              "question": "Can I pay monthly instead of committing?",
              "answer": {
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
                          "text": "Yes. Core is £99 a month and Advanced £149, rolling monthly, cancel anytime. Commit to four months and the price drops by £5 a month, or to twelve months for £10 off a month.",
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
              }
            },
            {
              "question": "Is the analysis included in the price?",
              "answer": {
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
                          "text": "Yes. The gut analysis and your full report are included in your subscription, not an add-on.",
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
              }
            },
            {
              "question": "What if I don’t return my sample in time?",
              "answer": {
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
                          "text": "You have 30 days to send your sample back. Miss that window and a one-time £49 kit fee applies, and it can’t be waived by returning the kit later. Ordering commits you to your subscription, but the subscription only begins once your sample reaches us, so a kit that’s never returned means the £49 and nothing else.",
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
              }
            }
          ]
        },
        {
          "label": "Your formula",
          "items": [
            {
              "question": "What’s actually in my formula?",
              "answer": {
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
                          "text": "Three parts, built from your data: Activate in the morning, Restore in the evening and Nourish, a daily powder blend. Every ingredient earns its place from something in your analysis, and nothing is added by default.",
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
              }
            },
            {
              "question": "What if I’m on medication?",
              "answer": {
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
                          "text": "Your intake form captures this. If anything needs review, our team checks your formula before production and writes to you directly. Always consult your healthcare provider before starting.",
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
              }
            }
          ]
        },
        {
          "label": "Subscription & delivery",
          "items": [
            {
              "question": "How long until my formula ships?",
              "answer": {
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
                          "text": "Your kit arrives within days. Once we’ve read your gut and our science team approves your formula, your first delivery ships, typically around four weeks from order.",
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
              }
            },
            {
              "question": "Can I cancel my subscription?",
              "answer": {
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
                          "text": "Yes. Monthly plans can be cancelled at any time from your account settings. If you chose a four- or twelve-month cycle, you can cancel once that cycle ends.",
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
              }
            },
            {
              "question": "Can I switch between plans?",
              "answer": {
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
                          "text": "Only at the end of a cycle, never mid-cycle. You can move between Core and Advanced when your current cycle closes, and your new plan takes effect from the next one.",
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
              }
            },
            {
              "question": "How does the retest work?",
              "answer": {
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
                          "text": "Your sample runs back through the same pipeline and the same measures as your first reading. Because your formula is built from data, it can be checked against data, and it is rebuilt from what changed.",
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
              }
            }
          ]
        },
        {
          "label": "Science & data",
          "items": [
            {
              "question": "What’s the difference between Core and Advanced?",
              "answer": {
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
                          "text": "Core reads your gut and builds your formula from it. Advanced adds retesting and blood markers, so your formula is rebuilt from new readings as you go.",
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
              }
            },
            {
              "question": "How is my sample data used?",
              "answer": {
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
                          "text": "Your gut data builds your formula and your report. It’s compared against a reference set to produce your score. Your data is yours, handled under GDPR, and never sold.",
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
              }
            },
            {
              "question": "How is shotgun sequencing different from other gut tests?",
              "answer": {
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
                          "text": "Shotgun sequencing reads the genes in your gut, not just which species are present but what they are able to do. It gives far more detail at species and strain level than standard 16S testing.",
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
              }
            }
          ]
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
        {
          name: "items", type: 'array',
          fields: [
            { name: "question", type: "text", localized: true, required: true },
            { name: "answer", type: "richText", localized: true, editor: makeRedesignHeadingEditor(['h2']) },
          ],
        },
      ],
    },
    { name: "calloutHeading", type: "text", localized: true, defaultValue: "Still have a question?" },
    { name: "calloutBody", type: "textarea", localized: true, defaultValue: "If your answer isn’t here, our team replies within 1–2 working days." },
    { name: "calloutCtaLabel", type: "text", localized: true, defaultValue: "Contact us" },
    { name: "calloutCtaHref", type: "text", localized: true, defaultValue: "contact" },
  ],
}
