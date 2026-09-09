import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateRedirects = ({
  doc,
  req: { payload },
}: Pick<Parameters<CollectionAfterChangeHook>[0], 'doc' | 'req'>) => {
  payload.logger.info(`Revalidating redirects`)

  revalidateTag('redirects')

  return doc
}
