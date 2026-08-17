import type { Payload } from 'payload'

const localizedStatusCollections = new Set(['pages', 'posts'])

export function assertLocalizedStatusDisabled(payload: Payload): void {
  const collectionEnabled = payload.config.collections.some((collection) => {
    if (!localizedStatusCollections.has(collection.slug)) return false
    const drafts = typeof collection.versions === 'object' ? collection.versions.drafts : false
    return typeof drafts === 'object' && drafts.localizeStatus === true
  })
  const globallyEnabled = payload.config.experimental?.localizeStatus === true

  if (globallyEnabled || collectionEnabled) {
    throw new Error(
      'Disable experimental.localizeStatus and versions.drafts.localizeStatus for Pages and Posts before rolling back the international SEO migration batch.',
    )
  }
}
