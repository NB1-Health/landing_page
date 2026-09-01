import type { Media } from '@/payload-types'

export const imageHero1: Omit<Media, 'agentTrashEligible' | 'createdAt' | 'id' | 'updatedAt'> = {
  alt: 'Straight metallic shapes with a blue gradient',
}
