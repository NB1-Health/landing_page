import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor, redesignInlineLinkEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 *
 */
export const RdYbPageBlock: Block = {
  slug: "rdYbPage",
  interfaceName: "RdYbPageBlock",
  labels: { singular: "RdYbPage", plural: "RdYbPage" },
  fields: [
    {
      name: "hero", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "top" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h1']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "You are more microbe than human.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h1"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "Your genome holds ~20,000 genes. The microbes you carry hold roughly 3 million more. What your body can make and absorb starts there." },
        localizedLink({
          overrides: {
              name: "primaryCta",
              label: "Primary link",
              admin: { description: "The \u2197 glyph is drawn by the button \u2014 do not type it into the label." },
              defaultValue: {
              "url": "#start",
              "label": "Order your kit"
            },
          },
        }),
        localizedLink({
          overrides: {
              name: "secondaryCta",
              label: "Secondary link",
              admin: { description: "The \u2192 IS part of the label here, unlike the primary above. Type it." },
              defaultValue: {
              "label": "How we read you →",
              "url": "The Lab.dc.html"
            },
          },
        }),
        {
          name: "avatars", type: 'array', label: "Reviewer portraits", admin: { description: "Three overlapping round portraits. The overlap is applied automatically \u2014 the first sits flush, every one after it pulls back 6px." },
          defaultValue: [
            {
              "image": null
            },
            {
              "image": null
            },
            {
              "image": null
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media", label: "Portrait" },
          ],
        },
        { name: "proof", type: "richText", localized: true, editor: redesignInlineLinkEditor, label: "Proof line", admin: { description: "The science-board link sits INSIDE this sentence, which is why it is rich text \u2014 a translator needs to move it within the clause." }, defaultValue: {
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
                      "text": "Every formula reviewed by our ",
                      "version": 1
                    },
                    {
                      "type": "link",
                      "version": 3,
                      "direction": "ltr",
                      "format": "",
                      "indent": 0,
                      "fields": {
                        "linkType": "custom",
                        "newTab": false,
                        "url": "#"
                      },
                      "children": [
                        {
                          "type": "text",
                          "detail": 0,
                          "format": 0,
                          "mode": "normal",
                          "style": "",
                          "text": "seven-person science board",
                          "version": 1
                        }
                      ]
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": ", analysed in EU labs.",
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
        { name: "figureLabelTop", type: "richText", localized: true, editor: redesignInlineEditor, label: "Diagram label \u2014 outer ring", admin: { description: "Pinned 14px from the top of the artwork, against the outermost circle." }, defaultValue: {
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
                      "text": "25M gut",
                      "version": 1
                    },
                    {
                      "type": "linebreak",
                      "version": 1
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "bacteria analysed",
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
        { name: "figureLabelMid", type: "richText", localized: true, editor: redesignInlineEditor, label: "Diagram label \u2014 middle ring", admin: { description: "Pinned 178px down, against the middle circle." }, defaultValue: {
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
                      "text": "2,300 bacterial strains",
                      "version": 1
                    },
                    {
                      "type": "linebreak",
                      "version": 1
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "identified",
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
        { name: "figureLabelLow", type: "richText", localized: true, editor: redesignInlineEditor, label: "Diagram label \u2014 inner ring", admin: { description: "Pinned 327px down, against the innermost circle." }, defaultValue: {
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
                      "text": "1 formula made",
                      "version": 1
                    },
                    {
                      "type": "linebreak",
                      "version": 1
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "for you",
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
        { name: "figureCaption", type: "textarea", localized: true, label: "Diagram caption", admin: { description: "The line under the artwork, outside it." }, defaultValue: "165 microbial genes to every one of yours. Unlike your genome, this is the part that can change over time." },
      ],
    },
    {
      name: "two", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "two" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Two people can share 99.9% of their DNA and almost none of their gut.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h2"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "Your human genes are nearly identical to everyone else's. What sets you apart is your gut: which microbes you carry, and at what levels. The same species, in the same handful of teams, read differently in each of us." },
        { name: "pullQuote", type: "textarea", localized: true, label: "Pull quote", admin: { description: "Set in the serif face at a larger size than the standfirst above it \u2014 the two are different voices, not two paragraphs. Keep it short; the mockup caps it at roughly 32 characters per line." }, defaultValue: "Same DNA, the same teams, read at completely different levels. That's what a personalised formula is built to answer." },
        { name: "personAName", type: "text", localized: true, label: "Left person \u2014 name", defaultValue: "Person A" },
        { name: "personATag", type: "text", localized: true, label: "Left person \u2014 tag", admin: { description: "The small uppercase caption under the name." }, defaultValue: "One of one" },
        { name: "personBName", type: "text", localized: true, label: "Right person \u2014 name", defaultValue: "Person B" },
        { name: "personBTag", type: "text", localized: true, label: "Right person \u2014 tag", admin: { description: "The small uppercase caption under the name." }, defaultValue: "One of one" },
        {
          name: "bars", type: 'array', label: "Comparison bars", admin: { description: "One row per bacterial group. Each row carries BOTH people's readings, so the two panels always compare the same four groups and a label can never be translated two different ways. Rows render top to bottom in both panels." },
          defaultValue: [
            {
              "label": "Fibre fermenters",
              "valueA": "41%",
              "valueB": "22%",
              "scaleMax": 50
            },
            {
              "label": "Butyrate producers",
              "valueA": "18%",
              "valueB": "9%",
              "scaleMax": 25
            },
            {
              "label": "Bifidobacteria",
              "valueA": "3%",
              "valueB": "1.3%",
              "scaleMax": 10
            },
            {
              "label": "Protein fermenters",
              "valueA": "4%",
              "valueB": "12%",
              "scaleMax": 5
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true, label: "Group", admin: { description: "Uppercased by the page \u2014 type it in sentence case." } },
            { name: "valueA", type: "text", localized: true, label: "Left person's reading", admin: { description: "Shown as typed, e.g. \"41%\"." } },
            { name: "valueB", type: "text", localized: true, label: "Right person's reading", admin: { description: "Shown as typed, e.g. \"22%\"." } },
            { name: "scaleMax", type: "number", required: true, label: "Axis maximum", admin: { description: "The top of this group's normal range, as a number without the % sign. The bar is drawn as the reading against THIS, not against 100 \u2014 a reading of 41 on an axis of 50 fills 82% of the track. A reading above the axis fills the whole track and turns orange." } },
          ],
        },
        { name: "footNote", type: "text", localized: true, label: "Caption under the rule", defaultValue: "The 99.9% they share · written in DNA" },
      ],
    },
    {
      name: "clearest", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "clearest" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Why the same supplement can suit someone else and not you.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h2"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "Your DNA is nearly identical to everyone else's; your gut isn't. It's the part of your biology that's measurably yours, and it shapes what your body absorbs, makes and uses. A generic formula is dosed for a body that isn't yours. Reading your gut matches it to the one that is." },
        {
          name: "cards", type: 'array', label: "Cards", admin: { description: "The numbered cards under the standfirst. They are NUMBERED AUTOMATICALLY in the order they appear here \u2014 reordering or inserting one renumbers the rest, so there is no numeral to keep in sync. The mockup ships three; the grid takes any number." },
          defaultValue: [
            {
              "title": "Absorption.",
              "body": "What reaches your cells isn't what the label says.",
              "note": "Your gut metabolises the same compound its own way, so the label dose and the dose that reaches your cells rarely match.",
              "accent": "nb1-blue"
            },
            {
              "title": "Production.",
              "body": "Some of what your body needs, only your microbes can make.",
              "note": "Some species make compounds your body relies on, like short-chain fatty acids and B vitamins. Where they're thin, no capsule stands in.",
              "accent": "nb1-lime"
            },
            {
              "title": "Status.",
              "body": "What reaches the rest of you depends on your gut.",
              "note": "Your gut lining decides what you absorb and what passes straight through. Same diet, two people, profoundly different outcomes.",
              "accent": "nb1-soft-pink"
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true, label: "Title", admin: { description: "Type the full stop \u2014 the mockup's titles carry their own (\"Absorption.\")." } },
            { name: "body", type: "textarea", localized: true, label: "Body" },
            { name: "note", type: "textarea", localized: true, label: "Note", admin: { description: "The smaller, dimmer line under the body. It is what makes the cards bottom-align at equal height, so a card with no note will sit shorter than its neighbours." } },
            { name: "accent", type: "select", required: true, options: ["nb1-blue", "nb1-lime", "nb1-soft-pink"], label: "Badge colour", admin: { description: "The numbered badge's fill. Each option is mixed at 34% over the page's cool grey, which is the mockup's own recipe \u2014 the three choices are its exact three." } },
          ],
        },
        { name: "closing", type: "textarea", localized: true, label: "Closing line", defaultValue: "Your gut is where we read all this, but it isn't the whole point. What we build from that reading is a full supplement for all of you, matched to how your body works, not a gut product." },
      ],
    },
    {
      name: "reading", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "reading" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Personalised input. Personalised output.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h2"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "What we learn about you decides what goes into your formula. Nothing goes in that your results didn't ask for." },
        {
          name: "readCard", type: 'group', label: "Left card \u2014 what we read", admin: { description: "The white card on the left of the equation. Three fixed rows: the mockup's layout is a three-column equation, and the rows sit beside the card title rather than in a list of their own, so they are fields rather than a repeatable array." },
          fields: [
            { name: "title", type: "text", localized: true, required: true, label: "Card title", defaultValue: "What we read" },
            { name: "r1Label", type: "text", localized: true, label: "Row 1 \u2014 label", defaultValue: "Your gut sample" },
            { name: "r1Body", type: "textarea", localized: true, label: "Row 1 \u2014 body", defaultValue: "Every species in your gut, read in the lab." },
            { name: "r2Label", type: "text", localized: true, label: "Row 2 \u2014 label", defaultValue: "Your intake form" },
            { name: "r2Body", type: "textarea", localized: true, label: "Row 2 \u2014 body", defaultValue: "What you eat, how you feel, and what you already take." },
            { name: "r3Label", type: "text", localized: true, label: "Row 3 \u2014 label", defaultValue: "Your blood panel" },
            { name: "r3Tag", type: "text", localized: true, label: "Row 3 \u2014 badge", admin: { description: "The small orange pill beside row 3's label. Leave it EMPTY and no pill is drawn at all \u2014 it is the only row that has one." }, defaultValue: "Advanced" },
            { name: "r3Body", type: "textarea", localized: true, label: "Row 3 \u2014 body", defaultValue: "What is actually reaching your blood." },
          ],
        },
        {
          name: "formulaCard", type: 'group', label: "Right card \u2014 your formula", admin: { description: "The gradient card on the right of the equation. Same three-row shape as the left card, plus a closing line pinned to the bottom." },
          fields: [
            { name: "title", type: "text", localized: true, required: true, label: "Card title", defaultValue: "Your formula" },
            { name: "r1Label", type: "text", localized: true, label: "Row 1 \u2014 label", defaultValue: "Strains for what is running low" },
            { name: "r1Body", type: "textarea", localized: true, label: "Row 1 \u2014 body", defaultValue: "Chosen for the bacteria your sample showed you are short on." },
            { name: "r2Label", type: "text", localized: true, label: "Row 2 \u2014 label", defaultValue: "Fibres to feed them" },
            { name: "r2Body", type: "textarea", localized: true, label: "Row 2 \u2014 body", defaultValue: "Matched to the strains they support." },
            { name: "r3Label", type: "text", localized: true, label: "Row 3 \u2014 label", defaultValue: "Vitamins and minerals you lack" },
            { name: "r3Body", type: "textarea", localized: true, label: "Row 3 \u2014 body", defaultValue: "Set by your intake and, with Advanced, your blood." },
            { name: "footer", type: "text", localized: true, label: "Closing line", admin: { description: "Sits on a heavier rule at the very bottom of the card, however tall the rows above it run. Not a fourth row." }, defaultValue: "Nothing you don't need." },
          ],
        },
        { name: "disclaimer", type: "textarea", localized: true, label: "Regulatory note", defaultValue: "Blood panels give wellness insights, not a medical diagnosis. Every formula is built from your own analysis, never before it." },
        localizedLink({
          overrides: {
              name: "cta",
              label: "Link",
              admin: { description: "The \u2192 IS part of the label here \u2014 type it." },
              defaultValue: {
              "url": "The Protocol.dc.html",
              "label": "See how we build your formula →"
            },
          },
        }),
      ],
    },
    {
      name: "why", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "why" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "So why is every other supplement identical?",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h2"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "You just saw there's no average body. Most of the supplement industry is built as if there were only one." },
        { name: "statValue", type: "text", localized: true, label: "Statistic", admin: { description: "The large serif figure. Keep the unit out of it \u2014 that is the field below." }, defaultValue: "€180B" },
        { name: "statUnit", type: "text", localized: true, label: "Statistic unit", admin: { description: "The small uppercase line beside the figure." }, defaultValue: "a year" },
        {
          name: "cards", type: 'array', label: "Cards", admin: { description: "The three cards. Each has a short body always on show and a longer passage behind its button. They behave as an ACCORDION \u2014 opening one closes the others, and clicking an open one closes it, so all three can be shut." },
          defaultValue: [
            {
              "eyebrow": "Why they don’t change",
              "title": "It isn't broken. It's working exactly as designed.",
              "body": "One recipe, made by the million, is the cheapest thing a supplement company can make.",
              "more": "A formula built from your biology costs more per person, so they don’t build it. They make one blend and sell it to everyone, for as long as you keep buying."
            },
            {
              "eyebrow": "The mismatch",
              "title": "Dosed for a body that doesn't exist.",
              "body": "That blend is calibrated for an average.",
              "more": "Two hundred to four hundred species, in an order no one else shares, flattened into a single mean. Most of what a generic formula contains was never chosen for you, so much of it may do little once it’s in you."
            },
            {
              "eyebrow": "The cover",
              "title": "Nothing ever tells you it isn't working.",
              "body": "A generic supplement has no feedback loop.",
              "more": "You can’t see what moved, so stopping feels riskier than continuing, and you keep paying, month after month. That blind spot isn’t a flaw in the model. It is the model."
            }
          ],
          fields: [
            { name: "eyebrow", type: "text", localized: true, label: "Eyebrow" },
            { name: "title", type: "text", localized: true, required: true, label: "Title" },
            { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "Always visible. It also sets the cards' shared height, so keep the three roughly even or the shortest card will have a lot of white space." } },
            { name: "more", type: "textarea", localized: true, label: "Expanded text", admin: { description: "Hidden until the reader presses the button." } },
          ],
        },
        { name: "readMoreLabel", type: "text", localized: true, label: "Button \u2014 closed", admin: { description: "Type it in sentence case: the page uppercases it in CSS, so READ MORE here would not change how it looks but would fight the styling." }, defaultValue: "Read more" },
        { name: "closeLabel", type: "text", localized: true, label: "Button \u2014 open", admin: { description: "What the same button reads once its card is expanded. Sentence case, as above." }, defaultValue: "Close" },
        { name: "closingLead", type: "textarea", localized: true, label: "Closing statement", admin: { description: "Set in the serif under the rule \u2014 a different voice from the line below it." }, defaultValue: "The fix was never a better average." },
        { name: "closingBody", type: "textarea", localized: true, label: "Closing body", defaultValue: "You can't personalise a product you've never measured. It's a formula that doesn't exist until your biology has been read first." },
        { name: "closingTag", type: "text", localized: true, label: "Closing tag", admin: { description: "The small uppercase line at the very end." }, defaultValue: "Made for one" },
      ],
    },
    {
      name: "start", type: 'group',
      fields: [
        { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The hero's primary CTA points at \"#start\". Deliberately NOT localized." }, defaultValue: "start" },
        { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Headline", defaultValue: {
            "root": {
              "type": "root",
              "children": [
                {
                  "type": "heading",
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "So we start by reading yours.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h2"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, label: "Standfirst", defaultValue: "Your kit ships first. Your formula is produced after your analysis, never before." },
        {
          name: "coreCard", type: 'group', label: "Core plan", admin: { description: "The left card, neutral fill." },
          fields: [
            { name: "label", type: "text", localized: true, required: true, label: "Plan name", defaultValue: "Core" },
            { name: "price", type: "text", localized: true, label: "Price", admin: { description: "The large serif figure only \u2014 the period is the field below." }, defaultValue: "€99" },
            { name: "period", type: "text", localized: true, label: "Period", admin: { description: "The small \"/mo\" beside the price." }, defaultValue: "/mo" },
            { name: "body", type: "textarea", localized: true, label: "Body", defaultValue: "Gut reading and the formula built from it." },
            localizedLink({
              overrides: {
                  name: "cta",
                  label: "Button",
                  admin: { description: "The \u2197 is drawn by the button \u2014 do not type it into the label." },
                  defaultValue: {
                  "url": "protocol/Order your kit - Cycle Core.html",
                  "label": "Order Core kit"
                },
              },
            }),
          ],
        },
        {
          name: "advancedCard", type: 'group', label: "Advanced plan", admin: { description: "The right card, lime fill and lime ring. Set apart from Core on purpose, which is why the two are separate fields rather than a repeatable list." },
          fields: [
            { name: "badge", type: "text", localized: true, label: "Badge", admin: { description: "The pill straddling the top edge of the card. Leave it EMPTY and no pill is drawn." }, defaultValue: "Recommended" },
            { name: "label", type: "text", localized: true, required: true, label: "Plan name", defaultValue: "Advanced" },
            { name: "price", type: "text", localized: true, label: "Price", admin: { description: "The large serif figure only \u2014 the period is the field below." }, defaultValue: "€149" },
            { name: "period", type: "text", localized: true, label: "Period", defaultValue: "/mo" },
            { name: "body", type: "textarea", localized: true, label: "Body", defaultValue: "Gut and blood. Rebuilt every cycle from your data." },
            localizedLink({
              overrides: {
                  name: "cta",
                  label: "Button",
                  admin: { description: "The \u2197 is drawn by the button \u2014 do not type it into the label." },
                  defaultValue: {
                  "url": "protocol/Order your kit - Cycle Advanced.html",
                  "label": "Order Advanced kit"
                },
              },
            }),
          ],
        },
        { name: "note", type: "textarea", localized: true, label: "Pricing note", admin: { description: "The line under the two cards." }, defaultValue: "Start month-to-month at €99, cancel anytime. Longer-term discounts are available when you choose your duration at checkout." },
        {
          name: "assurances", type: 'array', label: "Assurances", admin: { description: "The ticked items on the rule at the foot of the section. The tick is drawn automatically \u2014 type only the sentence. The row wraps, so any number works." },
          defaultValue: [
            {
              "text": "Analysis included"
            },
            {
              "text": "Charged only on production"
            },
            {
              "text": "Cancel anytime"
            }
          ],
          fields: [
            { name: "text", type: "text", localized: true, required: true, label: "Assurance" },
          ],
        },
      ],
    },
  ],
}
