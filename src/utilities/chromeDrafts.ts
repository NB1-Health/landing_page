import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'

const contextKey = 'chromeDraftSave'

export const captureChromeDraftSave: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  // Nested reads in write hooks reuse the same request. They must not replace
  // the outer operation's save classification.
  if (!['create', 'restoreVersion', 'update'].includes(operation)) return

  const write = args as { data?: { _status?: unknown }; draft?: boolean }
  // Payload's bulk Publish action also sends `draft=true`; the published
  // status is what distinguishes it from an autosave or Save Draft request.
  req.context[contextKey] = write.draft === true && write.data?._status !== 'published'
}

export const isChromeDraftSave = (req: PayloadRequest) => {
  if (contextKey in req.context) return req.context[contextKey] === true
  return req.query?.draft === true || req.query?.draft === 'true'
}
