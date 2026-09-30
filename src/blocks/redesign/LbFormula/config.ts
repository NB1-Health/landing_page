import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-07.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbFormula.defaults.json, not retyped.
 *
 * Four numbered steps down a rail: what goes in, the strain library, the fibre
 * library and dose window, and the supplement layer on top.
 *
 * THREE DIFFERENT ANSWERS TO THE SAME-LOOKING QUESTION, and the mockup decides
 * each one:
 *
 *   * the THIRTEEN FIBRES are a real repeat. Thirteen identical rows, a name and
 *     an optional code, no drawing in any of them — so the count is free.
 *   * the THREE DEFINITIONS in step 1 and the TWO COUNTS in step 4 are bound by
 *     index. Each definition carries its own colour dot, a radial gradient in a
 *     different colour, and a repeat takes its children from the template: all
 *     three would have come out dark brown. Same reasoning as #reads' cards and
 *     #method's state key.
 *   * the STRAIN LIBRARY is bound by index into a NESTED shape. The mockup writes
 *     three genus headers and ten species rows as FLAT SIBLINGS, interleaved, each
 *     genus header with its own dot. Binding them by index keeps the DOM exactly
 *     as the mockup wrote it, while `strainGroups` still reads as three genera
 *     with their species rather than two unrelated lists whose positions have to
 *     be kept in step by hand.
 *
 * THREE BOLD PASSAGES, TWO DIFFERENT TREATMENTS. `We use <b>strains</b>:` is
 * emphasis on one word inside a sentence, so it is rich text — splitting it into
 * before/word/after would fix the word at an offset and break the first time a
 * translator moved it. The other two bold passages are WHOLE SENTENCES that also
 * carry a colour the rest of their paragraph does not (full strength against a
 * dimmed line), so they keep their `<b>` and take their own field: the split falls
 * between two sentences, which survives translation, and the colour survives with
 * the markup.
 *
 * `.rd-lb b` puts rich-text bold back to 500. Payload's bold has no inline style
 * and would render at the browser's 700; measured on the mockup, all six `<b>` on
 * this page compute to 500 and none to anything else. The rule cannot reach the
 * mockup's own bolds — those carry `font-weight: 500` inline, and inline wins.
 *
 * The two SVGs are drawings and stay verbatim. The synbiotic diagram has a real
 * `aria-label`, so that is a field; the dose chart is `aria-hidden` in the mockup
 * because the block underneath says the same thing in words — which is also why
 * that block is fields and not decoration.
 *
 * The Advanced line is rich text: its link sits at the end of the sentence and
 * reads as part of it, the same reasoning rdPrHero's trust line used.
 */
