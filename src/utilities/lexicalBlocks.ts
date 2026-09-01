type LexicalNode = {
  type?: unknown
  blockType?: unknown
  fields?: { blockType?: unknown } | null
  children?: unknown
  root?: unknown
}

/**
 * Does this rich-text document already contain a given block?
 *
 * Used to decide whether a component should be placed automatically. The
 * compliance note is required on every pillar, but an editor may also have put
 * one exactly where the argument needs it — appending a second one would be both
 * redundant and, since the wording is legal framing, faintly absurd.
 *
 * Walks the tree rather than checking the top level: lexical nests blocks inside
 * whatever container they were dropped into, so a note inside a quote or a list
 * is still a note that exists.
 *
 * `blockType` lives on `fields` in the serialized form; older documents and some
 * fixtures carry it on the node. Both are checked because getting this wrong
 * fails open — a duplicated disclaimer — rather than closed.
 */
export function hasLexicalBlock(data: unknown, blockType: string): boolean {
  const seen = new Set<unknown>()

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false
    // Rich-text JSON is a tree, but it arrives from the database and from
    // fixtures, so a cycle would hang the render rather than throw.
    if (seen.has(node)) return false
    seen.add(node)

    if (Array.isArray(node)) return node.some(walk)

    const candidate = node as LexicalNode

    if (candidate.type === 'block') {
      const declared = candidate.fields?.blockType ?? candidate.blockType
      if (declared === blockType) return true
    }

    if (candidate.root && walk(candidate.root)) return true
    if (candidate.children && walk(candidate.children)) return true

    return false
  }

  return walk(data)
}
