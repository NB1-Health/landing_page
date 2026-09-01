import { foldForSearch } from '@/utilities/searchText'

/**
 * Grouping the term list on a lexicon category page.
 *
 * Pure functions, no React and no Payload, because this is the part of the
 * category page most likely to be wrong in a way nobody notices: the alphabet
 * rail and the headings have to agree with each other and with the actual rows,
 * and the interesting cases are all data-shaped rather than visual — a name
 * starting with a digit, a name starting with an umlaut, a letter holding 436
 * entries, a letter holding none.
 */

export type TermRow = {
  id: string
  title: string
  href: string
  definition: string
  italic: boolean
}

export type TermSubGroup = {
  /** The genus, when a letter was busy enough to sub-divide. Null otherwise. */
  name: string | null
  terms: TermRow[]
}

export type LetterGroup = {
  /** `A`–`Z`, or `#` for everything that does not start with a letter. */
  letter: string
  count: number
  subGroups: TermSubGroup[]
}

/** The rail: always all 26, plus `#` when there is anything to put in it. */
export type RailEntry = {
  letter: string
  count: number
  /** False when nothing starts with this letter. Rendered, but not a link. */
  active: boolean
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const OTHER = '#'

/**
 * Which bucket a title belongs to.
 *
 * Folded first, so `Ärzte` lands under A rather than inventing a letter, and
 * `16S rRNA gene sequencing` lands under `#` rather than under `1`. The brief's
 * rail is the Latin alphabet; a digit is not a letter and does not get its own
 * rung, but it does need somewhere to go — a term with no bucket is a term that
 * silently vanishes from a page whose whole purpose is completeness.
 */
export function bucketFor(title: string): string {
  const first = foldForSearch(title).charAt(0)
  if (!first) return OTHER
  const upper = first.toUpperCase()
  return ALPHABET.includes(upper) ? upper : OTHER
}

/**
 * The genus, for sub-grouping.
 *
 * The first whitespace-delimited word. Only meaningful in the taxa category,
 * where names are binomials and one letter can hold hundreds of rows across a
 * handful of genera — `Bacteroides` alone accounts for twenty of them. Everywhere
 * else the first word is not a genus and sub-grouping never triggers, which is
 * exactly why the threshold below is what decides rather than the category.
 */
function firstWord(title: string): string {
  return title.trim().split(/\s+/)[0] ?? title.trim()
}

/**
 * Group terms into letters, sub-dividing a letter that gets too long.
 *
 * `subGroupThreshold` defaults to 40, the figure in the brief. Above it, a letter
 * is split by first word — but only if that actually helps: splitting 60 rows
 * into 58 groups of one is worse than not splitting, so a division that does not
 * produce meaningfully-sized groups is discarded and the flat list kept.
 *
 * Sorted here with `Intl.Collator` rather than trusting the database's `ORDER BY
 * title`. Postgres collation is per-deployment and does not necessarily agree
 * with the reader's language about where `ä` or `ß` sorts — and if the sort and
 * the bucketing disagree, rows appear under the wrong sticky heading, which looks
 * like a data error rather than a collation one.
 */
export function groupTerms(
  terms: TermRow[],
  { htmlLang, subGroupThreshold = 40 }: { htmlLang: string; subGroupThreshold?: number },
): LetterGroup[] {
  const collator = new Intl.Collator(htmlLang, { sensitivity: 'base', numeric: true })
  const buckets = new Map<string, TermRow[]>()

  for (const term of terms) {
    const bucket = bucketFor(term.title)
    const list = buckets.get(bucket)
    if (list) list.push(term)
    else buckets.set(bucket, [term])
  }

  // `#` last: a reader scanning for a name expects the alphabet, and the digits
  // are the exception rather than the opening.
  const letters = [...buckets.keys()].sort((a, b) => {
    if (a === OTHER) return 1
    if (b === OTHER) return -1
    return collator.compare(a, b)
  })

  return letters.map((letter) => {
    const rows = [...(buckets.get(letter) ?? [])].sort((a, b) =>
      collator.compare(a.title, b.title),
    )

    if (rows.length <= subGroupThreshold) {
      return { letter, count: rows.length, subGroups: [{ name: null, terms: rows }] }
    }

    const byWord = new Map<string, TermRow[]>()
    for (const row of rows) {
      const word = firstWord(row.title)
      const list = byWord.get(word)
      if (list) list.push(row)
      else byWord.set(word, [row])
    }

    // Sub-grouping has to earn its place. If the average group is tiny, the
    // names are not a shared prefix and all the split does is add 50 headings to
    // a page that already has a filter.
    const averageSize = rows.length / byWord.size
    if (byWord.size < 2 || averageSize < 3) {
      return { letter, count: rows.length, subGroups: [{ name: null, terms: rows }] }
    }

    const subGroups: TermSubGroup[] = [...byWord.keys()]
      .sort(collator.compare)
      .map((name) => ({ name, terms: byWord.get(name) ?? [] }))

    return { letter, count: rows.length, subGroups }
  })
}

/**
 * The rail, from the groups.
 *
 * All 26 letters always, in order, whether or not anything starts with them —
 * the brief is explicit that empty letters are "inert, not hidden", and it is
 * right: a rail that omits its empty rungs changes width and position between
 * one category and the next, so the reader cannot learn where to aim. Eight of
 * the twenty-six are empty in the real corpus.
 */
export function railFor(groups: LetterGroup[]): RailEntry[] {
  const counts = new Map(groups.map((group) => [group.letter, group.count]))

  const entries: RailEntry[] = ALPHABET.map((letter) => ({
    letter,
    count: counts.get(letter) ?? 0,
    active: (counts.get(letter) ?? 0) > 0,
  }))

  // `#` only when occupied. Unlike the letters it is not a fixed landmark, so an
  // empty one is noise rather than a stable target.
  const other = counts.get(OTHER) ?? 0
  if (other > 0) entries.push({ letter: OTHER, count: other, active: true })

  return entries
}

/** The DOM id a letter heading gets, and what the rail links to. */
export function letterAnchor(letter: string): string {
  return letter === OTHER ? 'letter-other' : `letter-${letter.toLowerCase()}`
}
