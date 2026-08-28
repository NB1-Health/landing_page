import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'

import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { FormCustomBlock } from '@/blocks/FormCostom/Component'
import { BoxCardBlock } from '@/blocks/landingBlocks/BoxCard/Component'
import { FormulaCardBlock } from './landingBlocks/FormulaCard/Component'
import { ResultsCardBlock } from './landingBlocks/ResultsCard/Component'
import { ReviewCardBlock } from './landingBlocks/ReviewCard/Component'
import { StepsCardBlock } from './landingBlocks/StepsCard/Component'
import { SymptomsCardBlock } from './landingBlocks/SymptomsCard/Component'
import { VideoCardBlock } from './landingBlocks/VideoCard/Component'
import { KeyTakeawaysBlock } from '@/blocks/KeyTakeways/Component'
import { FAQBlockComponent } from './FAQ/Component'
import { DataTableBlockComponent } from '@/blocks/DataTable/Component'
import { CtaBlockComponent } from '@/blocks/CTA/Component'
import { BulletListBlockComponent } from '@/blocks/BulletList/Component'
import { ContactFormBlock } from '@/blocks/contactBlocks/ContactForm/Component'
import { ContactInfoBlock } from '@/blocks/contactBlocks/ContactInfo/Component'
import { ContactSectionBlock } from '@/blocks/contactBlocks/ContactSection/Component'
import { BenefitsBannerComponent } from './newLandingBlocks/BenefitsBanner/Component'
import { StepsBannerComponent } from './newLandingBlocks/StepsBanner/Component'
import { ProductBannerComponent } from './newLandingBlocks/ProductBanner/Component'
import { AccessBannerComponent } from './newLandingBlocks/AccessBanner/Component'
import { EarlyAccessBlockComponent } from './EarlyAccessBlock/Component'
import { EvolutionBandBlockComponent } from './EvolutionBandBlock/Component'
import { HeroBannerComponent } from './newLandingBlocks/HeroBanner/Component'
import { OutcomesSectionComponent } from './newLandingBlocks/OutcomesSection/Component'
import { ProcessDiagramComponent } from './newLandingBlocks/ProcessDiagram/Component'
import { StatBreakComponent } from './newLandingBlocks/StatBreak/Component'
import { ReserveCtaComponent } from './newLandingBlocks/ReserveCta/Component'
import { AthleteBannerComponent } from './newLandingBlocks/AthleteBanner/Component'
import { PriceBreakBlockComponent } from './PriceBreakBlock/Component'
import { ScienceBoardBlockComponent } from './ScienceBoardBlock/Component'
import { FloatingCTABlockComponent } from './FloatingCTA/Component'
import { YpHeroComponent } from './yourPlanBlocks/Hero/Component'
import { YpPlansComponent } from './yourPlanBlocks/Plans/Component'
import { YpThreeComponentsComponent } from './yourPlanBlocks/ThreeComponents/Component'
import { YpDashboardComponent } from './yourPlanBlocks/Dashboard/Component'
import { YpTimelineComponent } from './yourPlanBlocks/Timeline/Component'
import { YpScienceBoardComponent } from './yourPlanBlocks/ScienceBoard/Component'
import { YpAthletesComponent } from './yourPlanBlocks/Athletes/Component'
import { YpBreakupComponent } from './yourPlanBlocks/Breakup/Component'
import { YpFaqComponent } from './yourPlanBlocks/Faq/Component'
import { YpStickyBuyComponent } from './yourPlanBlocks/StickyBuy/Component'
import { YpReassuranceComponent } from './yourPlanBlocks/Reassurance/Component'
import { YpBuyBoxComponent } from './yourPlanBlocks/BuyBox/Component'
import { OrderStepHeroComponent } from './checkoutBlocks/OrderStepHero/Component'
import { OrderStepNavComponent } from './checkoutBlocks/OrderStepNav/Component'
import { LegalStripComponent } from './checkoutBlocks/LegalStrip/Component'
import { TrustSealsBarComponent } from './checkoutBlocks/TrustSealsBar/Component'
import { OrderTimelineComponent } from './checkoutBlocks/OrderTimeline/Component'
import { FormulaKitComponent } from './checkoutBlocks/FormulaKit/Component'
import { CheckoutFaqComponent } from './checkoutBlocks/CheckoutFaq/Component'
import { EndCardComponent } from './checkoutBlocks/EndCard/Component'
import { PlanSummaryCardComponent } from './checkoutBlocks/PlanSummaryCard/Component'
import { GuaranteeBadgesComponent } from './checkoutBlocks/GuaranteeBadges/Component'
import { CyclesPricingGridComponent } from './checkoutBlocks/CyclesPricingGrid/Component'
import { ReinforceCtaComponent } from './checkoutBlocks/ReinforceCta/Component'
import { PlanPivotComponent } from './checkoutBlocks/PlanPivot/Component'
import { StickyCtaBarComponent } from './checkoutBlocks/StickyCtaBar/Component'
import { PlanSelectorComponent } from './checkoutBlocks/PlanSelector/Component'
import { PlanStickyBarComponent } from './checkoutBlocks/PlanStickyBar/Component'
import { CycleSelectorComponent } from './checkoutBlocks/CycleSelector/Component'
import { CheckoutFormComponent } from './checkoutBlocks/CheckoutForm/Component'
import { HomepageHeroComponent } from './HomepageHero/Component'
import { TheCaseComponent } from './TheCase/Component'
import { TwoModelsComponent } from './TwoModels/Component'
import { BiologyHeroComponent } from './BiologyHero/Component'
import { BiologyTwoPeopleComponent } from './BiologyTwoPeople/Component'
import { BiologyClearestReadComponent } from './BiologyClearestRead/Component'
import { BiologyReadingToFormulaComponent } from './BiologyReadingToFormula/Component'
import { BiologyIndustryFlipComponent } from './BiologyIndustryFlip/Component'
import { ProtocolHeroComponent } from './ProtocolHero/Component'
import { ProtocolJourneyComponent } from './ProtocolJourney/Component'
import { ProtocolKitComponent } from './ProtocolKit/Component'
import { ProtocolFormulaUnitsComponent } from './ProtocolFormulaUnits/Component'
import { ProtocolLibraryComponent } from './ProtocolLibrary/Component'
import { ProtocolCredStripComponent } from './ProtocolCredStrip/Component'
import { ProtocolWhatArrivesComponent } from './ProtocolWhatArrives/Component'
import { ProtocolLivingLifelineComponent } from './ProtocolLivingLifeline/Component'
import { GutFirstComponent } from './GutFirst/Component'
import { HowItWorksComponent } from './HowItWorks/Component'
import { LabHeroComponent } from './LabHero/Component'
import { LabRoadmapComponent } from './LabRoadmap/Component'
import { LabReadsComponent } from './LabReads/Component'
import { LabComparisonComponent } from './LabComparison/Component'
import { LabBandComponent } from './LabBand/Component'
import { LabReadingPanelComponent } from './LabReadingPanel/Component'
import { LabFormulaComponent } from './LabFormula/Component'
import { LabProtocolComponent } from './LabProtocol/Component'
import { LabJourneyComponent } from './LabJourney/Component'
import { LabScienceBoardComponent } from './LabScienceBoard/Component'
import { WhatArrivesComponent } from './WhatArrives/Component'
import { OutcomesComponent } from './Outcomes/Component'
import { AthletesComponent } from './Athletes/Component'
import { ScienceBoardNewComponent } from './ScienceBoardNew/Component'
import { StandardsComponent } from './Standards/Component'
import { PlansComponent } from './Plans/Component'
import { CloseBandComponent } from './CloseBand/Component'
import { FaqPageComponent } from './FaqPage/Component'
import { LegalDocComponent } from './LegalDoc/Component'
import { ContactPageComponent } from './ContactPage/Component'
import { ReferralWidgetComponent } from './ReferralWidget/Component'
import { ReferInfoComponent } from './ReferInfo/Component'
import { ReferFaqComponent } from './ReferFaq/Component'
import { CustomerReviewsComponent } from './CustomerReviews/Component'

