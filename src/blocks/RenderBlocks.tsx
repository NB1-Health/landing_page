import type { Page } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'
import { getLocalizedPagePath } from '@/utilities/localizedPagePath'
import { RenderBlocksClient } from './RenderBlocks.client'

export async function RenderBlocks(props: {
  blocks: Page['layout'][0][]
  locale: AppLocale
  pageSlugs?: Partial<Record<AppLocale, string>> | null
}) {
  const checkoutBasePath = props.blocks.some((block) => block.blockType === 'cycleSelector')
    ? await getLocalizedPagePath('order-details', props.locale)
    : undefined
  return <RenderBlocksClient {...props} checkoutBasePath={checkoutBasePath} />
}
