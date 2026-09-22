import type { CollectionConfig } from 'payload'

/**
 * The redesign site footer.
 *
 * A NEW COLLECTION for the same reason as RdHeaders: `footers` drives every live
 * page and carries theme variants, A/B variants and a link-colour matrix this
 * design has no use for. Field names echo it where they overlap — logo, tagline,
 * legalLinks, copyright, disclaimer — so the vocabulary is familiar.
 *
 * THE SIGN-UP FORM IS NOT WIRED. The markup is reproduced and its submit is
 * prevented, so nothing is silently swallowed. The repo already has the
 * integration to use: `footers.form` is a relationship to a Payload Form Builder
 * form, labelled "Klaviyo Form (Payload submission)". The same relationship
 * belongs here once the wiring is done — it is on the punch list, and until then
 * the box deliberately collects nothing.
 *
 * The three link columns are three separate arrays rather than one array of
 * columns. The mockup gives them different lengths and the headings are fixed
 * copy, not data; three arrays keep each list growable without an editor having
 * to reason about a nested structure.
 *
 * Every default is the mockup's own value, derived by tools/defaults.py.
 */
export const RdFooters: CollectionConfig = {
  slug: 'rd-footers',
  labels: { singular: 'RD Footer', plural: 'RD Footers' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isDefault', 'updatedAt'],
    group: 'Redesign',
    description: 'Footer for the redesign pages. A page picks one; otherwise the default is used.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: "Internal name",
      admin: { description: "Shown in the admin list only. Never rendered." },
      defaultValue: "Redesign footer",
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Use when a page picks none',
      defaultValue: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: "Logo",
    },
    {
      name: 'tagline',
      type: 'textarea',
      localized: true,
      label: "Tagline",
      defaultValue: "Diagnostic-first supplements, built from your own biology and made only after your data is in.",
    },
    {
      name: 'signupLabel',
      type: 'text',
      localized: true,
      label: "Sign-up heading",
      defaultValue: "Stay in the loop",
    },
    {
      name: 'signupPlaceholder',
      type: 'text',
      localized: true,
      label: "Sign-up placeholder",
      defaultValue: "Your email",
    },
    {
      name: 'signupInputLabel',
      type: 'text',
      localized: true,
      label: "Sign-up field label",
      admin: { description: "Read by screen readers; the input shows the placeholder." },
      defaultValue: "Your email",
    },
    {
      name: 'signupButtonLabel',
      type: 'text',
      localized: true,
      label: "Sign-up button",
      admin: { description: "The arrow glyph is drawn by the button — do not type it." },
      defaultValue: "Sign up",
    },
    {
      name: 'signupNote',
      type: 'textarea',
      localized: true,
      label: "Sign-up note",
      defaultValue: "Occasional notes on the science and the product. No spam.",
    },
    {
      name: 'columnOneTitle',
      type: 'text',
      localized: true,
      label: "Column 1 heading",
      defaultValue: "How it works",
    },
    {
      name: 'columnOneLinks',
      type: 'array',
      label: "Column 1 links",
      admin: { description: "First footer column." },
      defaultValue: [
        {
          "label": "Your biology",
          "url": "#biology"
        },
        {
          "label": "The lab",
          "url": "The Lab.dc.html"
        },
        {
          "label": "The protocol",
          "url": "The Protocol.dc.html"
        },
        {
          "label": "The ingredient library",
          "url": "#"
        },
        {
          "label": "The science board",
          "url": "#lab"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'columnTwoTitle',
      type: 'text',
      localized: true,
      label: "Column 2 heading",
      defaultValue: "Plans & kits",
    },
    {
      name: 'columnTwoLinks',
      type: 'array',
      label: "Column 2 links",
      admin: { description: "Second footer column." },
      defaultValue: [
        {
          "label": "Our plans",
          "url": "Our Plans.dc.html"
        },
        {
          "label": "Order your kit",
          "url": "#close"
        },
        {
          "label": "Our standards",
          "url": "#"
        },
        {
          "label": "Longevity Study",
          "url": "#"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'columnThreeTitle',
      type: 'text',
      localized: true,
      label: "Column 3 heading",
      defaultValue: "nb1",
    },
    {
      name: 'columnThreeLinks',
      type: 'array',
      label: "Column 3 links",
      admin: { description: "Third footer column." },
      defaultValue: [
        {
          "label": "About nb1",
          "url": "#"
        },
        {
          "label": "FAQ",
          "url": "#"
        },
        {
          "label": "Contact",
          "url": "#"
        },
        {
          "label": "Log in",
          "url": "#"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      label: "Copyright line",
      defaultValue: "© 2026 nb1 Health GmbH",
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: "Legal links",
      admin: { description: "The row beside the copyright." },
      defaultValue: [
        {
          "label": "Privacy",
          "url": "#"
        },
        {
          "label": "Cookies",
          "url": "#"
        },
        {
          "label": "Terms",
          "url": "#"
        },
        {
          "label": "Imprint",
          "url": "#"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Social link',
      admin: { description: "The arrow is part of the label in the mockup, so it is typed here rather than drawn." },
      fields: [
        { name: 'label', type: 'text', localized: true, defaultValue: "Instagram ↗" },
        { name: 'url', type: 'text', localized: true, defaultValue: "#" },
      ],
    },
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
      label: "Disclaimer",
      defaultValue: "nb1 is a wellness and lifestyle subscription. Sequencing insights are informational and do not constitute medical advice. Supplements are not intended to diagnose, treat, cure, or prevent any disease. If you are pregnant, nursing, or taking medication, consult your healthcare provider before use. Formulas are generated from sequencing data and approved by a qualified researcher prior to manufacture.",
    },
  ],
}

export default RdFooters
