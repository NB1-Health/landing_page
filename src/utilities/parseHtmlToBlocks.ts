/**
 * parseHtmlToBlocks
 *
 * Converts raw HTML (from the content pipeline) into a Payload Lexical JSON document
 * suitable for storing in the Post `content` richText field.
 *
 * Block sections must be wrapped in HTML comment markers:
 *
 *   <!-- block:keyTakeaways -->
 *   <ul>
 *     <li><strong>Lead-in phrase.</strong> Explanation text here.</li>
 *     <!-- 3–5 items -->
 *   </ul>
 *   <!-- /block -->
 *
 *   <!-- block:faq -->
 *   <dl>
 *     <dt>Question text?</dt>
 *     <dd>Answer paragraph.</dd>
 *     <!-- 3–6 pairs -->
 *   </dl>
 *   <!-- /block -->
 *   (or use <h3> + <p> pairs inside the marker)
 *
 *   <!-- block:cta -->
 *   <p>Body text connecting article topic to the NB1 kit.</p>
 *   <!-- /block -->
 *   (buttonUrl defaults to /order unless an <a href="..."> is present)
 *
 *   <!-- block:bulletList -->
 *   <h3>Optional Section Title</h3>
 *   <ul>
 *     <li><strong>Lead-in.</strong> Body text.</li>
 *     <!-- 2–10 items -->
 *   </ul>
 *   <!-- /block -->
 *
 *   <!-- block:dataTable -->
 *   <h3>Optional Section Title</h3>
 *   <table>
 *     <thead><tr><th>Term</th><th>Definition</th></tr></thead>
 *     <tbody>
 *       <tr><td>Microbiome</td><td>The community of microorganisms...</td></tr>
 *     </tbody>
 *   </table>
 *   <!-- /block -->
 *   (2-column table → glossary variant; 3+ columns → comparison variant)
 *
 * Everything outside block markers is converted to Lexical paragraph/heading nodes
 * and written into the richText content directly.
 *
 * The `intro` field must be sent separately in the API payload — it is not parsed here.
 */

import { parse } from 'node-html-parser'
import type { HTMLElement as NHTMLElement } from 'node-html-parser'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Lexical node builders
// ---------------------------------------------------------------------------

function textNode(text: string, format = 0) {
  return {
    type: 'text' as const,
    version: 1,
    text,
    format,
    detail: 0,
    mode: 'normal',
    style: '',
  }
}

type TextNode = ReturnType<typeof textNode>

type LinkNode = {
  type: 'link'
  version: 3
  direction: 'ltr'
  format: ''
  indent: 0
  fields: {
    linkType: 'custom'
    newTab: boolean
    url: string
  }
  children: TextNode[]
}

type InlineNode = TextNode | LinkNode

function linkNode(url: string, children: TextNode[], newTab: boolean): LinkNode {
  return {
    type: 'link',
    version: 3,
    direction: 'ltr',
    format: '',
    indent: 0,
    fields: {
      linkType: 'custom',
      newTab,
      url,
    },
    children,
  }
}

function paragraphNode(children: InlineNode[]) {
  return {
    type: 'paragraph',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    textFormat: 0,
    children,
  }
}

function headingNode(tag: 'h1' | 'h2' | 'h3' | 'h4', children: InlineNode[]) {
  return {
    type: 'heading',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    tag,
    children,
  }
}

/** Wraps a parsed block's fields as a Lexical embedded block node */
function blockNode(blockType: string, fields: Record<string, unknown>) {
  return {
    type: 'block',
    version: 2,
    fields: {
      id: randomUUID(),
      blockType,
      ...fields,
    },
  }
}

/** Minimal Lexical document used for richText sub-fields (e.g. FAQ answers) */
function richTextDoc(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [paragraphNode([textNode(text)])],
    },
  }
}

// ---------------------------------------------------------------------------
// Inline HTML → Lexical text nodes
// ---------------------------------------------------------------------------

