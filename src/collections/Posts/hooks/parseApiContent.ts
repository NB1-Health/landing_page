import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { parseHtmlToContent } from '@/utilities/parseHtmlToBlocks'

function hasOwnField(value: unknown, field: string): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.hasOwn(value, field)
}

function fieldValue(data: unknown, originalDoc: unknown, field: string): unknown {
  return hasOwnField(data, field)
    ? data[field]
    : typeof originalDoc === 'object' && originalDoc !== null
      ? (originalDoc as Record<string, unknown>)[field]
      : undefined
}

function hasRichTextContent(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const node = value as {
    children?: unknown[]
    fields?: unknown
    root?: unknown
    text?: unknown
    type?: unknown
  }

  if (node.root) return hasRichTextContent(node.root)
  if (typeof node.text === 'string' && node.text.trim()) return true
  if (node.type === 'block' && node.fields) return true

  return Array.isArray(node.children) && node.children.some(hasRichTextContent)
}

function apiContentError(message: string): never {
  throw new APIError(message, 400)
}

export const parseApiContent: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation !== 'create' && operation !== 'update') return data

  const source = fieldValue(data, originalDoc, 'source')
  if (source !== 'api') return data

  const intro = fieldValue(data, originalDoc, 'intro')
  if (!hasRichTextContent(intro)) {
    apiContentError('API posts require a non-empty intro.')
  }

  const htmlContent = fieldValue(data, originalDoc, 'htmlContent')
  if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
    apiContentError('API posts require non-empty HTML content.')
  }

  // Only re-parse if htmlContent has changed since the last save.
  // This allows manual edits in the editor to persist after saving.
  const htmlChanged =
    operation === 'create' ||
    (hasOwnField(data, 'source') && originalDoc?.source !== 'api') ||
    (hasOwnField(data, 'htmlContent') && data.htmlContent !== originalDoc?.htmlContent)

  if (!htmlChanged) {
    const content = fieldValue(data, originalDoc, 'content')
    if (!hasRichTextContent(content)) {
      apiContentError('API posts require non-empty parsed content.')
    }
    return data
  }

  let content: ReturnType<typeof parseHtmlToContent>

  try {
    content = parseHtmlToContent(htmlContent)
  } catch (error) {
    apiContentError(error instanceof Error ? error.message : 'Could not parse API HTML content.')
  }

  return {
    ...data,
    content,
  }
}
