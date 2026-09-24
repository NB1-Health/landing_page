import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-09.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbBoard.defaults.json, not retyped.
 *
 * The science board: four stats, the lead scientist, a rail of four more, and a
 * blue band at the foot for the two independent validators.
 *
 * It is NOT Our Plans' board block with different words. Measured before building:
 * 12% outline similarity against Our Plans and 6% against the homepage — the two
 * lowest numbers of any section on this page. This one carries a stat grid, a
 * full-width lead treatment, a horizontally scrolling rail and a second banded
 * sub-section none of the others have.
 *
 * EVERYTHING HERE REPEATS, which is unusual on this page. The stat cards, the team
 * rail, the validators and both pill lists are all real repeats: every row is the
 * same row, nothing inside any of them is a drawing, and the only thing that
 * varies between them is a photograph, which is a field. So every count is free
 * and the field descriptions say so, instead of warning that an extra row would
 * render nothing. Compare #reads, #method and #advanced, where three different
 * icons per section forced index binding.
 *
 * The lead scientist is a GROUP, not the first row of the rail. The mockup writes
 * that block out on its own with a wider portrait, a role tag, a bio and a pill
 * list the rail's cells do not have.
 *
 * FOUR TEAM MEMBERS, NOT THREE. The mockup's `hint-placeholder-count` says three
 * and its data has four; the rendered page has four, so four is what ships. The
 * hint is the authoring tool's preview count, not the design.
 *
 * Every portrait is a CSS background on a `role="img"` element rather than an
 * `<img>`, so each one's `aria-label` is bound to its media row's alt text and
 * there is no second field for it. The lead's photograph is byte-identical to the
 * homepage's `rd-lab-polina.png` and reuses that media row rather than seeding a
 * second copy — and unlike the phone avatar in #reading, here it IS informational,
 * so the alt is read off the row rather than forced empty.
 *
 * `checked.title` is called `title` rather than `heading` because the heading-tag
 * flag keys on the bare field name: two fields called `heading` at different
 * levels would have shared one tag, and this one is an h3 while the section's is
 * an h2.
 */
