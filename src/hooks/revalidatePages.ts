import { revalidateTag } from 'next/cache'
import type { PayloadRequest } from 'payload'

export function revalidatePages<T>({ doc, req }: { doc: T; req: PayloadRequest }): T {
  if (req.context.disableRevalidate) return doc

  try {
    revalidateTag('pages')
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not revalidate populated page cache')
  }

  return doc
}