export const RdLbFormulaBlock: Block = {
  slug: "rdLbFormula",
  interfaceName: "RdLbFormulaBlock",
  labels: { singular: "RdLbFormula", plural: "RdLbFormula" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#formula\". Deliberately NOT localized." }, defaultValue: "formula" },
    { name: "eyebrow", type: "text", localized: true, label: "Eyebrow", admin: { description: "The small line above the headline." }, defaultValue: "We build it" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Heading", admin: { description: "The section headline." }, defaultValue: {
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
                  "text": "A formula built around what your gut can actually use.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The paragraph under the headline." }, defaultValue: "Once we can see what your gut can do, we build one formula for it and nothing else. No two formulas come out the same, because no two readings are. Here is what goes into one, and how every choice gets made." },
    {
      name: "steps", type: 'array', label: "Step headers", admin: { description: "FOUR, in order: the numbered marker and its label on each step of the rail. Each step's body is written out separately below, so a fifth row would add a header with nothing under it. The numbers are typed, not counted by the design." },
      defaultValue: [
        {
          "number": "01",
          "label": "First, the basics"
        },
        {
          "number": "02",
          "label": "The cultures, up close"
        },
        {
          "number": "03",
          "label": "Precision prebiotics"
        },
        {
          "number": "04",
          "label": "Everything on top"
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true },
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
    {
      name: "basics", type: 'group', label: "Step 1 \u2014 the basics", admin: { description: "The body line, the diagram's alt text, and the three definitions under it. EXACTLY THREE definitions: each carries its own colour dot, which is a drawing, so a fourth would save fine and render the first one's colour." },
      fields: [
        { name: "body", type: "textarea", localized: true, defaultValue: "The live cultures and prebiotic in your formula, dosed to work as one and decided by your reading." },
        { name: "figureAlt", type: "text", localized: true, defaultValue: "A live culture washes through on its own; paired with the right prebiotic fibre, it stays and works" },
        {
          name: "defs", type: 'array',
          defaultValue: [
            {
              "name": "Live cultures",
              "desc": "Living bacteria you add to the gut, to top up the teams that are running short."
            },
            {
              "name": "Prebiotics",
              "desc": "The fibre those bacteria feed on. Their food source, nothing more complicated."
            },
            {
              "name": "Combined",
              "desc": "Both together: the exact fibre these strains can use, in the right amount, so they work as one system."
            }
          ],
          fields: [
            { name: "name", type: "text", localized: true, required: true },
            { name: "desc", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "cultures", type: 'group', label: "Step 2 \u2014 the cultures", admin: { description: "The heading, the intro, and the library card's label, title and closing note. The intro is RICH TEXT because its emphasis is on one word inside the sentence." },
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "Every strain we use, by name." },
        { name: "intro", type: "richText", localized: true, editor: redesignInlineEditor, defaultValue: {
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
                      "text": "We do not add generic bacteria. We use ",
                      "version": 1
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 1,
                      "mode": "normal",
                      "style": "",
                      "text": "strains",
                      "version": 1
                    },
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": ": specific, named, trademarked versions of a bacterium, each with its own published research. A label that reads “probiotic blend” is naming none of this. Here is every one we work with.",
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
        { name: "libraryLabel", type: "text", localized: true, defaultValue: "The full library" },
        { name: "libraryTitle", type: "text", localized: true, defaultValue: "All 19 strains" },
        { name: "note", type: "textarea", localized: true, defaultValue: "One formula draws on a handful of these, chosen by your reading, never by what we have in stock." },
      ],
    },
    {
      name: "genera", type: 'array', label: "Strain library", admin: { description: "THREE genera with their species, and the counts are fixed by the markup: three genus headers and ten species rows are written out flat, in that order, each genus header with its own colour dot. Adding a species here renders nothing \u2014 the row has to exist in the block first." },
      defaultValue: [
        {
          "genus": "Bifidobacterium",
          "species": [
            {
              "name": "animalis lactis",
              "codes": "B420 · BB-12 · HN019"
            },
            {
              "name": "longum",
              "codes": "BI-05 · 04 · 1714"
            },
            {
              "name": "breve",
              "codes": "BR03 · B632"
            }
          ]
        },
        {
          "genus": "Lactobacillus",
          "species": [
            {
              "name": "rhamnosus",
              "codes": "GG"
            },
            {
              "name": "acidophilus",
              "codes": "NCFM · LA-5"
            },
            {
              "name": "paracasei",
              "codes": "Lpc-37 · UALpc-04"
            },
            {
              "name": "plantarum",
              "codes": "299v · UALp-05 · Lpla33"
            },
            {
              "name": "reuteri",
              "codes": "UALre-16"
            },
            {
              "name": "casei",
              "codes": "431"
            }
          ]
        },
        {
          "genus": "Streptococcus",
          "species": [
            {
              "name": "thermophilus",
              "codes": "UASt-09"
            }
          ]
        }
      ],
      fields: [
        { name: "genus", type: "text", localized: true, required: true },
        {
          name: "species", type: 'array',
          fields: [
            { name: "name", type: "text", localized: true, required: true },
            { name: "codes", type: "text", localized: true },
          ],
        },
      ],
    },
    {
      name: "prebiotics", type: 'group', label: "Step 3 \u2014 the fibres", admin: { description: "The heading, the intro, the library card's label and title, the dose-window label, the three words under the dose bars, and the closing note. The note is split into a bold lead sentence and the rest, because the design sets the lead at full strength against a dimmed paragraph." },
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "A strain we add is only worth adding if we feed it." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Every strain arrives paired with the exact fibre it feeds on. Which fibres, and how much of each, follows how your gut ferments — the same fibre behaves differently in every gut. Generic fibre is a guess. This is matched and measured." },
        { name: "libraryLabel", type: "text", localized: true, defaultValue: "The full library" },
        { name: "libraryTitle", type: "text", localized: true, defaultValue: "All 13 fibres" },
        { name: "doseLabel", type: "text", localized: true, defaultValue: "Your dose window" },
        { name: "doseTooLittle", type: "text", localized: true, defaultValue: "Too little" },
        { name: "doseRight", type: "text", localized: true, defaultValue: "Right for you" },
        { name: "doseTooMuch", type: "text", localized: true, defaultValue: "Too much" },
        { name: "noteLead", type: "text", localized: true, defaultValue: "A few fibres, chosen from dozens." },
        { name: "noteRest", type: "textarea", localized: true, defaultValue: " Only the ones your strains can actually use, each paired to the strain it feeds and dosed to the range you handle. Too little does nothing, too much brings the bloat. Two people never get the same blend." },
      ],
    },
    {
      name: "fibres", type: 'array', label: "Fibre library", admin: { description: "Thirteen in the mockup. The count is FREE \u2014 these repeat properly. The code on the right is optional; several fibres have none." },
      defaultValue: [
        {
          "name": "Inulin"
        },
        {
          "name": "Galacto-oligosaccharides",
          "code": "GOS"
        },
        {
          "name": "Chicory Root Fibre",
          "code": "FOS"
        },
        {
          "name": "Oat Beta-Glucan"
        },
        {
          "name": "Partially Hydrolysed Guar Gum",
          "code": "PHGG"
        },
        {
          "name": "Resistant Starch",
          "code": "Hi-Maize"
        },
        {
          "name": "Psyllium Husk"
        },
        {
          "name": "Konjac Glucomannan"
        },
        {
          "name": "Acacia Fibre"
        },
        {
          "name": "Apple Pectin"
        },
        {
          "name": "Carob Bean Extract",
          "code": "soluble"
        },
        {
          "name": "Chitosan"
        },
        {
          "name": "Xanthan Gum"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "code", type: "text", localized: true },
      ],
    },
    {
      name: "doseFibres", type: 'array', label: "Dose bars", admin: { description: "The readable stand-in for the dose chart, shown when the chart is too narrow to read. `at` is where the handle sits on the track, as a percentage from 0 to 100 \u2014 the shaded band runs from 28% to 72%, so a value outside that reads as out of range." },
      defaultValue: [
        {
          "name": "GOS",
          "at": 40
        },
        {
          "name": "Inulin",
          "at": 52
        },
        {
          "name": "PHGG",
          "at": 34
        },
        {
          "name": "Beta-glucans",
          "at": 46
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "at", type: "number" },
      ],
    },
    {
      name: "layer", type: 'group', label: "Step 4 \u2014 everything on top", admin: { description: "The heading, the intro, and the whole supplement card: its label, title and body, the two counts, the example chips, the three things that decide the layer,. The Advanced callout below it is its own group, because in the mockup it sits OUTSIDE this card as a sibling." },
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "Made for one. Everything else is everyone else's." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "The cultures and their fibres are the base. On top comes the rest of a 98-ingredient library, and only the parts your life asks for." },
        { name: "chosenLabel", type: "text", localized: true, defaultValue: "Chosen from 66" },
        { name: "title", type: "text", localized: true, defaultValue: "The supplement layer" },
        { name: "body", type: "textarea", localized: true, defaultValue: "Twenty-one vitamins and minerals, forty-five botanicals and compounds, every one of them vetted by our science board before it enters the library. Your formula draws only the ones your goals, lifestyle and diet call for." },
        {
          name: "stats", type: 'array',
          defaultValue: [
            {
              "number": "21",
              "label": "Vitamins & minerals"
            },
            {
              "number": "45",
              "label": "Botanicals & compounds"
            }
          ],
          fields: [
            { name: "number", type: "text", localized: true, required: true },
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        { name: "chipsLabel", type: "text", localized: true, defaultValue: "A few of them" },
        {
          name: "chips", type: 'array',
          defaultValue: [
            {
              "label": "Omega-3 + D3"
            },
            {
              "label": "B-complex"
            },
            {
              "label": "Magnesium"
            },
            {
              "label": "Zinc"
            },
            {
              "label": "Ashwagandha"
            },
            {
              "label": "Curcumin"
            },
            {
              "label": "and more"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        { name: "driversLabel", type: "text", localized: true, defaultValue: "What decides it" },
        {
          name: "drivers", type: 'array',
          defaultValue: [
            {
              "title": "Your goals",
              "body": "What you have said you want to work on, in your own words."
            },
            {
              "title": "Your intake form",
              "body": "What you already take, your diet and lifestyle, and anything a doctor should know."
            },
            {
              "title": "What we screen for",
              "body": "The shortfalls common enough to check regardless of what you asked for."
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "advanced", type: 'group', label: "Advanced callout", admin: { description: "The orange-outlined tag and the line beside it, under the supplement card. The link is its own field rather than part of the sentence: it is a call to action after the full stop, and keeping it separate preserves the underline the mockup draws on it." },
      fields: [
        { name: "tag", type: "text", localized: true, defaultValue: "Advanced only" },
        { name: "text", type: "textarea", localized: true, defaultValue: "A blood panel then tunes these doses to levels we can measure, rather than to symptoms. " },
        localizedLink({
          overrides: {
              name: "link",
              defaultValue: {
              "url": "#advanced",
              "label": "What Advanced adds →"
            },
          },
        }),
      ],
    },
    { name: "closingLead", type: "textarea", localized: true, label: "Closing line", admin: { description: "The last line of the section, up to the bold sentence." }, defaultValue: "Every item traces back to something we read or something you told us. " },
    { name: "closingEmphasis", type: "text", localized: true, label: "Closing line \u2014 bold", admin: { description: "The bold sentence that ends it. Set at full strength against the dimmed line before it, which is why it is its own field rather than rich-text emphasis." }, defaultValue: "Nothing is in there by default." },
  ],
}