function parseLinkUrl(url: string): string {
  const normalized = url.trim()
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(normalized)?.[1]?.toLowerCase()

  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error('Links must have a valid URL.')
  }

  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) {
    throw new Error(`Unsupported link protocol "${scheme}:".`)
  }

  return normalized
}

function parseInlineChildren(el: NHTMLElement, inheritedFormat = 0): InlineNode[] {
  const nodes: InlineNode[] = []

  for (const child of el.childNodes) {
    if (child.nodeType === 3) {
      // plain text node
      const text = child.text
      if (text.trim()) nodes.push(textNode(text, inheritedFormat))
    } else if (child.nodeType === 1) {
      const el2 = child as NHTMLElement
      const tag = el2.tagName?.toLowerCase()

      if (tag === 'a') {
        const children = parseInlineChildren(el2, inheritedFormat).flatMap((node) =>
          node.type === 'link' ? node.children : [node],
        )
        if (!children.length) continue

        const href = el2.getAttribute('href')
        if (!href) {
          nodes.push(...children)
          continue
        }

        nodes.push(linkNode(parseLinkUrl(href), children, el2.getAttribute('target') === '_blank'))
        continue
      }

      const format =
        tag === 'strong' || tag === 'b'
          ? inheritedFormat | 1
          : tag === 'em' || tag === 'i'
            ? inheritedFormat | 2
            : tag === 'u'
              ? inheritedFormat | 8
              : inheritedFormat

      nodes.push(...parseInlineChildren(el2, format))
    }
  }

  return nodes
}

// ---------------------------------------------------------------------------
// Block parsers — each returns a Lexical block node
// ---------------------------------------------------------------------------

function parseKeyTakeaways(container: NHTMLElement) {
  const items: Array<{ leadIn: string; explanation: string }> = []

  for (const li of container.querySelectorAll('li')) {
    const strong = li.querySelector('strong') ?? li.querySelector('b')
    const leadIn = strong?.text?.trim() ?? ''
    const fullText = li.text.trim()
    // strip the lead-in from the full text to get the explanation
    const explanation = fullText
      .replace(leadIn, '')
      .replace(/^\s*[.\s]+/, '')
      .trim()
    if (leadIn || explanation) {
      items.push({ leadIn, explanation })
    }
  }

  if (
    items.length < 3 ||
    items.length > 5 ||
    items.some(({ leadIn, explanation }) => !leadIn || !explanation)
  ) {
    throw new Error('Block "keyTakeaways" requires 3–5 items with a lead-in and explanation.')
  }

  return blockNode('keyTakeaways', { items })
}

function parseFAQ(container: NHTMLElement) {
  const items: Array<{ question: string; answer: ReturnType<typeof richTextDoc> }> = []

  const dts = container.querySelectorAll('dt')

  if (dts.length > 0) {
    // <dl><dt>Question</dt><dd>Answer</dd></dl>
    for (const dt of dts) {
      const dd = dt.nextElementSibling
      const question = dt.text.trim()
      const answerText = dd?.text?.trim() ?? ''
      if (question) {
        items.push({ question, answer: richTextDoc(answerText) })
      }
    }
  } else {
    // <h3>Question</h3><p>Answer</p> pairs
    const children = container.childNodes.filter((n) => n.nodeType === 1) as NHTMLElement[]
    for (let i = 0; i < children.length; i++) {
      const el = children[i]!
      if (el.tagName?.toLowerCase() === 'h3') {
        const next = children[i + 1]
        const question = el.text.trim()
        const answerText = next?.text?.trim() ?? ''
        if (question) {
          items.push({ question, answer: richTextDoc(answerText) })
          i++ // skip the paired answer element
        }
      }
    }
  }

  if (
    items.length < 3 ||
    items.length > 6 ||
    items.some(({ answer }) =>
      answer.root.children.every((paragraph) =>
        paragraph.children.every((child) => child.type !== 'text' || !child.text.trim()),
      ),
    )
  ) {
    throw new Error('Block "faq" requires 3–6 question and answer pairs.')
  }

  return blockNode('faq', { items })
}

