import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import { buildLexiconCategoryRoute } from '@/utilities/lexiconCategoryRoute'

/**
 * The English lexicon category browse page — `/{locale}/{lexicon}/topics/{category}`.
 *
 * A static folder because a dynamic `[browse]` segment collides with the `[doc]`
 * segment that serves terms; see `lexiconCategoryRoute` for the full reasoning and
 * the guard that makes this folder 404 in any locale whose browse word is not
 * `topics`.
 */
export const dynamic = 'force-dynamic'

const route = buildLexiconCategoryRoute('topics')

export const generateMetadata = route.generateMetadata
export default route.Page
