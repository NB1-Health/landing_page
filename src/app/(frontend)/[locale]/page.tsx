import PageTemplate, { generateMetadata } from './[slug]/page'

// Route configuration is not inherited from the imported page template.
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
