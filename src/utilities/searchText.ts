/**
 * Text folding for the lexicon filter and search.
 *
 * The designer brief §8 requires matching that ignores "case and accents". That
 * matters more here than it looks: the corpus is full of names a reader will type
 * without diacritics — *Bacteroides* is easy, but "Läsion", "Ernährung" and
 * "prä-biotisch" are all things a German reader may type either way, and a
 * filter that returns nothing for "praebiotisch" reads as broken rather than as
 * strict.
 *
 * NFD splits a character into its base plus its combining marks; the range below
 * is exactly those marks, so removing them turns "ä" into "a" without touching
 * anything else. Written once and shared, because a category page that folds and
 * an index that does not would behave differently for the same query.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Does a term match a query?
 *
 * Matches the name AND the definition sentence, per §8 — a reader searching
 * "short chain fatty acid" should find *Butyrate*, whose name contains none of
 * those words.
 *
 * `includes`, not a prefix match: the brief's own example is typing "butyr" to
 * find "Butyrate production", where the match is at the start, but "acid" should
 * still find "Valeric acid".
 */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const needle = foldForSearch(query)
  if (!needle) return true

  return fields.some((field) => (field ? foldForSearch(field).includes(needle) : false))
}

/**
 * "1 term", "436 terms" — the count with a correctly inflected noun.
 *
 * `Intl.PluralRules` rather than `count === 1`, because that test is only right
 * for the four languages we ship today and silently wrong for the ones a market
 * might add: Polish has three plural categories and Russian four, so a hardcoded
 * singular/plural pair produces a grammatical error rather than a missing string,
 * which is the kind of defect that survives review.
 *
 * `forms` is keyed by plural category. `other` is required and is the fallback for
 * any category a dictionary has not supplied, so an under-translated locale
 * degrades to a slightly wrong noun instead of throwing.
 *
 * EVERY form must contain `{count}`, including the singular. Writing the `one`
 * form as a literal "1 term" looks harmless and is wrong in French, where
 * `Intl.PluralRules` puts ZERO in the `one` category — an empty category would
 * have rendered "1 terme".
 */
export function pluralCount({
  count,
  forms,
  htmlLang,
}: {
  count: number
  forms: { one?: string; other: string } & Record<string, string | undefined>
  /** A real BCP-47 tag — our locale codes are not all valid ones. */
  htmlLang: string
}): string {
  let category = 'other'
  try {
    category = new Intl.PluralRules(htmlLang).select(count)
  } catch {
    // An unrecognised tag. `other` is already the default.
  }

  const template = forms[category] ?? forms.other
  return template.replace('{count}', String(count))
}

/**
 * "436 terms", or "12 of 436 terms" once filtered.
 *
 * Templates come from the dictionary so word order can differ by language —
 * building this by concatenation in the component would hardcode English syntax.
 *
 * The unfiltered case is pluralised; the filtered case is not, because "{shown} of
 * {total} terms" agrees with `total`, which is the number that does not change
 * while someone types. A page with 436 terms showing one match reads "1 of 436
 * terms", which is correct.
 */
export function formatCount({
  shown,
  total,
  templates,
  htmlLang,
}: {
  shown: number
  total: number
  templates: { one?: string; other: string; filtered: string }
  htmlLang: string
}): string {
  if (shown === total) {
    return pluralCount({
      count: total,
      forms: { one: templates.one, other: templates.other },
      htmlLang,
    })
  }
  return templates.filtered.replace('{shown}', String(shown)).replace('{total}', String(total))
}
