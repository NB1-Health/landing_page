/**
 * A header or footer relationship arrives either as an id (depth 0) or a
 * populated document (higher depth). Normalise to the string id the `Header` and
 * `Footer` components and `getCachedHeader` / `getCachedFooter` expect, while
 * Postgres ids come back as numbers.
 *
 * Deliberately dependency-free and in its own module: this used to live in
 * `journalCopy.ts`, which imports the Payload config through `getCachedGlobal`,
 * so importing this one pure function dragged the whole CMS in — including into
 * unit tests.
 */
export function toChromeId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    const id = (value as { id?: unknown }).id
    return id === null || id === undefined ? null : String(id)
  }
  return String(value)
}
