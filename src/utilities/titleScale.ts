/**
 * A type-scale bucket for a page title, chosen by its length.
 *
 * Designer brief §9, edge case 1: the 122-character article title should set to
 * three lines on desktop. `preview-scientific-article.html` renders it at five,
 * which the brief itself calls "more than it should be".
 *
 * The obvious fix — shrink the h1 globally — is wrong twice over. Scientific
 * article titles run 41–122 characters (median 74) and pillar titles 43–71, so a
 * size that saves the longest article leaves a 41-character title looking
 * underset, and it would shrink every pillar title to solve a problem pillars do
 * not have.
 *
 * So the scale follows the string. Three buckets, chosen server-side from
 * `title.length`: no measurement, no JavaScript, no layout shift, and the same
 * title always renders at the same size.
 *
 * Counting characters rather than measuring text is an approximation, and a
 * deliberate one — the alternative is measuring in the browser after paint, which
 * means the title visibly resizes on load. A character count is stable, and at
 * these thresholds it is close enough: German runs ~8% longer, which moves a
 * borderline title one bucket down, which is the safe direction.
 */
export type TitleScale = 'default' | 'medium' | 'long'

export function titleScale(title: unknown): TitleScale {
  const length = typeof title === 'string' ? title.trim().length : 0

  // 100 is where 3 lines stops being reachable at the default 50px in a 760px
  // measure; 71 is the top of the pillar range, so anything above it is longer
  // than the design was drawn against.
  if (length > 100) return 'long'
  if (length > 71) return 'medium'
  return 'default'
}

/** The class for the `.jr-head` wrapper. */
export function titleScaleClass(title: unknown): string {
  const scale = titleScale(title)
  return scale === 'default' ? 'jr-head' : `jr-head jr-head--${scale}`
}