const blockComponents: Record<string, React.FC<any>> = {
  content: ContentBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  'form-custom': FormCustomBlock,
  'box-card': BoxCardBlock,
  'formula-card': FormulaCardBlock,
  'results-card': ResultsCardBlock,
  'review-card': ReviewCardBlock,
  'steps-card': StepsCardBlock,
  'symptoms-card': SymptomsCardBlock,
  'video-card': VideoCardBlock,
  keyTakeaways: KeyTakeawaysBlock,
  faq: FAQBlockComponent,
  dataTable: DataTableBlockComponent,
  ctaBlock: CtaBlockComponent,
  bulletList: BulletListBlockComponent,
  'contact-form': ContactFormBlock,
  'contact-info': ContactInfoBlock,
  'contact-section': ContactSectionBlock,
  benefitsBanner: BenefitsBannerComponent,
  stepsBanner: StepsBannerComponent,
  productBanner: ProductBannerComponent,
  accessBanner: AccessBannerComponent,
  earlyAccess: EarlyAccessBlockComponent,
  evolutionBand: EvolutionBandBlockComponent,
  heroBanner: HeroBannerComponent,
  outcomesSection: OutcomesSectionComponent,
  processDiagram: ProcessDiagramComponent,
  statBreak: StatBreakComponent,
  athleteBanner: AthleteBannerComponent,
  reserveCta: ReserveCtaComponent,
  priceBreak: PriceBreakBlockComponent,
  scienceBoard: ScienceBoardBlockComponent,
  floatingCTA: FloatingCTABlockComponent,
  ypHero: YpHeroComponent,
  ypPlans: YpPlansComponent,
  ypComponents: YpThreeComponentsComponent,
  ypDashboard: YpDashboardComponent,
  ypTimeline: YpTimelineComponent,
  ypScienceBoard: YpScienceBoardComponent,
  ypAthletes: YpAthletesComponent,
  ypBreakup: YpBreakupComponent,
  ypFaq: YpFaqComponent,
  ypReassurance: YpReassuranceComponent,
  ypBuyBox: YpBuyBoxComponent,
  ypStickyBuy: YpStickyBuyComponent,
  orderStepNav: OrderStepNavComponent,
  legalStrip: LegalStripComponent,
  orderStepHero: OrderStepHeroComponent,
  trustSealsBar: TrustSealsBarComponent,
  orderTimeline: OrderTimelineComponent,
  formulaKit: FormulaKitComponent,
  checkoutFaq: CheckoutFaqComponent,
  endCard: EndCardComponent,
  planSummaryCard: PlanSummaryCardComponent,
  guaranteeBadges: GuaranteeBadgesComponent,
  cyclesPricingGrid: CyclesPricingGridComponent,
  reinforceCta: ReinforceCtaComponent,
  planPivot: PlanPivotComponent,
  stickyCtaBar: StickyCtaBarComponent,
  planSelector: PlanSelectorComponent,
  planStickyBar: PlanStickyBarComponent,
  cycleSelector: CycleSelectorComponent,
  checkoutForm: CheckoutFormComponent,
  homepageHero: HomepageHeroComponent,
  theCase: TheCaseComponent,
  twoModels: TwoModelsComponent,
  gutFirst: GutFirstComponent,
  howItWorks: HowItWorksComponent,
  biologyHero: BiologyHeroComponent,
  biologyTwoPeople: BiologyTwoPeopleComponent,
  biologyClearestRead: BiologyClearestReadComponent,
  biologyReadingToFormula: BiologyReadingToFormulaComponent,
  biologyIndustryFlip: BiologyIndustryFlipComponent,
  protocolHero: ProtocolHeroComponent,
  protocolJourney: ProtocolJourneyComponent,
  protocolKit: ProtocolKitComponent,
  protocolFormulaUnits: ProtocolFormulaUnitsComponent,
  protocolLibrary: ProtocolLibraryComponent,
  protocolCredStrip: ProtocolCredStripComponent,
  protocolWhatArrives: ProtocolWhatArrivesComponent,
  protocolLivingLifeline: ProtocolLivingLifelineComponent,
  labHero: LabHeroComponent,
  labRoadmap: LabRoadmapComponent,
  labReads: LabReadsComponent,
  labComparison: LabComparisonComponent,
  labBand: LabBandComponent,
  labReadingPanel: LabReadingPanelComponent,
  labFormula: LabFormulaComponent,
  labProtocol: LabProtocolComponent,
  labJourney: LabJourneyComponent,
  labScienceBoard: LabScienceBoardComponent,
  whatArrives: WhatArrivesComponent,
  outcomes: OutcomesComponent,
  athletesSection: AthletesComponent,
  scienceBoardSection: ScienceBoardNewComponent,
  standardsSection: StandardsComponent,
  plansSection: PlansComponent,
  closeBand: CloseBandComponent,
  faqPage: FaqPageComponent,
  legalDoc: LegalDocComponent,
  contactPage: ContactPageComponent,
  referralWidget: ReferralWidgetComponent,
  referInfo: ReferInfoComponent,
  referFaq: ReferFaqComponent,
  customerReviews: CustomerReviewsComponent,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  locale: AppLocale
  pageSlugs?: Partial<Record<AppLocale, string>> | null
}> = ({ blocks, locale, pageSlugs }) => {
  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0
  if (!hasBlocks) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          const Block = blockComponents[blockType]

          if (Block) {
            return (
              <div className="p-0" key={index}>
                <Block {...block} locale={locale} pageSlugs={pageSlugs} disableInnerContainer />
              </div>
            )
          }
        }

        return null
      })}
    </Fragment>
  )
}
