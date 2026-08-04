export const pageTypeValues = ['legacy', 'legal', 'contact'] as const

export type PageType = (typeof pageTypeValues)[number]

export const pageTypeOptions: { label: string; value: PageType }[] = [
  { label: 'Legacy (all blocks)', value: 'legacy' },
  { label: 'Legal', value: 'legal' },
  { label: 'Contact', value: 'contact' },
]

export const allowedBlockSlugsByPageType: Record<PageType, true | string[]> = {
  legacy: true,
  legal: ['legalDoc'],
  contact: ['contactPage'],
}

export function getAllowedBlockSlugs(pageType: unknown): true | string[] {
  return allowedBlockSlugsByPageType[pageType as PageType] ?? true
}

export function filterPageBlocks({ data }: { data?: unknown }): true | string[] {
  return getAllowedBlockSlugs((data as { pageType?: unknown })?.pageType)
}