function parseCTA(container: NHTMLElement) {
  const p = container.querySelector('p')
  const a = container.querySelector('a')
  const body = p?.text?.trim() ?? container.text.trim()
  const buttonUrl = parseLinkUrl(a?.getAttribute('href') ?? '/order')

  if (!body) {
    throw new Error('Block "cta" requires body text.')
  }

  return blockNode('ctaBlock', { body, buttonUrl })
}

function parseBulletList(container: NHTMLElement) {
  const h3 = container.querySelector('h3')
  const sectionTitle = h3?.text?.trim() || undefined

  const items: Array<{ leadIn: string; body: string }> = []

  for (const li of container.querySelectorAll('li')) {
    const strong = li.querySelector('strong') ?? li.querySelector('b')
    const leadIn = strong?.text?.trim() ?? ''
    const fullText = li.text.trim()
    const body = fullText
      .replace(leadIn, '')
      .replace(/^\s*[.\s]+/, '')
      .trim()
    items.push({ leadIn, body })
  }

  if (items.length < 2 || items.length > 10 || items.some(({ leadIn, body }) => !leadIn || !body)) {
    throw new Error('Block "bulletList" requires 2–10 items with a lead-in and body.')
  }

  return blockNode('bulletList', { sectionTitle, items })
}

function parseDataTable(container: NHTMLElement) {
  const h3 = container.querySelector('h3')
  const sectionTitle = h3?.text?.trim() || undefined

  const table = container.querySelector('table')
  if (!table) {
    throw new Error('Block "dataTable" requires a table.')
  }

  const ths = table.querySelectorAll('thead tr th')
  const columnHeaders =
    ths.length > 0 ? Array.from(ths).map((th) => ({ label: th.text.trim() })) : []

  const colCount = ths.length || 2
  const variant: 'glossary' | 'comparison' = colCount >= 3 ? 'comparison' : 'glossary'

  const bodyRows =
    table.querySelectorAll('tbody tr').length > 0
      ? table.querySelectorAll('tbody tr')
      : // fall back: all <tr> rows that aren't the header
        table.querySelectorAll('tr').filter((tr) => tr.querySelectorAll('td').length > 0)

  const rows = Array.from(bodyRows)
    .map((tr) => ({
      cells: Array.from(tr.querySelectorAll('td')).map((td) => ({ value: td.text.trim() })),
    }))
    .filter((row) => row.cells.length > 0)

  const expectedCells = columnHeaders.length || 2
  if (
    !rows.length ||
    expectedCells > 6 ||
    columnHeaders.some(({ label }) => !label) ||
    rows.some(({ cells }) => cells.length !== expectedCells || cells.some(({ value }) => !value))
  ) {
    throw new Error('Block "dataTable" requires complete rows matching its 2–6 columns.')
  }

  return blockNode('dataTable', { sectionTitle, variant, columnHeaders, rows })
}

// ---------------------------------------------------------------------------
// Regular HTML element → Lexical content nodes
// ---------------------------------------------------------------------------

function htmlElementToLexicalNodes(el: NHTMLElement) {
  const tag = el.tagName?.toLowerCase()
  if (!tag) return []

  if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
    const children = parseInlineChildren(el)
    if (!children.length) return []
    return [headingNode(tag as 'h1' | 'h2' | 'h3' | 'h4', children)]
  }

  if (tag === 'p') {
    const children = parseInlineChildren(el)
    if (!children.length) return []
    return [paragraphNode(children)]
  }

  // For any other block element, flatten its inline content into a paragraph.
  const children = parseInlineChildren(el)
  if (!children.length) return []
  return [paragraphNode(children)]
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const supportedBlockTypes = new Map<string, string>([
  ['keytakeaways', 'keyTakeaways'],
  ['faq', 'faq'],
  ['cta', 'cta'],
  ['bulletlist', 'bulletList'],
  ['datatable', 'dataTable'],
])

function normalizeBlockType(type: string): string {
  const supportedType = supportedBlockTypes.get(type.toLowerCase())

  if (!supportedType) {
    throw new Error(`Unsupported block marker "${type}".`)
  }

  return supportedType
}

