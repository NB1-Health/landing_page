export type BreadcrumbRung = {
  name: string
  /** Locale-prefixed site path, e.g. `/en/journal`. Absolute URLs are built from
   * this in the JSON-LD; the rendered component links to it directly. */
  path: string
}

export type BreadcrumbLabels = { home: string; journal: string }

/**
 * The single source of truth for a Journal breadcrumb trail.
 *
 * Both the rendered `<nav>` and the `BreadcrumbList` JSON-LD are built from the
 * array this returns, because SEO-007 §5 requires them to agree *character for
 * character* and treats any drift as a P1 defect. Two functions producing the
 * same trail independently is exactly how that drift happens, so there is only
 * one.
 *
 * The last rung is always the current page. It still carries a path — the
 * rendered component drops the link and marks it `aria-current`, while the
 * JSON-LD keeps `item` as a self-reference, which is valid and is what the
 * approved previews emit.
 *
 * Depth runs 2–5:
 *
 * ```
 * Home › Journal                                        2
 * Home › Journal › {Article}                            3
 * Home › Journal › {Hub}                                3
 * Home › Journal › {Hub} › {Page}                       4
 * Home › Journal › Lexicon › {Category} › {Term}        5
 * ```
 *
 * The fifth rung is a lexicon term's category. The sources disagree about
 * whether it exists — SEO-007 §5's table shows four levels for a term, while the
 * designer brief §7 and all three lexicon previews show five — so the rung is
 * OPTIONAL and the trail follows the data. A term with a category gets five
 * rungs, one without gets four, and neither reading has to be hardcoded. If the
 * open question is ever answered the other way, nothing here changes.
 */
export function buildJournalTrail({
  locale,
  labels,
  hub,
  category,
  current,
}: {
  locale: string
  labels: BreadcrumbLabels
  /** Microbiome / Research / Lexicon. Omit for Journal's own articles, whose hub
   *  IS Journal and would otherwise repeat the rung above. */
  hub?: { name: string; path: string } | null
  /**
   * A lexicon category, between the hub and the term. Only the lexicon has this
   * level: its categories are real pages, so a trail that skipped them would
   * declare a term as a direct child of the Lexicon.
   *
   * Ignored without a hub — a category rung with nothing above it would put the
   * term two levels below Journal and claim a hierarchy that does not exist.
   */
  category?: { name: string; path: string } | null
  /** Omit when the hub (or Journal) is itself the current page. */
  current?: { name: string; path: string } | null
}): BreadcrumbRung[] {
  const rungs: BreadcrumbRung[] = [
    { name: labels.home, path: `/${locale}` },
    { name: labels.journal, path: `/${locale}/journal` },
  ]

  const hasHub = Boolean(hub && hub.name.trim())
  if (hub && hasHub) {
    rungs.push({ name: hub.name, path: hub.path })
  }

  if (hasHub && category && category.name.trim()) {
    rungs.push({ name: category.name, path: category.path })
  }

  if (current && current.name.trim()) {
    rungs.push({ name: current.name, path: current.path })
  }

  return rungs
}
