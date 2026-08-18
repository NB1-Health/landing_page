import type { Block } from 'payload'

// The referral widget itself (Mention Me referrer journey) is rendered by the
// shared @/components/MentionMe/MentionMeTag, which reads the partner code + host
// from NEXT_PUBLIC_MENTION_ME_* env vars (same as the checkout flow). These fields
// only cover what is genuinely page-editable.
export const ReferralWidgetBlock: Block = {
  slug: 'referralWidget',
  interfaceName: 'ReferralWidgetBlock',
  dbName: 'rfw',
  labels: { singular: 'Referral Widget', plural: 'Referral Widgets' },
  fields: [
    {
      name: 'situation',
      type: 'text',
      defaultValue: 'landingpage',
      admin: {
        description:
          "Mention Me situation for the referrer journey on this page (e.g. 'landingpage').",
      },
    },
    {
      name: 'localeOverride',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional Mention Me locale override, e.g. en_GB. Leave blank to map the page locale (en→en_GB, de→de_DE, fr→fr_FR).',
      },
    },
    {
      name: 'showPlaceholder',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Show the styled placeholder slot when the Mention Me partner code is not configured (e.g. locally).',
      },
    },
  ],
}
