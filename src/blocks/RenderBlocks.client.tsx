'use client'

import React, { Fragment } from 'react'
import dynamic from 'next/dynamic'

import type { Page } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'

const ContentBlock = dynamic(() => import('@/blocks/Content/Component').then((m) => m.ContentBlock))
const RdHeroComponent = dynamic(() => import('@/blocks/redesign/Hero/Component').then((m) => m.RdHeroComponent))
const RdProtocolComponent = dynamic(() => import('@/blocks/redesign/Protocol/Component').then((m) => m.RdProtocolComponent))
const RdFormulaComponent = dynamic(() => import('@/blocks/redesign/Formula/Component').then((m) => m.RdFormulaComponent))
const RdProofComponent = dynamic(() => import('@/blocks/redesign/Proof/Component').then((m) => m.RdProofComponent))
const RdBiologyComponent = dynamic(() => import('@/blocks/redesign/Biology/Component').then((m) => m.RdBiologyComponent))
const RdLabComponent = dynamic(() => import('@/blocks/redesign/Lab/Component').then((m) => m.RdLabComponent))
const RdReviewsComponent = dynamic(() => import('@/blocks/redesign/Reviews/Component').then((m) => m.RdReviewsComponent))
const RdPlansComponent = dynamic(() => import('@/blocks/redesign/Plans/Component').then((m) => m.RdPlansComponent))
const RdCloseComponent = dynamic(() => import('@/blocks/redesign/Close/Component').then((m) => m.RdCloseComponent))
const RdPgHeroComponent = dynamic(() => import('@/blocks/redesign/PgHero/Component').then((m) => m.RdPgHeroComponent))
const RdPgPlansComponent = dynamic(() => import('@/blocks/redesign/PgPlans/Component').then((m) => m.RdPgPlansComponent))
const RdPgAdvancedComponent = dynamic(() => import('@/blocks/redesign/PgAdvanced/Component').then((m) => m.RdPgAdvancedComponent))
const RdPgWordsComponent = dynamic(() => import('@/blocks/redesign/PgWords/Component').then((m) => m.RdPgWordsComponent))
const RdPgDataComponent = dynamic(() => import('@/blocks/redesign/PgData/Component').then((m) => m.RdPgDataComponent))
const RdPgBoardStripComponent = dynamic(() => import('@/blocks/redesign/PgBoardStrip/Component').then((m) => m.RdPgBoardStripComponent))
const RdPgTimelineComponent = dynamic(() => import('@/blocks/redesign/PgTimeline/Component').then((m) => m.RdPgTimelineComponent))
const RdPgBoardComponent = dynamic(() => import('@/blocks/redesign/PgBoard/Component').then((m) => m.RdPgBoardComponent))
const RdPgAthletesComponent = dynamic(() => import('@/blocks/redesign/PgAthletes/Component').then((m) => m.RdPgAthletesComponent))
const RdPgQuietComponent = dynamic(() => import('@/blocks/redesign/PgQuiet/Component').then((m) => m.RdPgQuietComponent))
const RdPgGuaranteeComponent = dynamic(() => import('@/blocks/redesign/PgGuarantee/Component').then((m) => m.RdPgGuaranteeComponent))
const RdPgFaqComponent = dynamic(() => import('@/blocks/redesign/PgFaq/Component').then((m) => m.RdPgFaqComponent))
const RdPgBuyComponent = dynamic(() => import('@/blocks/redesign/PgBuy/Component').then((m) => m.RdPgBuyComponent))
const RdPrHeroComponent = dynamic(() => import('@/blocks/redesign/PrHero/Component').then((m) => m.RdPrHeroComponent))
const RdPrJourneyComponent = dynamic(() => import('@/blocks/redesign/PrJourney/Component').then((m) => m.RdPrJourneyComponent))
const RdPrKitComponent = dynamic(() => import('@/blocks/redesign/PrKit/Component').then((m) => m.RdPrKitComponent))
const RdPrBloodKitComponent = dynamic(() => import('@/blocks/redesign/PrBloodKit/Component').then((m) => m.RdPrBloodKitComponent))
const RdPrAnalyseComponent = dynamic(() => import('@/blocks/redesign/PrAnalyse/Component').then((m) => m.RdPrAnalyseComponent))
const RdPrFormulaComponent = dynamic(() => import('@/blocks/redesign/PrFormula/Component').then((m) => m.RdPrFormulaComponent))
const RdPrArrivesComponent = dynamic(() => import('@/blocks/redesign/PrArrives/Component').then((m) => m.RdPrArrivesComponent))
const RdPrAdvancedComponent = dynamic(() => import('@/blocks/redesign/PrAdvanced/Component').then((m) => m.RdPrAdvancedComponent))
const RdLbHeroComponent = dynamic(() => import('@/blocks/redesign/LbHero/Component').then((m) => m.RdLbHeroComponent))
const RdLbNotComponent = dynamic(() => import('@/blocks/redesign/LbNot/Component').then((m) => m.RdLbNotComponent))
const RdLbReadsComponent = dynamic(() => import('@/blocks/redesign/LbReads/Component').then((m) => m.RdLbReadsComponent))
const RdLbMethodComponent = dynamic(() => import('@/blocks/redesign/LbMethod/Component').then((m) => m.RdLbMethodComponent))
const RdLbLabComponent = dynamic(() => import('@/blocks/redesign/LbLab/Component').then((m) => m.RdLbLabComponent))
const RdLbReadingComponent = dynamic(() => import('@/blocks/redesign/LbReading/Component').then((m) => m.RdLbReadingComponent))
const RdLbFormulaComponent = dynamic(() => import('@/blocks/redesign/LbFormula/Component').then((m) => m.RdLbFormulaComponent))
const RdLbAdvancedComponent = dynamic(() => import('@/blocks/redesign/LbAdvanced/Component').then((m) => m.RdLbAdvancedComponent))
const RdLbBoardComponent = dynamic(() => import('@/blocks/redesign/LbBoard/Component').then((m) => m.RdLbBoardComponent))
const FormBlock = dynamic(() => import('@/blocks/Form/Component').then((m) => m.FormBlock))
const MediaBlock = dynamic(() => import('@/blocks/MediaBlock/Component').then((m) => m.MediaBlock))
const FormCustomBlock = dynamic(() => import('@/blocks/FormCostom/Component').then((m) => m.FormCustomBlock))
const BoxCardBlock = dynamic(() => import('@/blocks/landingBlocks/BoxCard/Component').then((m) => m.BoxCardBlock))
const FormulaCardBlock = dynamic(() => import('./landingBlocks/FormulaCard/Component').then((m) => m.FormulaCardBlock))
const ResultsCardBlock = dynamic(() => import('./landingBlocks/ResultsCard/Component').then((m) => m.ResultsCardBlock))
const ReviewCardBlock = dynamic(() => import('./landingBlocks/ReviewCard/Component').then((m) => m.ReviewCardBlock))
const StepsCardBlock = dynamic(() => import('./landingBlocks/StepsCard/Component').then((m) => m.StepsCardBlock))
const SymptomsCardBlock = dynamic(() => import('./landingBlocks/SymptomsCard/Component').then((m) => m.SymptomsCardBlock))
const VideoCardBlock = dynamic(() => import('./landingBlocks/VideoCard/Component').then((m) => m.VideoCardBlock))
const KeyTakeawaysBlock = dynamic(() => import('@/blocks/KeyTakeways/Component').then((m) => m.KeyTakeawaysBlock))
const FAQBlockComponent = dynamic(() => import('./FAQ/Component').then((m) => m.FAQBlockComponent))
const DataTableBlockComponent = dynamic(() => import('@/blocks/DataTable/Component').then((m) => m.DataTableBlockComponent))
const CtaBlockComponent = dynamic(() => import('@/blocks/CTA/Component').then((m) => m.CtaBlockComponent))
const BulletListBlockComponent = dynamic(() => import('@/blocks/BulletList/Component').then((m) => m.BulletListBlockComponent))
const ContactFormBlock = dynamic(() => import('@/blocks/contactBlocks/ContactForm/Component').then((m) => m.ContactFormBlock))
const ContactInfoBlock = dynamic(() => import('@/blocks/contactBlocks/ContactInfo/Component').then((m) => m.ContactInfoBlock))
const ContactSectionBlock = dynamic(() => import('@/blocks/contactBlocks/ContactSection/Component').then((m) => m.ContactSectionBlock))
const BenefitsBannerComponent = dynamic(() => import('./newLandingBlocks/BenefitsBanner/Component').then((m) => m.BenefitsBannerComponent))
const StepsBannerComponent = dynamic(() => import('./newLandingBlocks/StepsBanner/Component').then((m) => m.StepsBannerComponent))
const ProductBannerComponent = dynamic(() => import('./newLandingBlocks/ProductBanner/Component').then((m) => m.ProductBannerComponent))
const AccessBannerComponent = dynamic(() => import('./newLandingBlocks/AccessBanner/Component').then((m) => m.AccessBannerComponent))
const EarlyAccessBlockComponent = dynamic(() => import('./EarlyAccessBlock/Component').then((m) => m.EarlyAccessBlockComponent))
const EvolutionBandBlockComponent = dynamic(() => import('./EvolutionBandBlock/Component').then((m) => m.EvolutionBandBlockComponent))
const HeroBannerComponent = dynamic(() => import('./newLandingBlocks/HeroBanner/Component').then((m) => m.HeroBannerComponent))
const OutcomesSectionComponent = dynamic(() => import('./newLandingBlocks/OutcomesSection/Component').then((m) => m.OutcomesSectionComponent))
const ProcessDiagramComponent = dynamic(() => import('./newLandingBlocks/ProcessDiagram/Component').then((m) => m.ProcessDiagramComponent))
const StatBreakComponent = dynamic(() => import('./newLandingBlocks/StatBreak/Component').then((m) => m.StatBreakComponent))
const ReserveCtaComponent = dynamic(() => import('./newLandingBlocks/ReserveCta/Component').then((m) => m.ReserveCtaComponent))
const AthleteBannerComponent = dynamic(() => import('./newLandingBlocks/AthleteBanner/Component').then((m) => m.AthleteBannerComponent))
const PriceBreakBlockComponent = dynamic(() => import('./PriceBreakBlock/Component').then((m) => m.PriceBreakBlockComponent))
const ScienceBoardBlockComponent = dynamic(() => import('./ScienceBoardBlock/Component').then((m) => m.ScienceBoardBlockComponent))
const FloatingCTABlockComponent = dynamic(() => import('./FloatingCTA/Component').then((m) => m.FloatingCTABlockComponent))
const YpHeroComponent = dynamic(() => import('./yourPlanBlocks/Hero/Component').then((m) => m.YpHeroComponent))
const YpPlansComponent = dynamic(() => import('./yourPlanBlocks/Plans/Component').then((m) => m.YpPlansComponent))
const YpThreeComponentsComponent = dynamic(() => import('./yourPlanBlocks/ThreeComponents/Component').then((m) => m.YpThreeComponentsComponent))
const YpDashboardComponent = dynamic(() => import('./yourPlanBlocks/Dashboard/Component').then((m) => m.YpDashboardComponent))
const YpTimelineComponent = dynamic(() => import('./yourPlanBlocks/Timeline/Component').then((m) => m.YpTimelineComponent))
const YpScienceBoardComponent = dynamic(() => import('./yourPlanBlocks/ScienceBoard/Component').then((m) => m.YpScienceBoardComponent))
const YpAthletesComponent = dynamic(() => import('./yourPlanBlocks/Athletes/Component').then((m) => m.YpAthletesComponent))
const YpBreakupComponent = dynamic(() => import('./yourPlanBlocks/Breakup/Component').then((m) => m.YpBreakupComponent))
const YpFaqComponent = dynamic(() => import('./yourPlanBlocks/Faq/Component').then((m) => m.YpFaqComponent))
const YpStickyBuyComponent = dynamic(() => import('./yourPlanBlocks/StickyBuy/Component').then((m) => m.YpStickyBuyComponent))
const YpReassuranceComponent = dynamic(() => import('./yourPlanBlocks/Reassurance/Component').then((m) => m.YpReassuranceComponent))
const YpBuyBoxComponent = dynamic(() => import('./yourPlanBlocks/BuyBox/Component').then((m) => m.YpBuyBoxComponent))
const OrderStepHeroComponent = dynamic(() => import('./checkoutBlocks/OrderStepHero/Component').then((m) => m.OrderStepHeroComponent))
const OrderStepNavComponent = dynamic(() => import('./checkoutBlocks/OrderStepNav/Component').then((m) => m.OrderStepNavComponent))
const LegalStripComponent = dynamic(() => import('./checkoutBlocks/LegalStrip/Component').then((m) => m.LegalStripComponent))
const TrustSealsBarComponent = dynamic(() => import('./checkoutBlocks/TrustSealsBar/Component').then((m) => m.TrustSealsBarComponent))
const OrderTimelineComponent = dynamic(() => import('./checkoutBlocks/OrderTimeline/Component').then((m) => m.OrderTimelineComponent))
const FormulaKitComponent = dynamic(() => import('./checkoutBlocks/FormulaKit/Component').then((m) => m.FormulaKitComponent))
const CheckoutFaqComponent = dynamic(() => import('./checkoutBlocks/CheckoutFaq/Component').then((m) => m.CheckoutFaqComponent))
const EndCardComponent = dynamic(() => import('./checkoutBlocks/EndCard/Component').then((m) => m.EndCardComponent))
const PlanSummaryCardComponent = dynamic(() => import('./checkoutBlocks/PlanSummaryCard/Component').then((m) => m.PlanSummaryCardComponent))
const GuaranteeBadgesComponent = dynamic(() => import('./checkoutBlocks/GuaranteeBadges/Component').then((m) => m.GuaranteeBadgesComponent))
const CyclesPricingGridComponent = dynamic(() => import('./checkoutBlocks/CyclesPricingGrid/Component').then((m) => m.CyclesPricingGridComponent))
const ReinforceCtaComponent = dynamic(() => import('./checkoutBlocks/ReinforceCta/Component').then((m) => m.ReinforceCtaComponent))
const PlanPivotComponent = dynamic(() => import('./checkoutBlocks/PlanPivot/Component').then((m) => m.PlanPivotComponent))
const StickyCtaBarComponent = dynamic(() => import('./checkoutBlocks/StickyCtaBar/Component').then((m) => m.StickyCtaBarComponent))
const PlanSelectorComponent = dynamic(() => import('./checkoutBlocks/PlanSelector/Component').then((m) => m.PlanSelectorComponent))
const PlanStickyBarComponent = dynamic(() => import('./checkoutBlocks/PlanStickyBar/Component').then((m) => m.PlanStickyBarComponent))
const CycleSelectorComponent = dynamic(() => import('./checkoutBlocks/CycleSelector/Component.client').then((m) => m.CycleSelectorClient))
import { usePriceTokens } from '@/lib/plans/PriceTokensProvider'
const CheckoutFormComponent = dynamic(() => import('./checkoutBlocks/CheckoutForm/Component').then((m) => m.CheckoutFormComponent))
const HomepageHeroComponent = dynamic(() => import('./HomepageHero/Component').then((m) => m.HomepageHeroComponent))
const TheCaseComponent = dynamic(() => import('./TheCase/Component').then((m) => m.TheCaseComponent))
const TwoModelsComponent = dynamic(() => import('./TwoModels/Component').then((m) => m.TwoModelsComponent))
const BiologyHeroComponent = dynamic(() => import('./BiologyHero/Component').then((m) => m.BiologyHeroComponent))
const BiologyTwoPeopleComponent = dynamic(() => import('./BiologyTwoPeople/Component').then((m) => m.BiologyTwoPeopleComponent))
const BiologyClearestReadComponent = dynamic(() => import('./BiologyClearestRead/Component').then((m) => m.BiologyClearestReadComponent))
const BiologyReadingToFormulaComponent = dynamic(() => import('./BiologyReadingToFormula/Component').then((m) => m.BiologyReadingToFormulaComponent))
const BiologyIndustryFlipComponent = dynamic(() => import('./BiologyIndustryFlip/Component').then((m) => m.BiologyIndustryFlipComponent))
const ProtocolHeroComponent = dynamic(() => import('./ProtocolHero/Component').then((m) => m.ProtocolHeroComponent))
const ProtocolJourneyComponent = dynamic(() => import('./ProtocolJourney/Component').then((m) => m.ProtocolJourneyComponent))
const ProtocolKitComponent = dynamic(() => import('./ProtocolKit/Component').then((m) => m.ProtocolKitComponent))
const ProtocolFormulaUnitsComponent = dynamic(() => import('./ProtocolFormulaUnits/Component').then((m) => m.ProtocolFormulaUnitsComponent))
const ProtocolLibraryComponent = dynamic(() => import('./ProtocolLibrary/Component').then((m) => m.ProtocolLibraryComponent))
const ProtocolCredStripComponent = dynamic(() => import('./ProtocolCredStrip/Component').then((m) => m.ProtocolCredStripComponent))
const ProtocolWhatArrivesComponent = dynamic(() => import('./ProtocolWhatArrives/Component').then((m) => m.ProtocolWhatArrivesComponent))
const ProtocolLivingLifelineComponent = dynamic(() => import('./ProtocolLivingLifeline/Component').then((m) => m.ProtocolLivingLifelineComponent))
const GutFirstComponent = dynamic(() => import('./GutFirst/Component').then((m) => m.GutFirstComponent))
const HowItWorksComponent = dynamic(() => import('./HowItWorks/Component').then((m) => m.HowItWorksComponent))
const LabHeroComponent = dynamic(() => import('./LabHero/Component').then((m) => m.LabHeroComponent))
const LabRoadmapComponent = dynamic(() => import('./LabRoadmap/Component').then((m) => m.LabRoadmapComponent))
const LabReadsComponent = dynamic(() => import('./LabReads/Component').then((m) => m.LabReadsComponent))
const LabComparisonComponent = dynamic(() => import('./LabComparison/Component').then((m) => m.LabComparisonComponent))
const LabBandComponent = dynamic(() => import('./LabBand/Component').then((m) => m.LabBandComponent))
const LabReadingPanelComponent = dynamic(() => import('./LabReadingPanel/Component').then((m) => m.LabReadingPanelComponent))
const LabFormulaComponent = dynamic(() => import('./LabFormula/Component').then((m) => m.LabFormulaComponent))
const LabProtocolComponent = dynamic(() => import('./LabProtocol/Component').then((m) => m.LabProtocolComponent))
const LabJourneyComponent = dynamic(() => import('./LabJourney/Component').then((m) => m.LabJourneyComponent))
const LabScienceBoardComponent = dynamic(() => import('./LabScienceBoard/Component').then((m) => m.LabScienceBoardComponent))
const WhatArrivesComponent = dynamic(() => import('./WhatArrives/Component').then((m) => m.WhatArrivesComponent))
const OutcomesComponent = dynamic(() => import('./Outcomes/Component').then((m) => m.OutcomesComponent))
const AthletesComponent = dynamic(() => import('./Athletes/Component').then((m) => m.AthletesComponent))
const ScienceBoardNewComponent = dynamic(() => import('./ScienceBoardNew/Component').then((m) => m.ScienceBoardNewComponent))
const StandardsComponent = dynamic(() => import('./Standards/Component').then((m) => m.StandardsComponent))
const PlansComponent = dynamic(() => import('./Plans/Component').then((m) => m.PlansComponent))
const CloseBandComponent = dynamic(() => import('./CloseBand/Component').then((m) => m.CloseBandComponent))
const FaqPageComponent = dynamic(() => import('./FaqPage/Component').then((m) => m.FaqPageComponent))
const LegalDocComponent = dynamic(() => import('./LegalDoc/Component').then((m) => m.LegalDocComponent))
const ContactPageComponent = dynamic(() => import('./ContactPage/Component').then((m) => m.ContactPageComponent))
const ReferralWidgetComponent = dynamic(() => import('./ReferralWidget/Component').then((m) => m.ReferralWidgetComponent))
const ReferInfoComponent = dynamic(() => import('./ReferInfo/Component').then((m) => m.ReferInfoComponent))
const ReferFaqComponent = dynamic(() => import('./ReferFaq/Component').then((m) => m.ReferFaqComponent))
const CustomerReviewsComponent = dynamic(() => import('./CustomerReviews/Component').then((m) => m.CustomerReviewsComponent))
const HelpNavComponent = dynamic(() => import('./helpBlocks/HelpNav/Component').then((m) => m.HelpNavComponent))
const HelpHeroComponent = dynamic(() => import('./helpBlocks/HelpHero/Component').then((m) => m.HelpHeroComponent))
const HelpStepsComponent = dynamic(() => import('./helpBlocks/HelpSteps/Component').then((m) => m.HelpStepsComponent))
const HelpFaqComponent = dynamic(() => import('./helpBlocks/HelpFaq/Component').then((m) => m.HelpFaqComponent))
const HelpCalloutComponent = dynamic(() => import('./helpBlocks/HelpCallout/Component').then((m) => m.HelpCalloutComponent))
const HelpCtaComponent = dynamic(() => import('./helpBlocks/HelpCta/Component').then((m) => m.HelpCtaComponent))
// EVERY BLOCK USED TO SHIP ON EVERY PAGE.
//
// This map is the whole block library, and this is a client component, so a
// static `import` of each entry put all of them in one chunk that every page
// loaded. Measured on staging before this change: /en/terms-conditions — a page
// whose layout is a single legal block — pulled 2,257 KB of JavaScript across 18
// files, of which 1,415 KB was one chunk containing `rdLbMethod`, `rd-lbboard`,
// `rdPgAthletes`, `rdPrBloodKit` and `cycleSelector`. None of those are on that
// page. Nothing could be tree-shaken: the map is `Record<string, React.FC<any>>`,
// so every value is reachable.
//
// `next/dynamic` gives each block its own chunk, fetched only when a page
// actually renders it. `ssr` is left at its default — these components are
// server-rendered for the initial HTML and must stay that way, so passing
// `ssr: false` here would be a visible regression, not an optimisation.
//
// The few imports below that are still static are the ones used somewhere other
// than this map; making them lazy would change how that other code loads.
// `React.ComponentType`, not `React.FC`: `dynamic()` returns ComponentType,
// which is FC | ComponentClass and so not assignable to FC. The usage site
// below only ever calls it as a JSX element, which ComponentType satisfies.
const blockComponents: Record<string, React.ComponentType<any>> = {
  rdHero: RdHeroComponent,
  rdProtocol: RdProtocolComponent,
  rdFormula: RdFormulaComponent,
  rdProof: RdProofComponent,
  rdBiology: RdBiologyComponent,
  rdLab: RdLabComponent,
  rdReviews: RdReviewsComponent,
  rdPlans: RdPlansComponent,
  rdClose: RdCloseComponent,
  rdPgHero: RdPgHeroComponent,
  rdPgPlans: RdPgPlansComponent,
  rdPgAdvanced: RdPgAdvancedComponent,
  rdPgWords: RdPgWordsComponent,
  rdPgData: RdPgDataComponent,
  rdPgBoardStrip: RdPgBoardStripComponent,
  rdPgTimeline: RdPgTimelineComponent,
  rdPgBoard: RdPgBoardComponent,
  rdPgAthletes: RdPgAthletesComponent,
  rdPgQuiet: RdPgQuietComponent,
  rdPgGuarantee: RdPgGuaranteeComponent,
  rdPgFaq: RdPgFaqComponent,
  rdPgBuy: RdPgBuyComponent,
  rdPrHero: RdPrHeroComponent,
  rdPrJourney: RdPrJourneyComponent,
  rdPrKit: RdPrKitComponent,
  rdPrBloodKit: RdPrBloodKitComponent,
  rdPrAnalyse: RdPrAnalyseComponent,
  rdPrFormula: RdPrFormulaComponent,
  rdPrArrives: RdPrArrivesComponent,
  rdPrAdvanced: RdPrAdvancedComponent,
  rdLbHero: RdLbHeroComponent,
  rdLbNot: RdLbNotComponent,
  rdLbReads: RdLbReadsComponent,
  rdLbMethod: RdLbMethodComponent,
  rdLbLab: RdLbLabComponent,
  rdLbReading: RdLbReadingComponent,
  rdLbFormula: RdLbFormulaComponent,
  rdLbAdvanced: RdLbAdvancedComponent,
  rdLbBoard: RdLbBoardComponent,
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
  helpNav: HelpNavComponent,
  helpHero: HelpHeroComponent,
  helpSteps: HelpStepsComponent,
  helpCallout: HelpCalloutComponent,
  helpFaq: HelpFaqComponent,
  helpCta: HelpCtaComponent,
}

export const RenderBlocksClient: React.FC<{
  blocks: Page['layout'][0][]
  locale: AppLocale
  checkoutBasePath?: string
  pageSlugs?: Partial<Record<AppLocale, string>> | null
}> = ({ blocks: rawBlocks, locale, pageSlugs, checkoutBasePath }) => {
  const blocks = usePriceTokens(rawBlocks)
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
                <Block
                  {...block}
                  checkoutBasePath={checkoutBasePath}
                  locale={locale}
                  pageSlugs={pageSlugs}
                  disableInnerContainer
                />
              </div>
            )
          }
        }

        return null
      })}
    </Fragment>
  )
}
