import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from '@payloadcms/richtext-lexical/lexical'

/**
 * Loosely-typed view of a serialized lexical node. The base type only
 * guarantees `type`/`version`; text and element nodes carry the extra fields we
 * read while walking the tree. Mirrors the shape used by
 * `utilities/extractHeadingsFromLexical.ts`.
 */
type LexicalNodeLike = SerializedLexicalNode & {
  children?: LexicalNodeLike[]
  text?: string
}

type LexicalDoc =
  | SerializedEditorState<SerializedLexicalNode>
  | { root?: LexicalNodeLike }
  | LexicalNodeLike
  | null
  | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * True when the value looks like a single lexical document rather than a
 * localized map of them (`{ en: {...}, de: {...} }`).
 *
 * This matters because field hooks receive the active-locale value on a normal
 * admin save, but the full localized map on a `locale: 'all'` write (imports,
 * `restoreVersion`). Counting words across such a map would silently multiply
 * the read time by the number of populated locales.
 */
export function isSingleLexicalDoc(value: unknown): value is { root?: LexicalNodeLike } {
  return isRecord(value) && 'root' in value
}

/** Collect the visible text of a serialized lexical document. */
export function collectLexicalText(doc: LexicalDoc): string {
  const parts: string[] = []

  const walk = (node: LexicalNodeLike | null | undefined) => {
    if (!node) return
    if (typeof node.text === 'string') parts.push(node.text)
    const children = Array.isArray(node.children) ? node.children : []
    for (const child of children) walk(child)
  }

  const root =
    doc && typeof doc === 'object' && 'root' in doc
      ? (doc.root as LexicalNodeLike | undefined)
      : (doc as LexicalNodeLike | null | undefined)

  walk(root)
  return parts.join(' ')
}

/**
 * Word count across any number of lexical documents.
 *
 * Takes `unknown` rather than `LexicalDoc` on purpose. The only caller is a
 * field `beforeChange` hook, where `data` is an untyped record — and the value
 * it hands over may not be a document at all, but the localized map
 * (`{ en: {...}, de: {...} }`) a `locale: 'all'` write produces. Narrowing is
 * this function's job, via the `isSingleLexicalDoc` guard below, so demanding a
 * typed argument would only push a cast onto the caller and lose the check.
 */
export function countLexicalWords(...docs: unknown[]): number {
  const text = docs
    .filter(isSingleLexicalDoc)
    .map((doc) => collectLexicalText(doc))
    .join(' ')
    .trim()

  if (!text) return 0
  return text.split(/\s+/).length
}

/** Words per minute used for the "N min read" estimate. */
export const READING_WORDS_PER_MINUTE = 225

/** Minutes to read the given lexical documents, rounded, minimum 1. */
export function estimateReadTime(...docs: unknown[]): number | undefined {
  const words = countLexicalWords(...docs)
  if (words === 0) return undefined
  return Math.max(1, Math.round(words / READING_WORDS_PER_MINUTE))
}
