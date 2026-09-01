import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'

import { Content } from '../../blocks/Content/config'
import { hero } from '@/heros/config'
import { BoxCardBlock } from '@/blocks/landingBlocks/BoxCard/config'

import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { capturePagePublication, revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import { MetaImageField, OverviewField, PreviewField } from '@payloadcms/plugin-seo/fields'

import { costomSlugField } from '@/fields/slug'
import { chromeFields } from '@/fields/contentDocument'
import { rejectHubSlugCollision } from './hooks/rejectHubSlugCollision'
import { FormulaCardBlock } from '@/blocks/landingBlocks/FormulaCard/config'
import { ResultsCardBlock } from '@/blocks/landingBlocks/ResultsCard/config'
import { ReviewCardBlock } from '@/blocks/landingBlocks/ReviewCard/config'
import { StepsCardBlock } from '@/blocks/landingBlocks/StepsCard/config'
import { SymptomsCardBlock } from '@/blocks/landingBlocks/SymptomsCard/config'
import { VideoCardBlock } from '@/blocks/landingBlocks/VideoCard/config'
import { BenefitsBanner } from '@/blocks/newLandingBlocks/BenefitsBanner/config'
import { StepsBanner } from '@/blocks/newLandingBlocks/StepsBanner/config'
import { ProductBanner } from '@/blocks/newLandingBlocks/ProductBanner/config'
import { AccessBanner } from '@/blocks/newLandingBlocks/AccessBanner/config'
import { EvolutionBandBlock } from '@/blocks/EvolutionBandBlock/config'
import { HeroBannerBlock } from '@/blocks/newLandingBlocks/HeroBanner/config'
import { OutcomesSectionBlock } from '@/blocks/newLandingBlocks/OutcomesSection/config'
import { ProcessDiagramBlock } from '@/blocks/newLandingBlocks/ProcessDiagram/config'
import { StatBreakBlock } from '@/blocks/newLandingBlocks/StatBreak/config'
import { ReserveCtaBlock } from '@/blocks/newLandingBlocks/ReserveCta/config'
import { AthleteBannerBlock } from '@/blocks/newLandingBlocks/AthleteBanner/config'
import { PriceBreakBlock } from '@/blocks/PriceBreakBlock/config'
import { ScienceBoardBlock } from '@/blocks/ScienceBoardBlock/config'
import { FloatingCTABlock } from '@/blocks/FloatingCTA/config'
import { YpHeroBlock } from '@/blocks/yourPlanBlocks/Hero/config'
import { YpPlansBlock } from '@/blocks/yourPlanBlocks/Plans/config'
import { YpThreeComponentsBlock } from '@/blocks/yourPlanBlocks/ThreeComponents/config'
import { YpDashboardBlock } from '@/blocks/yourPlanBlocks/Dashboard/config'
import { YpTimelineBlock } from '@/blocks/yourPlanBlocks/Timeline/config'
import { YpScienceBoardBlock } from '@/blocks/yourPlanBlocks/ScienceBoard/config'
import { YpAthletesBlock } from '@/blocks/yourPlanBlocks/Athletes/config'
import { YpBreakupBlock } from '@/blocks/yourPlanBlocks/Breakup/config'
import { YpFaqBlock } from '@/blocks/yourPlanBlocks/Faq/config'
import { YpStickyBuyBlock } from '@/blocks/yourPlanBlocks/StickyBuy/config'
import { YpReassuranceBlock } from '@/blocks/yourPlanBlocks/Reassurance/config'
import { YpBuyBoxBlock } from '@/blocks/yourPlanBlocks/BuyBox/config'
import { OrderStepHero } from '@/blocks/checkoutBlocks/OrderStepHero/config'
import { OrderStepNav } from '@/blocks/checkoutBlocks/OrderStepNav/config'
import { LegalStrip } from '@/blocks/checkoutBlocks/LegalStrip/config'
import { OrderTimeline } from '@/blocks/checkoutBlocks/OrderTimeline/config'
import { FormulaKit } from '@/blocks/checkoutBlocks/FormulaKit/config'
import { CheckoutFaq } from '@/blocks/checkoutBlocks/CheckoutFaq/config'
import { EndCard } from '@/blocks/checkoutBlocks/EndCard/config'
import { PlanSummaryCard } from '@/blocks/checkoutBlocks/PlanSummaryCard/config'
import { GuaranteeBadges } from '@/blocks/checkoutBlocks/GuaranteeBadges/config'
import { CyclesPricingGrid } from '@/blocks/checkoutBlocks/CyclesPricingGrid/config'
import { ReinforceCta } from '@/blocks/checkoutBlocks/ReinforceCta/config'
import { PlanPivot } from '@/blocks/checkoutBlocks/PlanPivot/config'
import { StickyCtaBar } from '@/blocks/checkoutBlocks/StickyCtaBar/config'
import { PlanSelector } from '@/blocks/checkoutBlocks/PlanSelector/config'
import { PlanStickyBar } from '@/blocks/checkoutBlocks/PlanStickyBar/config'
import { CycleSelector } from '@/blocks/checkoutBlocks/CycleSelector/config'
import { CheckoutForm } from '@/blocks/checkoutBlocks/CheckoutForm/config'
import { HomepageHeroBlock } from '@/blocks/HomepageHero/config'
import { TheCaseBlock } from '@/blocks/TheCase/config'
import { TwoModelsBlock } from '@/blocks/TwoModels/config'
import { BiologyHeroBlock } from '@/blocks/BiologyHero/config'
import { BiologyTwoPeopleBlock } from '@/blocks/BiologyTwoPeople/config'
import { BiologyClearestReadBlock } from '@/blocks/BiologyClearestRead/config'
import { BiologyReadingToFormulaBlock } from '@/blocks/BiologyReadingToFormula/config'
import { BiologyIndustryFlipBlock } from '@/blocks/BiologyIndustryFlip/config'
import { ProtocolHeroBlock } from '@/blocks/ProtocolHero/config'
import { ProtocolJourneyBlock } from '@/blocks/ProtocolJourney/config'
import { ProtocolKitBlock } from '@/blocks/ProtocolKit/config'
import { ProtocolFormulaUnitsBlock } from '@/blocks/ProtocolFormulaUnits/config'
import { ProtocolLibraryBlock } from '@/blocks/ProtocolLibrary/config'
import { ProtocolCredStripBlock } from '@/blocks/ProtocolCredStrip/config'
import { ProtocolWhatArrivesBlock } from '@/blocks/ProtocolWhatArrives/config'
import { ProtocolLivingLifelineBlock } from '@/blocks/ProtocolLivingLifeline/config'
import { GutFirstBlock } from '@/blocks/GutFirst/config'
import { HowItWorksBlock } from '@/blocks/HowItWorks/config'
import { LabHeroBlock } from '@/blocks/LabHero/config'
import { LabRoadmapBlock } from '@/blocks/LabRoadmap/config'
import { LabReadsBlock } from '@/blocks/LabReads/config'
import { LabComparisonBlock } from '@/blocks/LabComparison/config'
import { LabBandBlock } from '@/blocks/LabBand/config'
import { LabReadingPanelBlock } from '@/blocks/LabReadingPanel/config'
import { LabFormulaBlock } from '@/blocks/LabFormula/config'
import { LabProtocolBlock } from '@/blocks/LabProtocol/config'
import { LabJourneyBlock } from '@/blocks/LabJourney/config'
import { LabScienceBoardBlock } from '@/blocks/LabScienceBoard/config'
import { WhatArrivesBlock } from '@/blocks/WhatArrives/config'
import { OutcomesBlock } from '@/blocks/Outcomes/config'
import { AthletesBlock } from '@/blocks/Athletes/config'
import { ScienceBoardNewBlock } from '@/blocks/ScienceBoardNew/config'
import { StandardsBlock } from '@/blocks/Standards/config'
import { PlansBlock } from '@/blocks/Plans/config'
import { CloseBandBlock } from '@/blocks/CloseBand/config'
import { FaqPageBlock } from '@/blocks/FaqPage/config'
import { LegalDocBlock } from '@/blocks/LegalDoc/config'
import { ContactPageBlock } from '@/blocks/ContactPage/config'
import { ReferralWidgetBlock } from '@/blocks/ReferralWidget/config'
import { ReferInfoBlock } from '@/blocks/ReferInfo/config'
import { ReferFaqBlock } from '@/blocks/ReferFaq/config'
import { seoOverridesField } from '@/fields/seoOverrides'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  // Publication status is locale-specific, so editors publish one locale at a time.
  disableBulkEdit: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    meta: {
      title: true,
      description: true,
      image: true,
      robots: true,
      canonicalURL: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    pagination: { defaultLimit: 5 },

    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },

    ...chromeFields({ noun: 'page' }),

    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },

        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                Content,
                BoxCardBlock,
                FormulaCardBlock,
                ResultsCardBlock,
                ReviewCardBlock,
                StepsCardBlock,
                SymptomsCardBlock,
                VideoCardBlock,
                BenefitsBanner,
                StepsBanner,
                ProductBanner,
                AccessBanner,
                EvolutionBandBlock,
                HeroBannerBlock,
                OutcomesSectionBlock,
                ProcessDiagramBlock,
                StatBreakBlock,
                ReserveCtaBlock,
                AthleteBannerBlock,
                PriceBreakBlock,
                ScienceBoardBlock,
                FloatingCTABlock,
                YpHeroBlock,
                YpPlansBlock,
                YpThreeComponentsBlock,
                YpDashboardBlock,
                YpTimelineBlock,
                YpScienceBoardBlock,
                YpAthletesBlock,
                YpBreakupBlock,
                YpFaqBlock,
                YpReassuranceBlock,
                YpBuyBoxBlock,
                YpStickyBuyBlock,
                OrderStepNav,
                LegalStrip,
                OrderStepHero,
                OrderTimeline,
                FormulaKit,
                CheckoutFaq,
                EndCard,
                PlanSummaryCard,
                GuaranteeBadges,
                CyclesPricingGrid,
                ReinforceCta,
                PlanPivot,
                StickyCtaBar,
                PlanSelector,
                PlanStickyBar,
                CycleSelector,
                CheckoutForm,
                HomepageHeroBlock,
                TheCaseBlock,
                TwoModelsBlock,
                GutFirstBlock,
                HowItWorksBlock,
                BiologyHeroBlock,
                BiologyTwoPeopleBlock,
                BiologyClearestReadBlock,
                BiologyReadingToFormulaBlock,
                BiologyIndustryFlipBlock,
                ProtocolHeroBlock,
                ProtocolJourneyBlock,
                ProtocolKitBlock,
                ProtocolFormulaUnitsBlock,
                ProtocolLibraryBlock,
                ProtocolCredStripBlock,
                ProtocolWhatArrivesBlock,
                ProtocolLivingLifelineBlock,
                LabHeroBlock,
                LabRoadmapBlock,
                LabReadsBlock,
                LabComparisonBlock,
                LabBandBlock,
                LabReadingPanelBlock,
                LabFormulaBlock,
                LabProtocolBlock,
                LabJourneyBlock,
                LabScienceBoardBlock,
                WhatArrivesBlock,
                OutcomesBlock,
                AthletesBlock,
                ScienceBoardNewBlock,
                StandardsBlock,
                PlansBlock,
                CloseBandBlock,
                FaqPageBlock,
                LegalDocBlock,
                ContactPageBlock,
                ReferralWidgetBlock,
                ReferInfoBlock,
                ReferFaqBlock,
              ],
              required: true,
              admin: { initCollapsed: true },
            },
          ],
          label: 'Content',
        },

        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            {
              name: 'title',
              label: 'Title Tag',
              type: 'text',
              localized: true,
              required: false,
              maxLength: 60,
              admin: {
                description: 'Custom meta title per page. If empty, uses page Title.',
              },
            },
            {
              name: 'description',
              label: 'Meta Description',
              type: 'textarea',
              localized: true,
              required: false,
              maxLength: 155,
              admin: {
                description: 'Custom meta description per page. If empty, uses a fallback.',
              },
            },
            MetaImageField({
              relationTo: 'media',
            }),
            {
              name: 'robots',
              label: 'Robots Tag',
              type: 'select',
              defaultValue: 'index,follow',
              options: [
                { label: 'Index, Follow', value: 'index,follow' },
                { label: 'Noindex, Follow', value: 'noindex,follow' },
                { label: 'Index, Nofollow', value: 'index,nofollow' },
                { label: 'Noindex, Nofollow', value: 'noindex,nofollow' },
              ],
              admin: { description: 'Controls indexing & link following.' },
            },
            {
              name: 'canonicalURL',
              label: 'Canonical URL',
              type: 'text',
              admin: {
                placeholder: 'https://example.com/page',
                description:
                  'Legacy value retained for content compatibility. Public localized pages use a computed self-canonical.',
              },
              validate: (val: unknown) => {
                if (!val) return true
                try {
                  new URL(String(val))
                  return true
                } catch {
                  return 'Please enter a valid absolute URL (including https://).'
                }
              },
            },
            seoOverridesField(),
            {
              name: 'ogTitle',
              label: 'OG Title',
              type: 'text',
              localized: true,
              maxLength: 60,
              admin: { description: 'Optional. Defaults to Title Tag if empty.' },
            },
            {
              name: 'ogDescription',
              label: 'OG Description',
              type: 'textarea',
              localized: true,
              maxLength: 155,
              admin: { description: 'Optional. Defaults to Meta Description if empty.' },
            },
            {
              name: 'ogImage',
              label: 'Open Graph Image',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional. Defaults to Meta Image if empty.' },
            },
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },

    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },

    costomSlugField({ localized: true, collection: 'pages' }),
  ],

  hooks: {
    beforeOperation: [capturePagePublication],
    beforeValidate: [
      // First, so a colliding slug is refused before any of the meta defaulting
      // below runs and before the document is written.
      rejectHubSlugCollision,
      ({ data }) => {
        if (!data) return data

        data.meta = data.meta || {}

        data.meta.title = data.meta.title || data.title
        data.meta.ogTitle = data.meta.ogTitle || data.meta.title || data.title
        data.meta.ogDescription = data.meta.ogDescription || data.meta.description
        data.meta.ogImage = data.meta.ogImage || data.meta.image

        return data
      },
    ],
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },

  versions: {
    drafts: {
      autosave: { interval: 5000 },
      localizeStatus: true,
      schedulePublish: true,
    },
    maxPerDoc: 10,
  },
}
