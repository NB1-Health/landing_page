import type { CollectionConfig } from 'payload'

import { localizedLink } from '@/fields/localizedLink'

/**
 * The redesign site header.
 *
 * A NEW COLLECTION, deliberately — not a variant of `headers`. That collection
 * drives every page on the live site and its client component is 1,200 lines of
 * A/B variants, section nav, journal nav and dropdowns. Adding a redesign shape
 * to it would put the whole site behind one more branch. This one carries only
 * what the redesign nav draws.
 *
 * The field names deliberately ECHO `headers` — logo, navItems, discover*,
 * login*, cta — so an editor moving between them is not relearning a vocabulary.
 *
 * WHAT IS NOT HERE: the language list. The switcher is the real one, shared with
 * the live header through `useLocaleCurrency`, so its languages and currencies
 * come from that hook rather than from content. Only the menu's two labels are
 * editorial.
 *
 * Every default is the mockup's own value, derived by tools/defaults.py — create
 * a header, save it, and the design is already there.
 */
export const RdHeaders: CollectionConfig = {
  slug: 'rd-headers',
  labels: { singular: 'RD Header', plural: 'RD Headers' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isDefault', 'updatedAt'],
    group: 'Redesign',
    description: 'Header for the redesign pages. A page picks one; otherwise the default is used.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: "Internal name",
      admin: { description: "Shown in the admin list only. Never rendered." },
      defaultValue: "Redesign header",
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
      label: "Logo (dark type)",
      admin: { description: "For a light nav. The mockup carries both and swaps them by breakpoint." },
    },
    {
      name: 'logoLight',
      type: 'upload',
      relationTo: 'media',
      label: "Logo (light type)",
      admin: { description: "For a dark nav, and in the mobile sheet." },
    },
    {
      name: 'sheetWatermark',
      type: 'upload',
      relationTo: 'media',
      label: "Sheet watermark",
      admin: { description: "The faint mark behind the mobile menu. Decorative, 14% opacity." },
    },
    {
      name: 'homeUrl',
      type: 'text',
      localized: true,
      label: "Logo link",
      defaultValue: "#top",
    },
    {
      name: 'navItems',
      type: 'array',
      label: "Primary links",
      admin: { description: "The links across the nav. They are ALSO the mobile sheet's first group — one list, two places." },
      defaultValue: [
        {
          "label": "Your Biology",
          "url": "Your Biology.dc.html"
        },
        {
          "label": "The Lab",
          "url": "The Lab.dc.html"
        },
        {
          "label": "The Protocol",
          "url": "The Protocol.dc.html"
        },
        {
          "label": "Our Plans",
          "url": "Our Plans.dc.html"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'discoverLabel',
      type: 'text',
      localized: true,
      label: "Discover button",
      defaultValue: "Discover",
    },
    {
      name: 'discoverItems',
      type: 'array',
      label: "Discover menu",
      admin: { description: "The desktop dropdown. NOT the sheet's second group — that is a separate list, because the mockup gives them different members and different destinations." },
      defaultValue: [
        {
          "label": "The test kit",
          "url": "#"
        },
        {
          "label": "The ingredient library",
          "url": "#"
        },
        {
          "label": "The science board",
          "url": "#lab"
        },
        {
          "label": "Our Standards",
          "url": "#"
        },
        {
          "label": "About nb1",
          "url": "#"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'primaryLabel',
      type: 'text',
      localized: true,
      label: "Sheet — first heading",
      defaultValue: "How it works",
    },
    {
      name: 'moreLabel',
      type: 'text',
      localized: true,
      label: "Sheet — second heading",
      defaultValue: "More",
    },
    {
      name: 'moreItems',
      type: 'array',
      label: "Sheet — second group",
      admin: { description: "Mobile only. Below 1120px the sheet is the only route to these, so it is not a duplicate of the Discover menu." },
      defaultValue: [
        {
          "label": "The ingredient library",
          "url": "The Protocol.dc.html#library"
        },
        {
          "label": "The science board",
          "url": "#lab"
        },
        {
          "label": "Our standards",
          "url": "protocol/Our Standards.html"
        },
        {
          "label": "About nb1",
          "url": "protocol/About NB1.html"
        },
        {
          "label": "FAQ",
          "url": "protocol/FAQ.html"
        },
        {
          "label": "Contact",
          "url": "protocol/Contact.html"
        }
      ],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'languageLabel',
      type: 'text',
      localized: true,
      label: "Language menu heading",
      defaultValue: "Language",
    },
    {
      name: 'applyLabel',
      type: 'text',
      localized: true,
      label: "Language menu button",
      defaultValue: "Apply",
    },
    {
      name: 'loginLabel',
      type: 'text',
      localized: true,
      label: "Log in link",
      defaultValue: "Log in",
    },
    {
      name: 'loginUrl',
      type: 'text',
      localized: true,
      label: "Log in URL",
      defaultValue: "#",
    },
    localizedLink({ overrides: { name: 'cta', label: 'Primary CTA', defaultValue: {
        "url": "#close",
        "label": "Order your kit"
      } } }),
    {
      name: 'menuLabel',
      type: 'text',
      localized: true,
      label: "Burger label",
      admin: { description: "Read by screen readers; the button shows three bars." },
      defaultValue: "Menu",
    },
    {
      name: 'closeLabel',
      type: 'text',
      localized: true,
      label: "Sheet close label",
      admin: { description: "Read by screen readers; the button shows a cross." },
      defaultValue: "Close menu",
    },
  ],
}

export default RdHeaders
