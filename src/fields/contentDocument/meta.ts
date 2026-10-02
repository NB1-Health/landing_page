import type { Field } from 'payload'

export const META_TITLE_MAX = 60
export const META_DESCRIPTION_MAX = 155

function characterCounter(path: string, maxLength: number) {
  return {
    path: '/components/Payload/fields/RemainingCharacterCounter',
    exportName: 'RemainingCharacterCounter',
    clientProps: { path, maxLength },
  }
}

/**
 * SEO title and description for the hub documents.
 *
 * Optional, unlike on Posts: every hub document already has a title and a summary
 * line (standfirst, or the definition on a lexicon term) that the page metadata
 * falls back to. The override exists for where that fallback is poor — mostly
 * study titles, which run to 122 characters against a 60-character title tag.
 *
 * Same `meta.title` / `meta.description` names as Pages and Posts, so anything that
 * reads SEO meta reads it from one place on every collection.
 */
export function metaField({ fallback }: { fallback: string }): Field {
  return {
    name: 'meta',
    type: 'group',
    label: 'SEO',
    admin: {
      description: `Optional. Left empty, the title tag uses the title and the description uses the ${fallback}.`,
    },
    fields: [
      {
        name: 'title',
        label: 'Meta title',
        type: 'text',
        localized: true,
        maxLength: META_TITLE_MAX,
        admin: {
          description: `Max ${META_TITLE_MAX} characters. " | NB1" is added automatically.`,
          components: { afterInput: [characterCounter('meta.title', META_TITLE_MAX)] },
        },
      },
      {
        name: 'description',
        label: 'Meta description',
        type: 'textarea',
        localized: true,
        maxLength: META_DESCRIPTION_MAX,
        admin: {
          description: `Max ${META_DESCRIPTION_MAX} characters.`,
          components: {
            afterInput: [characterCounter('meta.description', META_DESCRIPTION_MAX)],
          },
        },
      },
    ],
  }
}
