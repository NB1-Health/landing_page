/**
 * The Refer a Friend redesign switch.
 *
 * ONE LINE decides whether /referral wears the new nb1 visual system or the one
 * it shipped with. Nothing else in the codebase knows about it.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  CURRENTLY OFF. To put the new design back: change `false` to `true`.   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * HOW THIS DIFFERS FROM THE JOURNAL AND HELP SWITCHES, which it is modelled on.
 * Those two are stylesheets layered over markup that did not change: flag off
 * means a marker element is not rendered, the scoped CSS matches nothing, and
 * the original design is simply still there.
 *
 * The referral page could not work that way. Its restyle rewrote the three
 * blocks themselves — the eligibility card lost a shield icon and gained a
 * heading column, the step markers became layered radial gradients, the image
 * became a cropped background panel. No stylesheet can turn one into the other.
 *
 * So each block keeps BOTH implementations, in two files:
 *
 *   Component.tsx          the redesign, and the two-line chooser
 *   Component.legacy.tsx   the shipped design, byte-for-byte as it was
 *
 * The legacy file is not a copy to maintain alongside the new one. It is a
 * frozen record of what was there, kept so that flipping this constant is a
 * real revert rather than an approximation. Edit the redesign; leave the legacy
 * alone, and delete it along with this switch when the new design is settled.
 *
 * WHAT THIS COVERS: the three blocks on /referral — `referralWidget`,
 * `referInfo`, `referFaq` — and nothing else, because nothing else uses them.
 * A CMS query confirmed all three appear on page 164 and no other page.
 *
 * It does NOT cover the page's header and footer. Those are a CMS choice
 * (`rdHeader` / `rdFooter` on the page), which is where a chrome decision
 * belongs; turning this off leaves the page on whatever chrome it is set to.
 *
 * WHY A CONSTANT RATHER THAN AN ENVIRONMENT VARIABLE. An env var would let the
 * design differ between environments without anything in the repository saying
 * so — staging and production disagreeing, and the code unable to tell you
 * which is which. A constant is in the diff, in the review, and in the history:
 * whoever flips it leaves a commit that says when and why. For a one-way change
 * ahead of a launch that is the property worth having, and it costs a deploy,
 * which this change needs anyway.
 *
 * The type annotation is not noise. Without `: boolean` TypeScript narrows this
 * to the literal `true`, and every `if (!referralRedesignEnabled())` becomes
 * provably dead code — which some lint configurations remove and others flag.
 * Annotated, the branch stays real and flipping the value just works.
 */
export const REFERRAL_REDESIGN: boolean = false

export function referralRedesignEnabled(): boolean {
  return REFERRAL_REDESIGN
}
