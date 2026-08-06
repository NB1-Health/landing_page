import type { CollectionConfig } from 'payload'

import { link } from '@/fields/link'
import {
  enforceSingleDefault,
  protectDefaultDelete,
  protectExistingDefaultDraft,
} from './hooks/enforceSingleDefault'
import { revalidateDeletedFooter, revalidateFooter } from './hooks/revalidateFooter'
import { adminOnly } from '@/access/roles'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { captureChromeDraftSave } from '@/utilities/chromeDrafts'

const themeOptions = [
  { label: 'Light (white background)', value: 'light' },
  { label: 'Dark (navy background)', value: 'dark' },
]

export const Footers: CollectionConfig = {
  slug: 'footers',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: authenticatedOrPublished,
    update: adminOnly,
  },
  hooks: {
    beforeOperation: [captureChromeDraftSave],
    beforeChange: [protectExistingDefaultDraft],
    beforeDelete: [protectDefaultDelete],
    afterChange: [enforceSingleDefault, revalidateFooter],
    afterDelete: [revalidateDeletedFooter],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'theme', 'isDefault'],
  },
  versions: {
    drafts: {
      autosave: { interval: 5000 },
    },
    maxPerDoc: 10,
  },
  fields: [
    {
      name: 'name',
      label: 'Footer Name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label, e.g. "Default", "Checkout", "Minimal".',
      },
    },
    {
      name: 'isDefault',
      label: 'Use as site default',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pages that do not select a specific footer will use the default.',
      },
    },
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'theme',
      label: 'Default Theme',
      type: 'select',
      defaultValue: 'light',
      options: themeOptions,
      admin: {
        description: 'Used when no A/B variant matches. Light = white bg, Dark = navy bg.',
      },
    },
    {
      name: 'linkColor',
      label: 'Link Color',
      type: 'text',
      admin: {
        description:
          'CSS color for nav links (e.g. "rgba(18,49,77,0.55)" or "#303438"). Falls back to theme default if empty.',
      },
    },
    {
      name: 'tagline',
      label: 'Tagline',
      type: 'text',
      localized: true,
      admin: {
        description: 'Short tagline shown next to logo, e.g. "Sequenced. Then yours."',
      },
    },
    {
      name: 'subnote',
      label: 'Email Subscribe Subnote',
      type: 'text',
      localized: true,
      admin: {
        description: 'e.g. "Occasional notes on the science and the product. No spam."',
      },
    },
    {
      name: 'instagramUrl',
      label: 'Instagram URL',
      type: 'text',
    },
    {
      name: 'exploreLinks',
      label: 'Explore Column Links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true, localized: true },
      ],
      maxRows: 8,
      admin: {
        description: 'Links shown in the "Explore" column (e.g. Home, The lab, Our plans).',
        initCollapsed: true,
      },
    },
    {
      name: 'getStartedLinks',
      label: 'Get Started Column Links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true, localized: true },
      ],
      maxRows: 8,
      admin: {
        description: 'Links shown in the "Get Started" column (e.g. Order your kit, Log in, Contact).',
        initCollapsed: true,
      },
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Legacy Nav Links',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Legacy field – use Explore/Get Started columns above instead.',
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'address',
      label: 'Address Line',
      type: 'text',
      localized: true,
      admin: {
        description: 'Company address shown in the legal section.',
      },
    },
    {
      name: 'copyrightText',
      label: 'Copyright Text',
      type: 'text',
      localized: true,
    },
    {
      name: 'disclaimer',
      label: 'Disclaimer Text',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Legal disclaimer shown below the bottom bar.',
      },
    },
    {
      name: 'legalLinks',
      label: 'Legal Links',
      type: 'array',
      localized: true,
      admin: {
        description: 'Privacy, Terms, Imprint etc. shown in the bottom bar.',
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          label: 'Label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'form',
      label: 'Klaviyo Form (Payload submission)',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description: 'Select the Form Builder form to log Klaviyo submissions in Payload.',
      },
    },
    {
      name: 'variants',
      label: 'A/B Variants',
      type: 'array',
      fields: [
        {
          name: 'variantKey',
          label: 'Variant Key',
          type: 'text',
          required: true,
          admin: {
            description: 'Matches the ?v= URL param (e.g. "dark-page", "eu-b"). Case-sensitive.',
          },
        },
        {
          name: 'theme',
          label: 'Theme for this variant',
          type: 'select',
          options: themeOptions,
          required: true,
        },
        {
          name: 'linkColor',
          label: 'Link Color',
          type: 'text',
          admin: {
            description: 'Overrides the default link color for this variant. Any CSS color value.',
          },
        },
        {
          name: 'logo',
          label: 'Logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Overrides the default logo for this variant.',
          },
        },
      ],
      admin: {
        initCollapsed: true,
        description:
          'Map URL variant keys to a footer theme. A visitor with ?v=<key> in the URL gets the matching theme.',
      },
    },
  ],
}
