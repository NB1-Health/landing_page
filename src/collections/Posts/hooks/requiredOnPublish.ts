/**
 * Field validators that only bite when a post is being published.
 *
 * Why not plain `required: true`? Two reasons specific to this project:
 *
 * 1. Existing posts predate these fields. A hard `required` would make the
 *    admin refuse to save any existing draft until every new field is filled,
 *    which blocks editors on documents they did not touch.
 * 2. The `source: 'api'` ingestion path writes posts without going through the
 *    editor. `intro` and `content` already carry the same escape hatch — see
 *    their `validate` in ../index.ts.
 *
 * Net effect: drafts save freely, publishing enforces the content model.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * `_status` is a plain string on a normal single-locale save, but a
 * locale-keyed map on a `locale: 'all'` write because the project runs with
 * `experimental.localizeStatus`. Treat either form as "publishing".
 */
function isPublishing(status: unknown): boolean {
  if (status === 'published') return true
  if (isRecord(status)) return Object.values(status).includes('published')
  return false
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Returns a `validate` fn that requires a value only when the post is being
 * published, and never for API-sourced posts.
 *
 * @param label Field name as it should read in the editor-facing error.
 */
export function requiredOnPublish(label: string) {
  return (value: unknown, options: { data?: Record<string, unknown> }) => {
    if (options?.data?.source === 'api') return true
    if (!isPublishing(options?.data?._status)) return true
    return isEmpty(value) ? `${label} is required before publishing.` : true
  }
}
