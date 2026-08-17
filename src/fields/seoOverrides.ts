import type { Field, SelectFieldSingleValidation } from 'payload'

import { appLocales, localeConfig } from '@/i18n/config'

const validateXDefaultLocale: SelectFieldSingleValidation = (value, { siblingData }) => {
  const overrides = siblingData as { enabled?: boolean; excludedLocales?: string[] }
  if (!overrides.enabled || !value) return true
  return overrides.excludedLocales?.includes(value)
    ? 'x-default cannot use an excluded locale.'
    : true
}

export function seoOverridesField(): Field {
  const localeOptions = appLocales.map((locale) => ({
    label: localeConfig[locale].label,
    value: locale,
  }))

  return {
    name: 'seoOverrides',
    label: 'International SEO Overrides',
    type: 'group',
    admin: {
      description: 'Rare exceptions only. Hreflang is normally generated from published locales.',
    },
    fields: [
      {
        name: 'enabled',
        label: 'Enable overrides',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'excludedLocales',
        label: 'Exclude published locales',
        type: 'select',
        hasMany: true,
        options: localeOptions,
        admin: {
          condition: (_, siblingData) => siblingData?.enabled === true,
          description:
            "Removes a published locale from this document's hreflang cluster and sitemap.",
        },
      },
      {
        name: 'xDefaultLocale',
        label: 'Custom x-default locale',
        type: 'select',
        options: localeOptions,
        admin: {
          condition: (_, siblingData) => siblingData?.enabled === true,
          description:
            'Optional. Must remain a published, non-excluded locale. Defaults to English.',
        },
        validate: validateXDefaultLocale,
      },
    ],
  }
}
