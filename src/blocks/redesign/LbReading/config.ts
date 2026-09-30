import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-06.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbReading.defaults.json, not retyped.
 *
 * The longest section on the page, and the only one with two pieces of state: which
 * of eight symptom patterns is selected, and whether the panel is showing teams or
 * ratios.
 *
 * WHAT IS STORED IS THE INPUT, NOT THE PICTURE. Each pattern holds six team
 * numbers, four ratio numbers, five pillar numbers and a score. Everything the
 * panel draws is derived from those in the component, exactly as the mockup's own
 * script derives it: each slider's handle position, the healthy band on its track,
 * the printed maximum, the in/over/under verdict, the warning ink, the dial's ring
 * colour, the band chip, and which pillar is highlighted as the lowest. Storing the
 * derived values instead would have been eleven more fields per pattern that an
 * editor could put out of step with the number they describe — a slider reading 30%
 * with its handle drawn at 70%.
 *
 * The numbers themselves are NOT in the DOM capture, and neither are seven of the
 * eight patterns: the section renders one at a time, so the capture holds one.
 * `tools/reading_content.py` reads them out of the bundle's own script by
 * EVALUATING it in node rather than regexing it — they are JavaScript literals with
 * unquoted keys, single quotes and typographic apostrophes inside strings, and
 * every regex that looks like it handles that is one sentence away from being
 * quietly wrong.
 *
 * That extraction is then CROSS-CHECKED against the captured DOM before it is
 * written: the six rendered team rows, the four ratio rows and the five pillar rows
 * in the capture must each come back out of the stored definitions and the first
 * pattern's numbers — same names, same "30–50%", same "30%", same note under the
 * dial. If the component's arithmetic disagreed with the mockup's, that check would
 * fail rather than the harness.
 *
 * The eight cards ARE a repeat, unlike the three read cards in #reads and the three
 * microbes in #method: every card is the same button with the same drawing, and the
 * only thing that varies is which one is selected. So the count is free.
 *
 * The two tabs are bound BY INDEX. There are exactly two panels written out below
 * them, so a repeat over a two-row array would have let an editor add a third tab
 * with nothing behind it.
 *
 * The slider handle takes its style from ONE computed object rather than ten style
 * variables per node. It is a design-system component driven entirely by custom
 * properties, identical on six team rows and four ratio rows, and writing it out
 * per node would have been forty chances for two sliders to disagree about what a
 * bubble is.
 *
 * Both panels bind their `display`. The capture holds tab 0, so the teams panel is
 * the one with NO inline display and the ratios panel carries `display:none` —
 * binding only the hidden one leaves the visible one permanently visible, which is
 * the failure the Our Plans data tabs shipped with.
 *
 * Each seal carries a long line and a short one because the design does: the long
 * one shows while the three sit side by side and rd-lb.css swaps in the short one
 * when they stack.
 */
