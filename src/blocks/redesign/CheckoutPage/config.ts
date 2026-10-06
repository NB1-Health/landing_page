import type { Block } from 'payload'

/**
 * The checkout page — step 3 of the funnel, and the last.
 *
 * ONE BLOCK, TWO SCREENS. `04 Confirmed` is a state flip inside this block, not a
 * page of its own, exactly as it is in the checkout that ships today: the order
 * number only exists in memory at the moment the subscription is created, and a
 * redirect would lose it. The step header above both is the funnel's shared one —
 * `current` 2 while the form is open, 3 once the order is placed, where every step
 * is ticked and the back button takes `steps.backLabelDone` instead.
 *
 * EIGHT CAPTURES. This screen has more shapes than any block before it. The order
 * summary opens and shuts; the accordion has three sections whose HEADS have two
 * shapes (a number and a title, or a tick, a summary and Edit) and whose BODIES
 * have three (email, address, payment); and each payment method shows a note that
 * the card row replaces with a field grid. No capture holds more than one of each,
 * so every shape is its own extract with its own component, and a dispatcher that
 * carries no styles chooses between them — the arrangement the duration block's
 * two price shapes and the legal block's four clause bodies already use.
 *
 * THE MECHANISM IS THE ONE THAT SHIPS. Every validator, every API call, the
 * address autocomplete, the phone dial-code handling, the sessionStorage that
 * survives a redirect and all of the Klaviyo, dataLayer and Meta CAPI tracking are
 * moved across unchanged from `blocks/checkoutBlocks/CheckoutForm`. The sequence
 * is untouched: `checkoutPreview`, then `checkoutPaymentIntent`, then Stripe's own
 * confirm, then `checkoutConfirm`, which is the call that creates the
 * subscription. `CheckoutConfirmIn` carries no plan field, so the plan is fixed
 * before the card is saved — which is why the funnel chooses the duration on the
 * page before this one.
 *
 * THE SHIPPING STEP IS GONE. The form that ships has four sections and this screen
 * has three. Measured before removing it: the shipping section offers exactly one
 * option, Standard, permanently selected, with no express option rendered
 * anywhere — so it is a click that cannot change anything, and `standard` is what
 * reached the backend every time. The one thing it did do, firing `add_shipping_info`
 * to the dataLayer and Meta CAPI, now fires when the address section completes, at
 * the same point in the funnel and with the same payload.
 *
 * TWO REGIONS ARE STRIPE'S OWN. The express wallet row is `ExpressCheckoutElement`
 * and the three card fields are `CardNumberElement`, `CardExpiryElement` and
 * `CardCvcElement` — iframes Stripe controls, where only the element's own
 * `options.style` can be set. The split elements were chosen over the combined
 * `CardElement` so the mockup's three fields stay three; the confirm call and the
 * setup intent are unchanged either way. Those two regions cannot be diffed node
 * for node and are declared as such. Everything around them is measured.
 *
 * PRICES ARE NOT FIELDS. The plan, the cycle and the amount come from the pages
 * before this one and from the same plans client the order and duration pages use,
 * so the three screens cannot disagree. Only the words around them are stored.
 *
 * TWO VALUES ARE SPLIT RATHER THAN STORED WHOLE. The mockup writes
 * `You're in, Jane.` and `Order NB1-482915` as single literals because it has one
 * hard-coded customer. Here the name and the order number are live, so the
 * sentence around each is the field and the live part goes between.
 */