export const RdLbBoardBlock: Block = {
  slug: "rdLbBoard",
  interfaceName: "RdLbBoardBlock",
  labels: { singular: "RdLbBoard", plural: "RdLbBoard" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#board\". Deliberately NOT localized." }, defaultValue: "board" },
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
                  "text": "The minds behind your formula.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The paragraph under the headline." }, defaultValue: "The science here is young, and reading a gut this deeply sits at its edge. So we built a board to govern it: researchers who design the method, run it, and check it from outside, and hold every formula to what the evidence backs, not what a label would like to claim." },
    {
      name: "stats", type: 'array', label: "Board stats", admin: { description: "Four in the mockup, in a two-by-two grid. The count is FREE \u2014 every card is the same card and nothing in it is drawn per row." },
      defaultValue: [
        {
          "number": "7",
          "label": "Specialists"
        },
        {
          "number": "3",
          "label": "Universities"
        },
        {
          "number": "290+",
          "label": "Publications"
        },
        {
          "number": "17,000+",
          "label": "Citations"
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true, required: true },
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
    { name: "teamLabel", type: "text", localized: true, label: "Team eyebrow", admin: { description: "The small line above the team block." }, defaultValue: "The team that builds it" },
    { name: "teamIntro", type: "textarea", localized: true, label: "Team intro", admin: { description: "The paragraph under it." }, defaultValue: "One pipeline, the same hands every time: the people who read your sample, work out what it means, and hold the build to clinical standards." },
    { name: "leadPhoto", type: "upload", relationTo: "media", label: "Lead \u2014 portrait", admin: { description: "Its ALT TEXT is what screen readers announce, because the mockup draws it as a CSS background on a role=\"img\" element rather than an <img> \u2014 so set the alt on the media row, not here." } },
    {
      name: "lead", type: 'group', label: "Lead scientist", admin: { description: "The one person given the full-width treatment. Written out on its own in the mockup rather than being the first row of the rail, so it is its own group." },
      fields: [
        { name: "role", type: "text", localized: true, defaultValue: "Chief Scientific Officer" },
        { name: "name", type: "text", localized: true, defaultValue: "Dr. Polina Novikova" },
        { name: "cred", type: "textarea", localized: true, defaultValue: "PhD Bioinformatics, University of Luxembourg. Designs and runs the nb1 science pipeline end to end." },
        { name: "quote", type: "textarea", localized: true, defaultValue: "“The hard part of this work is leaving things out. If your reading doesn’t call for an ingredient, it isn’t in your formula, however good it looks on a label.”" },
        {
          name: "pills", type: 'array',
          defaultValue: [
            {
              "label": "PhD Bioinformatics"
            },
            {
              "label": "Uni. of Luxembourg"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
    {
      name: "team", type: 'array', label: "The team rail", admin: { description: "Four in the mockup. The count is FREE \u2014 every cell is the same card and the only thing that varies is the photograph, which is a field. Each portrait's alt is read off its media row." },
      defaultValue: [
        {
          "photo": null,
          "field": "Bioinformatics",
          "name": "Dr. Monica S. Matchado",
          "cred": "Microbiome functional profiling, TU Munich",
          "quote": "“Anyone can list the bacteria in a sample. The real work is reading what that community is set up to do, because that’s what we build from.”"
        },
        {
          "photo": null,
          "field": "Immunology & gut health",
          "name": "Dr. Marijn Lewis",
          "cred": "PhD Biomedical Sciences, University of Zurich",
          "quote": "“An average is comfortable and almost always wrong for the person in front of you. Reading one gut properly is the only way to act on it.”"
        },
        {
          "photo": null,
          "field": "Clinical research",
          "name": "Katia B. Otterstedt",
          "cred": "Clinical research & genomics, ECLIN",
          "quote": "“A result you can’t reproduce isn’t a result. Every step from sample to formula has to hold up to the same checks, twice.”"
        },
        {
          "photo": null,
          "field": "Bioinformatics",
          "name": "Dr. Irina Utkina",
          "cred": "Gut Microbiome Science · University of Toronto",
          "quote": "“Personalised nutrition starts with understanding the microbiome beyond which microbes are present: what they are doing, how they affect health, and what we can change.”"
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media" },
        { name: "field", type: "text", localized: true },
        { name: "name", type: "text", localized: true, required: true },
        { name: "cred", type: "text", localized: true },
        { name: "quote", type: "textarea", localized: true },
      ],
    },
    {
      name: "checked", type: 'group', label: "Independently checked", admin: { description: "The blue band at the foot of the section: its eyebrow, heading, paragraph, and the tag that appears on every validator." },
      fields: [
        { name: "label", type: "text", localized: true, defaultValue: "Independently checked" },
        { name: "title", type: "richText", localized: true, editor: makeRedesignHeadingEditor(['h3']), defaultValue: {
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
                      "text": "Two of Europe’s most senior microbiome scientists review and challenge the method, with no stake in nb1.",
                      "version": 1
                    }
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "version": 1,
                  "tag": "h3"
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1
            }
          } },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Their job is to find where the science reaches further than the evidence allows, and to say so, before any of it reaches your formula." },
        { name: "validatorTag", type: "text", localized: true, defaultValue: "Independent validator" },
      ],
    },
    {
      name: "validators", type: 'array', label: "Independent validators", admin: { description: "Two in the mockup, and the count is free. Each carries its own pill list, which is also free." },
      defaultValue: [
        {
          "photo": null,
          "name": "Prof. Dr. Dirk Haller",
          "cred": "Nutrition & Immunology · ZIEL Institute Director, TU Munich",
          "quote": "“My role is to look for where the science is stretched too far. I keep agreeing to stay because, so far, it holds.”",
          "pills": [
            {
              "label": "TU Munich"
            },
            {
              "label": "ZIEL Director"
            },
            {
              "label": "UEG Prize"
            }
          ]
        },
        {
          "photo": null,
          "name": "Dr. Koen Venema",
          "cred": "Gut Microbiology · Wageningen University",
          "quote": "“Plenty of products call themselves personalised. Building from a real reading of the ecosystem is a different thing entirely, and it shows in the formula.”",
          "pills": [
            {
              "label": "254 publications"
            },
            {
              "label": "17,000+ citations"
            }
          ]
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media" },
        { name: "name", type: "text", localized: true, required: true },
        { name: "cred", type: "text", localized: true },
        { name: "quote", type: "textarea", localized: true },
        {
          name: "pills", type: 'array',
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
  ],
}