export const RdLbReadingBlock: Block = {
  slug: "rdLbReading",
  interfaceName: "RdLbReadingBlock",
  labels: { singular: "RdLbReading", plural: "RdLbReading" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#reading\". Deliberately NOT localized." }, defaultValue: "reading" },
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
                  "text": "Four hundred Latin names, and the rest is your problem.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The paragraph under the headline." }, defaultValue: "That is what most microbiome tests deliver for around €150. A list, a percentage beside each name, and a cheerful note about eating more fibre. It looks like science. It is an inventory." },
    {
      name: "inventory", type: 'group', label: "The \u20ac150 card", admin: { description: "The dimmed card on the left: a label, a sample species list, the \"and 390 more\" line and a closing note. The species list is illustrative, not a real reading." },
      fields: [
        { name: "label", type: "text", localized: true, defaultValue: "What €150 usually buys" },
        {
          name: "species", type: 'array',
          defaultValue: [
            {
              "name": "Bacteroides uniformis",
              "value": "8.4%"
            },
            {
              "name": "Faecalibacterium prausnitzii",
              "value": "6.1%"
            },
            {
              "name": "Prevotella copri",
              "value": "5.7%"
            },
            {
              "name": "Eubacterium rectale",
              "value": "4.9%"
            },
            {
              "name": "Bacteroides vulgatus",
              "value": "4.3%"
            },
            {
              "name": "Roseburia intestinalis",
              "value": "3.8%"
            }
          ],
          fields: [
            { name: "name", type: "text", localized: true, required: true },
            { name: "value", type: "text", localized: true },
          ],
        },
        { name: "moreLabel", type: "text", localized: true, defaultValue: "+ 390 more species" },
        { name: "note", type: "textarea", localized: true, defaultValue: "Impressive to look at. Impossible to act on. And that is the entire deliverable." },
      ],
    },
    {
      name: "analysis", type: 'group', label: "Three passes", admin: { description: "The column beside the card: its own heading, a paragraph, and the three numbered passes. The numbers are typed, not counted by the design." },
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "An inventory is not an analysis." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Knowing you carry 4.3% Bacteroides vulgatus is trivia until someone works out what it is doing, who it is doing it with, and whether that is a problem. Most of the category stops before that, because a list is cheap to produce and looks like proof. We read it three ways instead." },
        {
          name: "passes", type: 'array',
          defaultValue: [
            {
              "number": "01",
              "title": "Sorted into teams",
              "body": "Not by name. By the job each species actually performs, then checked against the range that job should sit in."
            },
            {
              "number": "02",
              "title": "Weighed as ratios",
              "body": "Because a team can be the right size and still be losing. Four ratios show whether the cascade is doing its job."
            },
            {
              "number": "03",
              "title": "Settled into one score",
              "body": "Five pillars, one number, and the name of your weakest pillar. That is the one your formula is built to move."
            }
          ],
          fields: [
            { name: "number", type: "text", localized: true },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "mechanisms", type: 'group', label: "Eight mechanisms intro", admin: { description: "The heading and line that introduce the symptom cards." },
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "Every gut is unique. The patterns behind them are not." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Across more than 8,000 studied guts, the same symptoms keep tracing back to the same eight mechanisms. Each one needs a different formula." },
      ],
    },
    {
      name: "archetypes", type: 'array', label: "Symptom patterns", admin: { description: "Eight in the mockup, one per card, and the count is free \u2014 every card is the same button. Selecting one drives the whole panel below: the name, the explanation, every slider, the score dial and the phone. The three number lists must line up WITH the definitions further down: teams matches Team definitions, ratios matches Ratio definitions, pillars matches Pillar names. A short list leaves a slider reading zero." },
      defaultValue: [
        {
          "cardLabel": "Bloating and gas after meals",
          "name": "Protein fermentation running hot",
          "whats": "The protein-fermenting team has grown past its range. That tips the gut toward protein for fuel, which usually shows up as more gas and a less favourable mix of by-products.",
          "focus": "Crowd the protein-fermenters back out with competitive and antimicrobial strains, and tip fermentation back toward fibre.",
          "score": 58,
          "band": "Needs work",
          "note": "Lowest pillar: team balance. That is what the formula is built to move.",
          "teams": [
            {
              "value": 30
            },
            {
              "value": 16
            },
            {
              "value": 9
            },
            {
              "value": 3
            },
            {
              "value": 3
            },
            {
              "value": 11
            }
          ],
          "ratios": [
            {
              "value": 40
            },
            {
              "value": 55
            },
            {
              "value": 75
            },
            {
              "value": 30
            }
          ],
          "pillars": [
            {
              "value": 68
            },
            {
              "value": 82
            },
            {
              "value": 64
            },
            {
              "value": 62
            },
            {
              "value": 88
            }
          ]
        },
        {
          "cardLabel": "Slow to recover after antibiotics",
          "name": "Low bifido backbone",
          "whats": "Bifidobacteria are scarce, so the acetate base the rest of the ecosystem feeds on is thin. It is the most common pattern we see, in roughly 44% of samples.",
          "focus": "Rebuild the bifidobacteria with selective strains and fibres (GOS, inulin), so the rest of the chain has something to cross-feed on.",
          "score": 64,
          "band": "Needs work",
          "note": "Lowest pillar: health. That is what the formula is built to move.",
          "teams": [
            {
              "value": 35
            },
            {
              "value": 18
            },
            {
              "value": 9
            },
            {
              "value": 0.4
            },
            {
              "value": 2.5
            },
            {
              "value": 3
            }
          ],
          "ratios": [
            {
              "value": 75
            },
            {
              "value": 50
            },
            {
              "value": 78
            },
            {
              "value": 70
            }
          ],
          "pillars": [
            {
              "value": 72
            },
            {
              "value": 78
            },
            {
              "value": 82
            },
            {
              "value": 72
            },
            {
              "value": 100
            }
          ]
        },
        {
          "cardLabel": "Sluggish, heavy digestion",
          "name": "Weak fibre fermentation",
          "whats": "Fibre goes in but little comes of it. The fibre-to-butyrate chain is underfed, so there is little capacity left to turn it into butyrate.",
          "focus": "Restore the fibre-fermenting teams and the short-chain fatty acids they produce, with an oat beta-glucan-led blend.",
          "score": 60,
          "band": "Needs work",
          "note": "Lowest pillar: team balance. That is what the formula is built to move.",
          "teams": [
            {
              "value": 24
            },
            {
              "value": 8
            },
            {
              "value": 8
            },
            {
              "value": 4
            },
            {
              "value": 3
            },
            {
              "value": 4
            }
          ],
          "ratios": [
            {
              "value": 68
            },
            {
              "value": 35
            },
            {
              "value": 65
            },
            {
              "value": 62
            }
          ],
          "pillars": [
            {
              "value": 70
            },
            {
              "value": 75
            },
            {
              "value": 68
            },
            {
              "value": 66
            },
            {
              "value": 100
            }
          ]
        },
        {
          "cardLabel": "Sensitive gut, irritates easily",
          "name": "Mucus barrier wearing thin",
          "whats": "Mucus-layer bacteria have overgrown while the butyrate team runs thin, so the gut mucus layer tends to get used as fuel and left under-supported at the same time.",
          "focus": "Support the mucus layer and rebuild butyrate, easing the load on the mucus layer.",
          "score": 55,
          "band": "Needs work",
          "note": "Lowest pillar: team balance. That is what the formula is built to move.",
          "teams": [
            {
              "value": 29
            },
            {
              "value": 7
            },
            {
              "value": 8
            },
            {
              "value": 4
            },
            {
              "value": 8
            },
            {
              "value": 4
            }
          ],
          "ratios": [
            {
              "value": 70
            },
            {
              "value": 50
            },
            {
              "value": 40
            },
            {
              "value": 60
            }
          ],
          "pillars": [
            {
              "value": 62
            },
            {
              "value": 72
            },
            {
              "value": 70
            },
            {
              "value": 58
            },
            {
              "value": 95
            }
          ]
        },
        {
          "cardLabel": "Bloated every single day",
          "name": "Fibre processors crowded out",
          "whats": "One mucus-feeding strain, Akkermansia, has overgrown and crowded out the fibre-handling teams, so the butyrate chain falls away and the gut leans on its own lining for fuel.",
          "focus": "Give the fibre-handling teams room to expand and crowd the overgrown strain back out, with a high-load fibre blend.",
          "score": 50,
          "band": "Needs work",
          "note": "Lowest pillar: team balance. That is what the formula is built to move.",
          "teams": [
            {
              "value": 24
            },
            {
              "value": 8
            },
            {
              "value": 9
            },
            {
              "value": 3
            },
            {
              "value": 12
            },
            {
              "value": 5
            }
          ],
          "ratios": [
            {
              "value": 66
            },
            {
              "value": 48
            },
            {
              "value": 28
            },
            {
              "value": 58
            }
          ],
          "pillars": [
            {
              "value": 60
            },
            {
              "value": 68
            },
            {
              "value": 62
            },
            {
              "value": 52
            },
            {
              "value": 92
            }
          ]
        },
        {
          "cardLabel": "Low energy, many food triggers",
          "name": "Broad depletion",
          "whats": "Several teams are low at once, often after antibiotics or illness. The whole chain needs rebuilding, not a single fix.",
          "focus": "Re-seed the depleted teams together, rebuilding the whole chain rather than chasing one team at a time.",
          "score": 36,
          "band": "Needs work",
          "note": "Lowest pillar: team balance. That is what the formula is built to move.",
          "teams": [
            {
              "value": 18
            },
            {
              "value": 6
            },
            {
              "value": 4
            },
            {
              "value": 0.5
            },
            {
              "value": 3
            },
            {
              "value": 4
            }
          ],
          "ratios": [
            {
              "value": 55
            },
            {
              "value": 40
            },
            {
              "value": 55
            },
            {
              "value": 50
            }
          ],
          "pillars": [
            {
              "value": 62
            },
            {
              "value": 52
            },
            {
              "value": 60
            },
            {
              "value": 48
            },
            {
              "value": 100
            }
          ]
        },
        {
          "cardLabel": "Stress and poor sleep",
          "name": "Gut-brain stress signals",
          "whats": "The microbiome itself can read well here. This pattern comes from your questionnaire, not your composition: stress and sleep are pulling on the gut through the gut-brain axis.",
          "focus": "Bring in the Lpc-37 live-culture strain alongside whatever ecological work the reading needs.",
          "score": 84,
          "band": "Excellent",
          "note": "The score reads well. The work here is a targeted strain set, not an ecological rebuild.",
          "teams": [
            {
              "value": 34
            },
            {
              "value": 16
            },
            {
              "value": 9
            },
            {
              "value": 4
            },
            {
              "value": 2.5
            },
            {
              "value": 3.5
            }
          ],
          "ratios": [
            {
              "value": 80
            },
            {
              "value": 78
            },
            {
              "value": 82
            },
            {
              "value": 80
            }
          ],
          "pillars": [
            {
              "value": 84
            },
            {
              "value": 88
            },
            {
              "value": 86
            },
            {
              "value": 88
            },
            {
              "value": 100
            }
          ]
        },
        {
          "cardLabel": "No symptoms to report",
          "name": "In balance, holding steady",
          "whats": "All six teams sit within range and the ecosystem is carbohydrate-driven. No acute imbalance to correct.",
          "focus": "Protect a good ecosystem and keep it steady, rather than forcing change it does not need.",
          "score": 88,
          "band": "Excellent",
          "note": "The job here is to hold this, not disturb it.",
          "teams": [
            {
              "value": 38
            },
            {
              "value": 18
            },
            {
              "value": 9
            },
            {
              "value": 5
            },
            {
              "value": 2.5
            },
            {
              "value": 3
            }
          ],
          "ratios": [
            {
              "value": 85
            },
            {
              "value": 82
            },
            {
              "value": 85
            },
            {
              "value": 84
            }
          ],
          "pillars": [
            {
              "value": 86
            },
            {
              "value": 92
            },
            {
              "value": 90
            },
            {
              "value": 92
            },
            {
              "value": 100
            }
          ]
        }
      ],
      fields: [
        { name: "cardLabel", type: "text", localized: true, required: true },
        { name: "name", type: "text", localized: true, required: true },
        { name: "whats", type: "textarea", localized: true },
        { name: "focus", type: "textarea", localized: true },
        { name: "score", type: "number" },
        { name: "band", type: "text", localized: true },
        { name: "note", type: "textarea", localized: true },
        {
          name: "teams", type: 'array',
          fields: [
            { name: "value", type: "number" },
          ],
        },
        {
          name: "ratios", type: 'array',
          fields: [
            { name: "value", type: "number" },
          ],
        },
        {
          name: "pillars", type: 'array',
          fields: [
            { name: "value", type: "number" },
          ],
        },
      ],
    },
    { name: "resultLabel", type: "text", localized: true, label: "Panel eyebrow", admin: { description: "The small line above the selected pattern's name." }, defaultValue: "What is actually going on" },
    {
      name: "teamsTab", type: 'group', label: "Teams tab", admin: { description: "The first tab and the paragraph at the top of its panel." },
      fields: [
        { name: "label", type: "text", localized: true, defaultValue: "Teams" },
        { name: "blurb", type: "textarea", localized: true, defaultValue: "The 200–400 species in your sample, sorted into six teams by the job they do and checked against each team’s healthy range." },
      ],
    },
    {
      name: "ratiosTab", type: 'group', label: "Ratios tab", admin: { description: "The second tab and its paragraph. There are exactly two tabs and each has its own panel, so a third cannot be added here." },
      fields: [
        { name: "label", type: "text", localized: true, defaultValue: "Ratios" },
        { name: "blurb", type: "textarea", localized: true, defaultValue: "Team sizes show who is there. These four show whether the fermentation cascade is actually working." },
      ],
    },
    {
      name: "teamDefs", type: 'array', label: "Team definitions", admin: { description: "Six teams, in the order every pattern's `teams` numbers are read. `low` and `high` are the healthy range: they draw the band on the track, print the \"Healthy 30\u201350%\" line, and decide whether a reading is in, over or under range. The slider's maximum is derived from them, so nothing has to be kept in step by hand. Each team's colour is the design's and is not a field." },
      defaultValue: [
        {
          "name": "Fibre",
          "sub": "break down fibre",
          "low": 30,
          "high": 50
        },
        {
          "name": "Butyrate",
          "sub": "make butyrate",
          "low": 10,
          "high": 25
        },
        {
          "name": "Cross-feeders",
          "sub": "pass nutrients along",
          "low": 6,
          "high": 12
        },
        {
          "name": "Bifido",
          "sub": "feed the acetate base",
          "low": 2,
          "high": 10
        },
        {
          "name": "Mucus",
          "sub": "turn over the mucus layer",
          "low": 1,
          "high": 4
        },
        {
          "name": "Protein",
          "sub": "ferment protein",
          "low": 1,
          "high": 5
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "sub", type: "text", localized: true },
        { name: "low", type: "number" },
        { name: "high", type: "number" },
      ],
    },
    {
      name: "ratioDefs", type: 'array', label: "Ratio definitions", admin: { description: "Four ratios, in the order every pattern's `ratios` numbers are read. Each number is a percentage along the track from the bad end to the good one." },
      defaultValue: [
        {
          "name": "Main fuel preference",
          "bad": "Protein-driven",
          "good": "Carbohydrate-driven"
        },
        {
          "name": "Fermentation efficiency",
          "bad": "Stalled",
          "good": "Efficient"
        },
        {
          "name": "Gut-lining dependence",
          "bad": "Feeding on the lining",
          "good": "Diet-fed"
        },
        {
          "name": "Harsh by-products",
          "bad": "Putrefactive",
          "good": "SCFA-dominant"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "bad", type: "text", localized: true },
        { name: "good", type: "text", localized: true },
      ],
    },
    {
      name: "pillarNames", type: 'array', label: "Pillar names", admin: { description: "Five pillars, in the order every pattern's `pillars` numbers are read. The lowest one is highlighted automatically." },
      defaultValue: [
        {
          "name": "Health"
        },
        {
          "name": "Diversity"
        },
        {
          "name": "Metabolic"
        },
        {
          "name": "Team balance"
        },
        {
          "name": "Safety"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
      ],
    },
    {
      name: "sliderLabels", type: 'group', label: "Slider wording", admin: { description: "The words the sliders share: the reading label, the \"Healthy\" prefix, and the three verdicts. Changing a verdict here changes it on every row." },
      fields: [
        { name: "thisReading", type: "text", localized: true, defaultValue: "This reading" },
        { name: "healthyPrefix", type: "text", localized: true, defaultValue: "Healthy " },
        { name: "inRange", type: "text", localized: true, defaultValue: "In range" },
        { name: "overRange", type: "text", localized: true, defaultValue: "Over range" },
        { name: "underRange", type: "text", localized: true, defaultValue: "Under range" },
      ],
    },
    { name: "focusLabel", type: "text", localized: true, label: "Focus label", admin: { description: "The bolded lead-in to the selected pattern's focus line." }, defaultValue: "Where the formula would focus:" },
    {
      name: "phone", type: 'group', label: "Phone mock-up", admin: { description: "The phone beside the panel. Its score, band, pillars and note come from the selected pattern; only these labels are set here. The status glyphs in the corner are drawn by the design." },
      fields: [
        { name: "time", type: "text", localized: true, defaultValue: "9:00" },
        { name: "scoreLabel", type: "text", localized: true, defaultValue: "Your balance score" },
        { name: "outOfLabel", type: "text", localized: true, defaultValue: "out of 100" },
        { name: "caption", type: "text", localized: true, defaultValue: "Your reading in your nb1 account" },
      ],
    },
    { name: "phoneLogo", type: "upload", relationTo: "media", label: "Phone \u2014 logo", admin: { description: "The small nb1 mark in the mock-up's header." } },
    { name: "phoneAvatar", type: "upload", relationTo: "media", label: "Phone \u2014 avatar", admin: { description: "The round portrait in the mock-up's header. Decorative: it renders with an EMPTY alt whatever the media row says, because in a phone mock-up it is a picture of an account, not information. Seeded from the same file the homepage's science board uses, so it reuses that media row." } },
    {
      name: "seals", type: 'array', label: "Reference seals", admin: { description: "Three in the mockup. Each has a LONG line and a SHORT one: the long one shows while the three sit side by side, the short one replaces it when they stack, so both are real copy rather than one truncated." },
      defaultValue: [
        {
          "number": "8,069",
          "long": "gut metagenomes your reading is benchmarked against: a large, curated reference set.",
          "short": "reference metagenomes"
        },
        {
          "number": "26",
          "long": "countries represented in that set, so a healthy baseline is not drawn from one population.",
          "short": "countries in that set"
        },
        {
          "number": "155",
          "long": "signature species tracked against peer-reviewed references, in every reading.",
          "short": "signature species tracked"
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true, required: true },
        { name: "long", type: "textarea", localized: true },
        { name: "short", type: "text", localized: true },
      ],
    },
  ],
}
