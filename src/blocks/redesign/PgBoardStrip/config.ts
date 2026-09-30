import type { Block } from 'payload'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-07.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgBoardStrip.defaults.json, not retyped.
 *
 * The science board band: three overlapping portraits, a sentence, and an inline
 * link, between rules top and bottom.
 *
 * A NEW block rather than a reuse of rdPgHero's trust cluster. They share the same
 * three portrait FILES — byte-identical, so the seed names them by the filenames
 * the homepage already uploaded and upsertMedia reuses those media rows — but
 * nothing else. The hero's cluster sits inside the hero's own grid with a headline
 * and a detail line beside it, at 44px after the deviation asked for there; this is
 * a full-width band with its own 1240px wrapper, rules above and below, one
 * sentence and a link, at the mockup's 46px. Reusing the hero with a variant would
 * have meant carrying the hero's layout into a band that has none of it.
 *
 * The link is an element CHILD of the note, not a separate line, because it carries
 * its own colour and blue underline. So the note is bound with `ownText` — the bare
 * text runs are the field and the <a> stays an element. Binding `text` there would
 * have deleted the link.
 *
 * The note's default ends with a trailing space. That space is the mockup's own and
 * is the only thing separating the sentence from the link, so it is preserved
 * verbatim rather than trimmed.
 *
 * The overlap is an index rule (`avIdx === 0 ? undefined : '-14px'`) rather than
 * three hand-maintained styles: a repeat renders ONE template, the mockup's first
 * face is the only one without the negative margin, and an index rule keeps the
 * stack correct at any number of faces.
 */
export const RdPgBoardStripBlock: Block = {
  slug: "rdPgBoardStrip",
  interfaceName: "RdPgBoardStripBlock",
  labels: { singular: "PG BoardStrip", plural: "PG BoardStrip" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the element id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." } },
    {
      name: "avatars", type: 'array', label: "Faces", admin: { description: "The science board members shown as an overlapping stack. Any number works; the first sits flush and every one after it laps 14px over the one before." },
      defaultValue: [
        {
          "photo": null
        },
        {
          "photo": null
        },
        {
          "photo": null
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media", label: "Portrait", admin: { description: "Cropped to a circle and anchored to the top of the frame, as in the mockup." } },
      ],
    },
    { name: "note", type: "text", localized: true, label: "Note", admin: { description: "The sentence before the link. It ends with a space \u2014 that space is what separates it from the link, so keep it when translating." }, defaultValue: "Reviewed by our science board before manufacture. " },
    localizedLink({
      overrides: {
          name: "cta",
          label: "Link",
          admin: { description: "Sits inline at the end of the note, underlined in blue." },
          defaultValue: {
          "url": "#",
          "label": "Meet the board →"
        },
      },
    }),
  ],
}