export const RdChkBlock: Block = {
  slug: "rdChk",
  interfaceName: "RdChkBlock",
  labels: { singular: "RdChk", plural: "RdChk" },
  fields: [
    { name: "anchorId", type: "text", defaultValue: "checkout" },
    {
      name: "steps", type: 'group',
      fields: [
        { name: "logo", type: "upload", relationTo: "media" },
        { name: "logoAlt", type: "text", localized: true },
        { name: "homeSlug", type: "text", localized: true, defaultValue: "" },
        {
          name: "items", type: 'array',
          defaultValue: [
            {
              "label": "Plan"
            },
            {
              "label": "Duration"
            },
            {
              "label": "Checkout"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        { name: "backSlugCore", type: "text", localized: true, admin: { description: "Where Back goes from Checkout when Core is the chosen plan — the Core duration page. A slug; the locale is added when the page renders. Leave empty to fall back to the browser's own history." }, defaultValue: "duration-core" },
        { name: "backSlugAdvanced", type: "text", localized: true, admin: { description: "The same for Advanced. The two are separate fields because the funnel splits here: Checkout is one page but the step before it is two." }, defaultValue: "duration-advanced" },
        { name: "backLabel", type: "text", localized: true, defaultValue: "← Back" },
        { name: "backLabelDone", type: "text", localized: true, defaultValue: "Need help?" },
      ],
    },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Almost there." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Your email, your address, your payment details. Nothing is charged today." },
      ],
    },
    {
      name: "sum", type: 'group',
      fields: [
        { name: "toggleLabel", type: "text", localized: true, defaultValue: "Your order" },
        { name: "planLabel", type: "text", localized: true, defaultValue: "Plan" },
        { name: "billingLabel", type: "text", localized: true, defaultValue: "Billing" },
        { name: "billingFlex", type: "text", localized: true, defaultValue: "Monthly · no minimum term" },
        { name: "billingSuffix", type: "text", localized: true, defaultValue: " · billed monthly" },
        { name: "analysisLabel", type: "text", localized: true, defaultValue: "Gut analysis and report" },
        { name: "analysisValue", type: "text", localized: true, defaultValue: "£463 → £0" },
        { name: "shipLabel", type: "text", localized: true, defaultValue: "Shipping" },
        { name: "shipValue", type: "text", localized: true, defaultValue: "Standard · Free" },
        { name: "perLabel", type: "text", localized: true, defaultValue: "/mo" },
        { name: "discountLabel", type: "text", localized: true, defaultValue: "Add discount code" },
        { name: "referralLabel", type: "text", localized: true, defaultValue: "Been referred by a friend?" },
        { name: "noteHeading", type: "text", localized: true, defaultValue: "Nothing to pay today" },
        { name: "note", type: "textarea", localized: true, defaultValue: "Your first charge is around two weeks after you return your sample, only once your formula goes into production." },
        { name: "secureLabel", type: "text", localized: true, defaultValue: "🔒 Secured by Stripe" },
      ],
    },
    {
      name: "acc", type: 'group',
      fields: [
        {
          name: "items", type: 'array',
          defaultValue: [
            {
              "title": "Your email"
            },
            {
              "title": "Where to send your kit"
            },
            {
              "title": "Payment"
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true },
          ],
        },
        { name: "nextLabel", type: "text", localized: true, defaultValue: "Next" },
        { name: "editLabel", type: "text", localized: true, defaultValue: "Edit" },
      ],
    },
    {
      name: "eml", type: 'group',
      fields: [
        { name: "label", type: "text", localized: true, defaultValue: "Email" },
        { name: "help", type: "textarea", localized: true, defaultValue: "We'll create your account and send kit tracking and results here. You'll set a password when your kit arrives." },
        { name: "placeholder", type: "text", localized: true, defaultValue: "you@email.com" },
      ],
    },
    {
      name: "adr", type: 'group',
      fields: [
        {
          name: "fields", type: 'array',
          defaultValue: [
            {
              "label": "First name"
            },
            {
              "label": "Last name"
            },
            {
              "label": "Country"
            },
            {
              "label": "Address",
              "placeholder": "Street and house number"
            },
            {
              "label": "Flat, suite, etc. (optional)"
            },
            {
              "label": "Postcode"
            },
            {
              "label": "City"
            },
            {
              "label": "Phone (for delivery updates)",
              "placeholder": "+44 …"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "placeholder", type: "text", localized: true },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "Standard delivery is free and tracked. The kit fits through the letterbox, so there is nothing to sign for." },
      ],
    },
    {
      name: "pay", type: 'group',
      fields: [
        { name: "orLabel", type: "text", localized: true, defaultValue: "or pay another way" },
        { name: "cardLabel", type: "text", localized: true },
        { name: "cardMeta", type: "text", localized: true },
        {
          name: "cardFields", type: 'array',
          defaultValue: [
            {
              "label": "Card number",
              "placeholder": "1234 1234 1234 1234"
            },
            {
              "label": "Expiry",
              "placeholder": "MM / YY"
            },
            {
              "label": "CVC",
              "placeholder": "123"
            },
            {
              "label": "Name on card"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "placeholder", type: "text", localized: true },
          ],
        },
        {
          name: "methods", type: 'array',
          defaultValue: [
            {
              "label": "Credit or debit card",
              "meta": "VISA · MC · AMEX",
              "key": "card",
              "note": ""
            },
            {
              "label": "Klarna",
              "meta": "KLARNA",
              "key": "klarna",
              "note": "After confirming your order you will be redirected to Klarna to complete your purchase securely."
            },
            {
              "label": "PayPal",
              "meta": "PAYPAL",
              "key": "paypal",
              "note": "After confirming your order you will be redirected to PayPal to complete your purchase securely."
            },
            {
              "label": "Direct Debit",
              "meta": "BACS",
              "key": "dd",
              "note": "You will be asked for your bank details and will authorise a mandate. No charge is taken until your formula enters production."
            }
          ],
          fields: [
            { name: "key", type: "select", required: true, options: ["card", "klarna", "paypal", "dd"] },
            { name: "label", type: "text", localized: true, required: true },
            { name: "meta", type: "text", localized: true },
            { name: "note", type: "textarea", localized: true },
          ],
        },
        { name: "billingSame", type: "text", localized: true, defaultValue: "Billing address same as delivery" },
        { name: "cta", type: "text", localized: true, defaultValue: "Place order · pay at production" },
        { name: "terms", type: "textarea", localized: true, defaultValue: "By placing your order you agree to nb1's Terms of Service and Privacy Policy and confirm you're 18 or over. You consent to nb1 analysing your sample and health data to build your formula. Nothing is charged today; your first payment is taken once your formula goes into production, then monthly until you cancel. A one-time £49 fee applies only if your sample isn't returned within 4 weeks." },
      ],
    },
    {
      name: "next", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "What happens next" },
        {
          name: "rows", type: 'array',
          defaultValue: [
            {
              "text": "Your kit ships. A two-minute gut sample, sealed in its bag and posted back in the box it came in."
            },
            {
              "text": "We sequence it and the science team approves your formula."
            },
            {
              "text": "First charge, then your one-of-one formula ships."
            }
          ],
          fields: [
            { name: "text", type: "textarea", localized: true, required: true },
          ],
        },
      ],
    },
    {
      name: "done", type: 'group',
      fields: [
        { name: "orderPrefix", type: "text", localized: true, defaultValue: "Order" },
        { name: "headPrefix", type: "text", localized: true, required: true, defaultValue: "You're in," },
        { name: "headSuffix", type: "text", localized: true, defaultValue: "." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Your kit's on its way. We won't charge you anything yet: your first payment only happens once your formula's being made." },
        { name: "acctHeading", type: "text", localized: true, defaultValue: "First, create your account" },
        { name: "acctBody", type: "textarea", localized: true, defaultValue: "Set your password to register your kit, follow its tracking, and see your results the moment they land." },
        { name: "acctCta", type: "text", localized: true, defaultValue: "Create your account" },
        { name: "acctSlug", type: "text", localized: true, admin: { description: "Where \"Create your account\" goes. The account app is a separate application mounted at /login and is NOT under a locale, so this is stored as an absolute /path and passed through as typed. A bare slug (no leading /) is treated as a page on this site and gets the locale prefix." }, defaultValue: "/login" },
        { name: "survHeading", type: "text", localized: true, defaultValue: "How did you find nb1?" },
        { name: "survIntro", type: "textarea", localized: true, defaultValue: "One tap. It helps us reach more people like you." },
        { name: "survOther", type: "text", localized: true, defaultValue: "Something else" },
        { name: "timeHeading", type: "text", localized: true, defaultValue: "What happens next" },
        {
          name: "timeRows", type: 'array',
          defaultValue: [
            {
              "when": "Today",
              "body": "Check your inbox. We've emailed your receipt and a link to set your password and follow your kit's tracking.",
              "title": "Order confirmed"
            },
            {
              "when": "~3 days",
              "body": "A two-minute gut sample, sealed in its bag and posted back in the box it came in, plus a short health questionnaire online.",
              "title": "Your kit arrives"
            },
            {
              "when": "Weeks 1–2",
              "body": "Read at species level, then our science team drafts your formula from your data.",
              "title": "We read your sample"
            },
            {
              "when": "Week 3",
              "title": "Formula approved",
              "badge": "First charge",
              "body": "Your formula is signed off and your first payment is taken, only now, once it goes into production. Never before."
            },
            {
              "when": "Week 4",
              "body": "Activate, Restore and Nourish, blister-packed for 30 days, travel-ready. Your first cycle begins.",
              "title": "Your formula ships"
            }
          ],
          fields: [
            { name: "when", type: "text", localized: true, required: true },
            { name: "title", type: "text", localized: true },
            { name: "badge", type: "text", localized: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        { name: "sumHeading", type: "text", localized: true, defaultValue: "Order summary" },
        { name: "sumPlanLabel", type: "text", localized: true, defaultValue: "Plan" },
        { name: "sumCycleLabel", type: "text", localized: true, defaultValue: "Cycle" },
        { name: "sumDelivLabel", type: "text", localized: true, defaultValue: "Delivery" },
        { name: "sumDelivValue", type: "text", localized: true, defaultValue: "Tracked · free" },
        { name: "sumPerLabel", type: "text", localized: true, defaultValue: "/mo" },
        { name: "chargedToday", type: "text", localized: true, defaultValue: "£0 charged today" },
        { name: "chargePrefix", type: "text", localized: true, defaultValue: "First charge " },
        { name: "chargeBold", type: "text", localized: true, defaultValue: "when your formula goes into production" },
        { name: "chargeSuffix", type: "text", localized: true, defaultValue: "." },
        { name: "helpChat", type: "text", localized: true, defaultValue: "Chat with us" },
        { name: "helpChatUrl", type: "text", localized: true, defaultValue: "#" },
        { name: "helpOr", type: "text", localized: true, defaultValue: " or " },
        { name: "helpEmail", type: "text", localized: true, defaultValue: "support@nb1.com" },
        { name: "helpEmailUrl", type: "text", localized: true, defaultValue: "mailto:support@nb1.com" },
      ],
    },
  ],
}
