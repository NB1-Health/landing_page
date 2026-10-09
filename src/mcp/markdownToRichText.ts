import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Field, Payload, RichTextField } from 'payload'

import { blockNode } from '@/utilities/parseHtmlToBlocks'

/**
 * Markdown in, the rich-text field's own Lexical out.
 *
 * Converted with Payload's converter against the TARGET FIELD's editor config, so
 * the result can only contain what that editor can render and edit. Anything the
 * editor does not support is rejected rather than stored: the converter leaves
 * unsupported syntax as literal text, which would publish a visible "## Heading"
 * or "| a | b |" — and drafts skip field validation, so nothing else would stop it.
 *
 * One addition the converter does not do. These editors have no list feature;
 * lists are the `bulletList` block (bold lead-in plus body, 2–10 items). So a
 * markdown list written in that shape becomes the block:
 *
 *   - **Lead-in.** Body text.
 *
 * The same convention `parseHtmlToBlocks` uses for the Journal's HTML import.
 */

export class MarkdownError extends Error {}

type EditorSupport = {
  editorConfig: ReturnType<typeof editorConfigFactory.fromField>
  headings: Set<string>
  bulletList: boolean
  horizontalRule: boolean
}

const supportCache = new WeakMap<RichTextField, EditorSupport>()

function findRichTextField(fields: Field[], path: readonly string[]): RichTextField {
  let current: Field[] | undefined = fields
  let field: Field | undefined

  for (const name of path) {
    field = current?.find((candidate) => 'name' in candidate && candidate.name === name)
    current = field && 'fields' in field ? (field.fields as Field[]) : undefined
  }

  if (!field || field.type !== 'richText') {
    throw new Error(`No rich-text field at ${path.join('.')}`)
  }
  return field
}

function editorSupport(field: RichTextField): EditorSupport {
  const cached = supportCache.get(field)
  if (cached) return cached

  const editorConfig = editorConfigFactory.fromField({ field })
  const features = editorConfig.resolvedFeatureMap
  const props = (key: string) =>
    (features.get(key) as { sanitizedServerFeatureProps?: Record<string, unknown> } | undefined)
      ?.sanitizedServerFeatureProps
  const blocks = (props('blocks')?.blocks as Array<{ slug: string }> | undefined) ?? []

  const support = {
    editorConfig,
    headings: new Set((props('heading')?.enabledHeadingSizes as string[] | undefined) ?? []),
    bulletList: blocks.some((block) => block.slug === 'bulletList'),
    horizontalRule: features.has('horizontalRule'),
  }
  supportCache.set(field, support)
  return support
}

const LIST_ITEM = /^\s*[-*+]\s+/
const BOLD_LEAD_IN = /^\s*[-*+]\s+\*\*(.+?)\*\*(.*)$/

type Segment = { kind: 'markdown'; lines: string[] } | { kind: 'list'; lines: string[] }

function checkLine(line: string, number: number, support: EditorSupport): void {
  const fail = (message: string) => {
    throw new MarkdownError(`line ${number}: ${message}`)
  }

  const heading = /^(#{1,6})\s/.exec(line)
  if (heading) {
    const tag = `h${heading[1].length}`
    if (!support.headings.has(tag)) {
      const allowed = [...support.headings].join(', ') || 'none'
      fail(`${tag} headings are not allowed here (allowed: ${allowed}).`)
    }
  }
  if (/^\s*\d+[.)]\s/.test(line)) fail('numbered lists are not supported.')
  if (/^\s*>/.test(line)) fail('block quotes are not supported.')
  if (/^\s*\|/.test(line)) fail('tables are not supported.')
  if (/^\s*(```|~~~)/.test(line)) fail('code blocks are not supported.')
  if (/!\[[^\]]*\]\(/.test(line)) fail('images are not supported.')
  if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line) && !support.horizontalRule) {
    fail('horizontal rules are not supported.')
  }
}

function segment(markdown: string, support: EditorSupport): Segment[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const segments: Segment[] = []

  lines.forEach((line, index) => {
    const isRule = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)
    const kind = LIST_ITEM.test(line) && !isRule ? 'list' : 'markdown'
    if (kind === 'list' && !support.bulletList) {
      throw new MarkdownError(`line ${index + 1}: lists are not supported here.`)
    }
    if (kind === 'markdown') checkLine(line, index + 1, support)

    const last = segments.at(-1)
    // A blank line inside a list belongs to the list only if the list continues
    // after it; trailing blanks fall back into the next markdown segment.
    if (last?.kind === kind) {
      last.lines.push(line)
    } else if (kind === 'markdown' && !line.trim() && last?.kind === 'list') {
      last.lines.push(line)
    } else {
      segments.push({ kind, lines: [line] })
    }
  })

  return segments
}

function bulletListBlock(lines: string[]) {
  const items = lines
    .filter((line) => line.trim())
    .map((line) => {
      const match = BOLD_LEAD_IN.exec(line)
      if (!match) {
        throw new MarkdownError(
          `list items need a bold lead-in, e.g. "- **Lead-in.** Body": ${line.trim()}`,
        )
      }
      const leadIn = match[1].trim()
      const body = match[2].replace(/^\s*[.:\s]+/, '').trim()
      if (!leadIn || !body) {
        throw new MarkdownError(`list items need a lead-in and a body: ${line.trim()}`)
      }
      if (/\*\*|\[[^\]]*\]\(/.test(body)) {
        throw new MarkdownError(`list item bodies are plain text (no bold or links): ${line.trim()}`)
      }
      return { leadIn, body }
    })

  if (items.length < 2 || items.length > 10) {
    throw new MarkdownError(`a list needs 2–10 items (found ${items.length}).`)
  }
  return blockNode('bulletList', { items })
}

export function markdownToRichText({
  payload,
  collection,
  fieldPath,
  markdown,
}: {
  payload: Payload
  collection: string
  fieldPath: readonly string[]
  markdown: string
}): SerializedEditorState {
  const config = payload.collections[collection as 'pillars']?.config
  if (!config) throw new Error(`Unknown collection: ${collection}`)
  const support = editorSupport(findRichTextField(config.fields, fieldPath))

  const children = segment(markdown, support).flatMap<unknown>((part) => {
    if (part.kind === 'list') {
      // Trailing blank lines carried by the list are layout, not items.
      return [bulletListBlock(part.lines)]
    }
    const source = part.lines.join('\n').trim()
    if (!source) return []
    return convertMarkdownToLexical({ editorConfig: support.editorConfig, markdown: source }).root
      .children
  })

  if (children.length === 0) throw new MarkdownError('is empty. Send null to clear a field.')

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as SerializedEditorState
}