function validateBlockMarkers(html: string): void {
  let currentBlockType: string | null = null

  for (const match of html.matchAll(/<!--([\s\S]*?)-->/g)) {
    const marker = match[1]?.trim() ?? ''
    const openMatch = marker.match(/^block:([a-z][\w-]*)$/i)
    const isClose = /^\/block$/i.test(marker)

    if (!openMatch && !isClose) {
      if (/^\/?block\b/i.test(marker)) {
        throw new Error(`Malformed block marker "${marker}".`)
      }
      continue
    }

    if (openMatch) {
      const blockType = normalizeBlockType(openMatch[1]!)
      if (currentBlockType) {
        throw new Error(
          `Block "${currentBlockType}" must be closed before opening block "${blockType}".`,
        )
      }
      currentBlockType = blockType
      continue
    }

    if (!currentBlockType) {
      throw new Error('Found a closing block marker without an opening marker.')
    }

    currentBlockType = null
  }

  const finalCommentStart = html.lastIndexOf('<!--')
  if (
    finalCommentStart > html.lastIndexOf('-->') &&
    /^\s*\/?block\b/i.test(html.slice(finalCommentStart + 4))
  ) {
    throw new Error('Found an unterminated block marker comment.')
  }

  if (currentBlockType) {
    throw new Error(`Block "${currentBlockType}" is missing its closing marker.`)
  }
}

/**
 * Parses `htmlContent` and returns a Lexical JSON document to be stored
 * in the Post `content` richText field.
 */
export function parseHtmlToContent(html: string) {
  if (!html.trim()) {
    throw new Error('API HTML content cannot be empty.')
  }

  validateBlockMarkers(html)

  const lexicalChildren: ReturnType<
    typeof paragraphNode | typeof headingNode | typeof blockNode
  >[] = []

  // Split on block comment markers
  // Matches: <!-- block:keyTakeaways --> and <!-- /block -->
  const parts = html.split(/(<!--\s*block:\w+\s*-->|<!--\s*\/block\s*-->)/gi)

  let currentBlockType: string | null = null
  let currentBlockHtml = ''

  for (const part of parts) {
    const openMatch = part.match(/<!--\s*block:(\w+)\s*-->/i)
    const isClose = /<!--\s*\/block\s*-->/i.test(part)

    if (openMatch) {
      currentBlockType = normalizeBlockType(openMatch[1]!)
      currentBlockHtml = ''
      continue
    }

    if (isClose && currentBlockType) {
      const container = parse(currentBlockHtml)
      let node: ReturnType<typeof blockNode> | null = null

      switch (currentBlockType) {
        case 'keyTakeaways':
          node = parseKeyTakeaways(container as unknown as NHTMLElement)
          break
        case 'faq':
          node = parseFAQ(container as unknown as NHTMLElement)
          break
        case 'cta':
          node = parseCTA(container as unknown as NHTMLElement)
          break
        case 'bulletList':
          node = parseBulletList(container as unknown as NHTMLElement)
          break
        case 'dataTable':
          node = parseDataTable(container as unknown as NHTMLElement)
          break
        default:
          node = null
      }

      if (node) lexicalChildren.push(node)
      currentBlockType = null
      currentBlockHtml = ''
      continue
    }

    if (currentBlockType) {
      // accumulate inner HTML for current block
      currentBlockHtml += part
      continue
    }

    // Regular HTML outside any block marker → Lexical paragraph/heading nodes
    const parsed = parse(part)
    for (const child of parsed.childNodes) {
      if (child.nodeType === 1) {
        const nodes = htmlElementToLexicalNodes(child as NHTMLElement)
        lexicalChildren.push(...nodes)
      } else if (child.nodeType === 3 && child.text.trim()) {
        lexicalChildren.push(paragraphNode([textNode(child.text)]))
      }
    }
  }

  if (lexicalChildren.length === 0) {
    throw new Error('API HTML content did not contain any usable content.')
  }

  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: lexicalChildren,
    },
  }
}
