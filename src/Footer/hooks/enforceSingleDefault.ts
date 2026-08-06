import { createDefaultChromeHooks } from '@/utilities/defaultChrome'

export const { enforceSingleDefault, protectDefaultDelete, protectExistingDefaultDraft } =
  createDefaultChromeHooks('footers', 'Footer')
