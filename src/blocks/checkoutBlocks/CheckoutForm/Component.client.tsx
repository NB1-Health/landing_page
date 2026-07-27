'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js'
import PhoneInput, { isValidPhoneNumber, type Country } from 'react-phone-number-input'
import AddressAutocomplete, { type GooglePlace } from './AddressAutocomplete'
import 'react-phone-number-input/style.css'
import { createFirebaseAccount } from '@/lib/createAccount'
import { checkoutPaymentIntent, checkoutConfirm, checkoutConfirmProxy, trackLanguagePublic } from '@/lib/checkoutApi'
import { pushEvent, pushEventWithUser, mintEventId, buildNb1Item } from '@/lib/dataLayer'
import { sendMetaCapiEvent, getMetaSidecar } from '@/lib/meta/browser'
import { getClientCurrency, type CurrencyCode } from '@/lib/plans/clientUtils'
import { suggestEmailDomain } from '@/lib/emailDomainCheck'
import { getDictionary } from '@/i18n/getDictionary'
import { ConfirmationScreen } from './ConfirmationScreen'
import { PaymentFailedScreen } from './PaymentFailedScreen'
import {
  getStoredPlanSelection,
  storePlanSelection,
  type PlanSelection,
} from '@/lib/plans/selectionStore'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

/* ─── Data ──────────────────────────────────────────────────────────── */

// Numeric EUR fallback rates, used only if the live /subscriptions/plans fetch
// fails. Live prices (in the visitor's selected currency) replace these on load.
// 'monthly' (flexible, month=1) is included here as a fallback too.
const STATIC_RATES_EUR: Record<string, Record<string, number>> = {
  core: { '4': 99, '8': 94, '12': 89, monthly: 109 },
  advanced: { '4': 149, '8': 141, '12': 134 },
}

const COUNTRIES = [
  'Germany',
  'Austria',
  'Netherlands',
  'Belgium',
  'France',
  'Luxembourg',
  'Ireland',
  'United Kingdom',
  'United Arab Emirates',
  'Switzerland',
  'Romania',
]

const COUNTRY_CODES: Record<string, string> = {
  Germany: 'DE',
  Austria: 'AT',
  Netherlands: 'NL',
  Belgium: 'BE',
  France: 'FR',
  Luxembourg: 'LU',
  Ireland: 'IE',
  'United Kingdom': 'GB',
  'United Arab Emirates': 'AE',
  Switzerland: 'CH',
  Romania: 'RO',
}

/* ─── Types ─────────────────────────────────────────────────────────── */

type PayMethod = 'card' | 'paypal' | 'klarna' | 'sepa'

type Props = { backHref?: string | null; locale?: string }

/**
 * confirmKlarnaSetup / confirmPayPalSetup exist in the Stripe.js runtime (loaded from
 * js.stripe.com, evergreen) but are not yet declared in the @stripe/stripe-js 9.8.0 type
 * defs. Narrow shim so we can call them; drop it once the npm types catch up.
 */
type StripeSetupConfirms = {
  confirmKlarnaSetup: (
    clientSecret: string,
    options: Record<string, unknown>,
  ) => Promise<{ error?: { message?: string } }>
  confirmPayPalSetup: (
    clientSecret: string,
    options: Record<string, unknown>,
  ) => Promise<{ error?: { message?: string } }>
}

/* ─── Inner component (needs useSearchParams inside Suspense) ────────── */

function CheckoutFormInner({ backHref, locale }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const dict = getDictionary(locale)
  const t = dict.checkout

  // Page locale → 2-letter UI language for Klaviyo (mirrors LocaleSwitcher.localeToLanguage).
  const uiLanguage = (() => {
    const l = (locale || 'en').toLowerCase()
    if (l === 'de' || l === 'ch') return 'de'
    if (l === 'fr') return 'fr'
    if (l === 'nl' || l === 'be') return 'nl'
    return 'en'
  })()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Plan/cycle selection: snapshotted once before the URL is cleaned below.
  // URL params win (fresh arrival from the cycle page); otherwise fall back to
  // the selection persisted in sessionStorage — the URL cleanup removes the
  // params, so without this a page refresh would silently reset the order to
  // core/4 while the form fields (also sessionStorage-backed) survive.
  const [{ planKey, cycleKey }] = useState(() => {
    const saved = getStoredPlanSelection()
    const fromUrl: PlanSelection = {
      plan: searchParams?.get('plan') ?? undefined,
      cycle: searchParams?.get('cycle') ?? undefined,
    }
    storePlanSelection({ ...saved, ...fromUrl })
    const applied = getStoredPlanSelection()
    return { planKey: applied.plan ?? 'core', cycleKey: applied.cycle ?? '4' }
  })

  // Strip plan/cycle from URL once read — keeps Stripe redirect params intact
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete('plan')
    params.delete('cycle')
    const query = params.toString()
    router.replace(pathname + (query ? `?${query}` : ''), { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Numeric live prices per (plan, cycle, currency): { core: { '4': { EUR: 99, GBP: 89 } } }
  const [planPrices, setPlanPrices] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({})
  const [planIds, setPlanIds] = useState<Record<string, Record<string, string>>>({})
  // Express shipping fee in the selected currency, fetched live from the backend
  // (authoritative — it's what actually gets charged). null until loaded / on failure.
  const [expressShip, setExpressShip] = useState<number | null>(null)

  // Visitor's selected currency (nb1_cur cookie); stays in sync with the
  // site-wide currency switcher so the summary + charge match what they picked.
  const [currency, setCurrency] = useState<CurrencyCode>('EUR')
  useEffect(() => {
    setCurrency(getClientCurrency(locale || 'en'))
    const onCur = (e: Event) => setCurrency((e as CustomEvent<CurrencyCode>).detail)
    window.addEventListener('nb1:currencychange', onCur)
    return () => window.removeEventListener('nb1:currencychange', onCur)
  }, [locale])

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'
    fetch(`${backend}/subscriptions/plans?preferred_first=false`)
      .then((r) => r.json())
      .then(
        (
          plans: Array<{
            id: string
            title: string
            month: number
            prices: Record<string, number>
          }>,
        ) => {
          const prices: Record<string, Record<string, Record<string, number>>> = {
            core: {},
            advanced: {},
          }
          const ids: Record<string, Record<string, string>> = { core: {}, advanced: {} }
          for (const p of plans) {
            const key = p.title === 'Advanced' ? 'advanced' : 'core'
            const cycle = p.month === 1 ? 'monthly' : String(p.month)
            if (p.prices) prices[key][cycle] = p.prices
            if (p.id) {
              ids[key][cycle] = p.id
              ids[key][String(p.month)] = p.id
            }
          }
          setPlanPrices(prices)
          setPlanIds(ids)
        },
      )
      .catch(() => {
        /* keep static fallback */
      })
  }, [])

  /**
   * Format an amount in the visitor's selected currency + locale. Shows cents
   * only when present (e.g. €99, but €88.50 for a promo first-month price).
   */
  const fmt = (n: number) => {
    const intlLocale = (locale || 'en') === 'de' ? 'de-DE' : 'en-IE'
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n)
    } catch {
      return `${currency} ${n.toFixed(2)}`
    }
  }

  // Fetch the express shipping fee in the selected currency (the value the
  // backend actually charges). Re-runs when the currency or plan/cycle changes.
  useEffect(() => {
    const planId = planIds[planKey]?.[cycleKey]
    if (!planId) return
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'
    fetch(`${backend}/subscriptions/public/checkout/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        currency,
        shipping_option: 'express',
        discount_code: null,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.shipping_price === 'number') setExpressShip(d.shipping_price)
      })
      .catch(() => {
        /* keep dictionary fallback */
      })
  }, [currency, planKey, cycleKey, planIds])

  const monthNum = Number(cycleKey)
  const durationLabel =
    !Number.isNaN(monthNum) && dict.plans.months[monthNum as 4 | 8 | 12]
      ? dict.plans.months[monthNum as 4 | 8 | 12]
      : cycleKey === 'monthly'
        ? t.summary.cancelAnytime
        : cycleKey
  const billingLabel = cycleKey === 'monthly' ? t.summary.cancelAnytime : t.summary.billingMonthly
  // Numeric monthly rate in the selected currency (live, falling back to EUR
  // statics), plus its formatted display string.
  const livePrices = planPrices[planKey]?.[cycleKey]
  const rateNum =
    livePrices?.[currency] ??
    livePrices?.EUR ??
    STATIC_RATES_EUR[planKey]?.[cycleKey] ??
    STATIC_RATES_EUR.core['4']
  const rate = fmt(rateNum)
  const zeroPrice = fmt(0)
  const planInfo = { label: durationLabel, billing: billingLabel, rate }
  const planLabel = planKey === 'advanced' ? 'Advanced' : 'Core'
  const orderHref = `/${locale || 'en'}/order`

  /* accordion */
  const [step, setStep] = useState(1)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  // Refs to the four accordion sections so validation can scroll to the first
  // invalid one (DOM lookups by class would be spoofable / brittle).
  const accRefs = useRef<(HTMLDivElement | null)[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralShareUrl, setReferralShareUrl] = useState<string | null>(null)

  useEffect(() => {
    const osn = document.querySelector<HTMLElement>('.osn-nav')
    if (!osn) return
    if (confirmed) {
      osn.style.removeProperty('display')
      osn.removeAttribute('style')
      osn.querySelectorAll('.osn-step.active').forEach((el) => {
        el.classList.remove('active')
        el.classList.add('done')
      })
      const back = osn.querySelector('.osn-back')
      if (back) {
        const help = document.createElement('a')
        help.href = `mailto:${t.done.supportEmail}`
        help.className = 'osn-back'
        help.textContent = t.done.helpLink
        back.replaceWith(help)
      }

      // Block back-navigation to checkout steps after confirmation (4.6)
      history.pushState(null, '', window.location.href)
      const onPopState = () => {
        history.pushState(null, '', window.location.href)
      }
      window.addEventListener('popstate', onPopState)
      return () => window.removeEventListener('popstate', onPopState)
    }
  }, [confirmed])

  /* step 1 */
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null)
  const emailAcknowledged = useRef<string | null>(null)

  /* step 2 */
  const [fn, setFn] = useState('')
  const [ln, setLn] = useState('')
  const [country, setCountry] = useState('Germany') // value stays the English key (matches COUNTRIES); display label is localized via dict.countries
  const [a1, setA1] = useState('')
  const [a2, setA2] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<Country>('DE')
  const [addrErr, setAddrErr] = useState<Record<string, string>>({})

  /* step 3 */
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard')

  /* ── sessionStorage: restore on mount ── */
  const FORM_KEY = 'nb1_checkout_form'
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FORM_KEY)
      if (!saved) return
      const d = JSON.parse(saved)
      if (d.email) setEmail(d.email)
      if (d.fn) setFn(d.fn)
      if (d.ln) setLn(d.ln)
      if (d.country) setCountry(d.country)
      if (d.a1) setA1(d.a1)
      if (d.a2) setA2(d.a2)
      if (d.zip) setZip(d.zip)
      if (d.city) setCity(d.city)
      if (d.phone) setPhone(d.phone)
      if (d.shipping) setShipping(d.shipping)
      if (d.step) setStep(d.step)
      if (d.doneSteps) setDoneSteps(new Set(d.doneSteps))
    } catch {
      /* noop */
    }
  }, [])

  /* ── sessionStorage: save on every change ── */
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FORM_KEY,
        JSON.stringify({
          email,
          fn,
          ln,
          country,
          a1,
          a2,
          zip,
          city,
          phone,
          shipping,
          step,
          doneSteps: [...doneSteps],
        }),
      )
    } catch {
      /* noop */
    }
  }, [email, fn, ln, country, a1, a2, zip, city, phone, shipping, step, doneSteps])

  // Fill the address fields from a Google Places selection: street → a1, postal_code → zip,
  // locality → city. Country is left as whatever the user picked in the Country select.
  const handleAddressPick = (place: GooglePlace) => {
    const comps = place?.address_components || []
    const get = (type: string) => comps.find((c) => c.types?.includes(type))?.long_name || ''
    const route = get('route')
    const num = get('street_number')
    const line1 =
      [route, num].filter(Boolean).join(' ').trim() ||
      (place?.formatted_address || '').split(',')[0].trim()
    const postal = get('postal_code')
    const cityName =
      get('locality') ||
      get('postal_town') ||
      get('administrative_area_level_2') ||
      get('sublocality') ||
      ''
    if (line1) setA1(line1)
    if (postal) setZip(postal)
    if (cityName) setCity(cityName)
  }

  /* wallet (Apple Pay / Google Pay) */
  const [paymentRequest, setPaymentRequest] = useState<ReturnType<
    NonNullable<typeof stripe>['paymentRequest']
  > | null>(null)
  const [walletAvailable, setWalletAvailable] = useState(false)

  /* step 4 */
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [cardName, setCardName] = useState('')
  const [iban, setIban] = useState('')
  const [ibanName, setIbanName] = useState('')
  const [billingSame, setBillingSame] = useState(true)
  const [payErr, setPayErr] = useState<Record<string, string>>({})

  /* billing address (used when billingSame is false) */
  const [bAddrType, setBAddrType] = useState<'individual' | 'company'>('individual')
  const [bFn, setBFn] = useState('')
  const [bLn, setBLn] = useState('')
  const [bCompany, setBCompany] = useState('')
  const [bTaxId, setBTaxId] = useState('')
  const [bRegNum, setBRegNum] = useState('')
  const [bEmail, setBEmail] = useState('')
  const [bEmailSuggestion, setBEmailSuggestion] = useState<string | null>(null)
  const [bPhone, setBPhone] = useState('')
  const [bPhoneCountry, setBPhoneCountry] = useState<Country>('DE')
  const [bA1, setBA1] = useState('')
  const [bA2, setBA2] = useState('')
  const [bZip, setBZip] = useState('')
  const [bCity, setBCity] = useState('')
  const [bCountry, setBCountry] = useState('Germany')

  /* account creation */
  const [accountStatus, setAccountStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [accountErr, setAccountErr] = useState('')
  const submittingRef = useRef(false)

  /* sync phone prefix with shipping/billing country when phone field is empty */
  useEffect(() => {
    if (!phone) setPhoneCountry((COUNTRY_CODES[country] as Country) ?? 'DE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country])

  useEffect(() => {
    if (!bPhone) setBPhoneCountry((COUNTRY_CODES[bCountry] as Country) ?? 'DE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bCountry])

  /* ── Klarna/PayPal redirect return handler ── */
  useEffect(() => {
    const redirectStatus = searchParams?.get('redirect_status')
    // After a SetupIntent redirect (Klarna/PayPal) Stripe appends setup_intent[_client_secret],
    // NOT payment_intent[_client_secret].
    const setupIntentParam = searchParams?.get('setup_intent')
    const setupIntentClientSecret = searchParams?.get('setup_intent_client_secret')
    if (!stripe) return
    if (!redirectStatus) return
    if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
      setPaymentFailed(true)
      return
    }
    if (
      (redirectStatus !== 'succeeded' && redirectStatus !== 'pending') ||
      !setupIntentParam ||
      !setupIntentClientSecret
    )
      return

    setAccountStatus('sending')
    ;(async () => {
      try {
        const setupIntentId =
          sessionStorage.getItem('nb1_paypal_setup_intent_id') ??
          sessionStorage.getItem('nb1_klarna_setup_intent_id') ??
          setupIntentParam
        const idempotencyKey =
          sessionStorage.getItem('nb1_checkout_idempotency_key') ?? setupIntentId
        sessionStorage.removeItem('nb1_paypal_setup_intent_id')
        // Restore form data from sessionStorage
        const saved = JSON.parse(sessionStorage.getItem('nb1_checkout_form') ?? '{}')
        const klarnaConfirmation = await checkoutConfirm({
          setup_intent_id: setupIntentId,
          idempotency_key: idempotencyKey,
          shipping_address: {
            first_name: saved.fn ?? fn,
            last_name: saved.ln ?? ln,
            email: saved.email ?? email,
            phone: saved.phone || null,
            address_line1: saved.a1 ?? a1,
            address_line2: saved.a2 || null,
            city: saved.city ?? city,
            state: null,
            postal_code: saved.zip ?? zip,
            country: saved.country ?? country,
            country_code: COUNTRY_CODES[saved.country ?? country] ?? '',
          },
          billing_address: {
            address_type: 'individual',
            first_name: saved.fn ?? fn,
            last_name: saved.ln ?? ln,
            company_name: null,
            tax_id: null,
            registration_number: null,
            email: saved.email ?? email,
            phone: saved.phone || null,
            address_line1: saved.a1 ?? a1,
            address_line2: saved.a2 || null,
            city: saved.city ?? city,
            state: null,
            postal_code: saved.zip ?? zip,
            country: COUNTRY_CODES[saved.country ?? country] ?? saved.country ?? country,
          },
        })
        sessionStorage.removeItem('nb1_klarna_setup_intent_id')
        const klarnaItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
        void pushEventWithUser(
          'purchase',
          {
            event_id: klarnaConfirmation.event_id,
            external_id: klarnaConfirmation.external_id,
            ecommerce: {
              transaction_id: klarnaConfirmation.subscription_id,
              currency,
              value: rateNum,
              shipping: (saved.shipping ?? shipping) === 'express' ? expressShipNum : 0,
              items: [klarnaItem],
            },
          },
          {
            userId: klarnaConfirmation.external_id,
            email: saved.email ?? email,
            phone: saved.phone || phone || undefined,
            firstName: saved.fn ?? fn,
            lastName: saved.ln ?? ln,
            address: [saved.a1 ?? a1, saved.a2 ?? a2].filter(Boolean).join(' '),
            postalCode: saved.zip ?? zip,
            city: saved.city ?? city,
            country: COUNTRY_CODES[saved.country ?? country] ?? saved.country ?? country,
          },
        )
        sendMetaCapiEvent('purchase', klarnaConfirmation.event_id, {
          ecommerce: {
            transaction_id: klarnaConfirmation.subscription_id,
            currency,
            value: rateNum,
            items: [
              {
                item_id: klarnaItem.item_id,
                item_name: klarnaItem.item_name,
                price: klarnaItem.price,
                quantity: 1,
              },
            ],
          },
          user: {
            email: saved.email ?? email,
            first_name: saved.fn ?? fn,
            last_name: saved.ln ?? ln,
            city: saved.city ?? city,
            zip: saved.zip ?? zip,
            country: COUNTRY_CODES[saved.country ?? country] ?? saved.country ?? country,
            phone: saved.phone || phone || undefined,
            external_id: klarnaConfirmation.external_id,
          },
        })
        setOrderNumber(klarnaConfirmation.order_number ?? null)
        setAccountStatus('sent')
        setConfirmed(true)
      } catch (err) {
        setAccountErr((err as Error).message || t.confirm.accountError)
        setAccountStatus('error')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe])

  /* idempotency key — generated once per checkout session, persisted in sessionStorage */
  const idempotencyKeyRef = useRef<string>('')
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('nb1_checkout_idempotency_key')
      idempotencyKeyRef.current = saved ?? crypto.randomUUID()
      sessionStorage.setItem('nb1_checkout_idempotency_key', idempotencyKeyRef.current)
    } catch {
      idempotencyKeyRef.current = crypto.randomUUID()
    }
  }, [])

  /* ── begin_checkout on mount ── */
  useEffect(() => {
    const bcId = mintEventId()
    const bcItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
    pushEvent('begin_checkout', {
      event_id: bcId,
      ecommerce: {
        currency,
        value: rateNum,
        ...(promoApplied ? { coupon: promoApplied } : {}),
        items: [bcItem],
      },
    })
    sendMetaCapiEvent('begin_checkout', bcId, {
      ecommerce: {
        currency,
        value: rateNum,
        items: [
          {
            item_id: bcItem.item_id,
            item_name: bcItem.item_name,
            price: bcItem.price,
            quantity: 1,
          },
        ],
      },
    })
    // Fire once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* promo */
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState<string | null>(null)
  const [promoMsg, setPromoMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [promoOpenForm, setPromoOpenForm] = useState(false)
  const [promoOpenSidebar, setPromoOpenSidebar] = useState(false)
  const [promoPreview, setPromoPreview] = useState<{
    promo_discount: number
    first_month_price: number
    monthly_price: number
    shipping_price: number
  } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  /* ── Re-fetch preview when shipping or currency changes while promo applied ── */
  useEffect(() => {
    if (!promoApplied) return
    const planId = planIds[planKey]?.[cycleKey]
    if (!planId) return
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'
    fetch(`${backend}/subscriptions/public/checkout/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        currency,
        shipping_option: shipping,
        discount_code: promoApplied,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.discount_code_valid) {
          setPromoPreview({
            promo_discount: data.promo_discount,
            first_month_price: data.first_month_price,
            monthly_price: data.monthly_price,
            shipping_price: data.shipping_price,
          })
        }
      })
      .catch(() => {
        /* ignore */
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipping, currency])

  /* ── Wallet: create PaymentRequest once Stripe is ready ── */
  useEffect(() => {
    if (!stripe) return
    const pr = stripe.paymentRequest({
      country: 'DE',
      currency: currency.toLowerCase(),
      total: { label: `NB1 ${planLabel} Plan`, amount: 0, pending: true },
      requestPayerName: true,
      requestPayerEmail: true,
    })
    void pr.canMakePayment().then((result) => {
      console.log('[Wallet] canMakePayment result:', result)
      if (result) {
        setPaymentRequest(pr)
        setWalletAvailable(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe])

  /* ── Wallet: paymentmethod handler (re-registers when form state changes) ── */
  useEffect(() => {
    if (!paymentRequest || !stripe) return
    const accountError = t.confirm.accountError
    const accountExists = t.confirm.accountExists
    const handler = async (event: PaymentRequestPaymentMethodEvent) => {
      // A PaymentRequestEvent may only be completed ONCE — a second call throws.
      // The catch below would otherwise complete('fail') after a successful
      // complete('success') (checkoutConfirm failure) and die mid-handler,
      // leaving the spinner and the submitting lock stuck forever.
      let completed = false
      const complete = (status: 'success' | 'fail') => {
        if (completed) return
        completed = true
        event.complete(status)
      }
      // Backstop: the wallet sheet may have been opened from a tampered UI —
      // never accept a wallet payment while email/address are missing. (The
      // wallet path sends the shipping address from our form, not from the wallet.)
      if (!validateBeforePay(false)) {
        complete('fail')
        return
      }
      if (submittingRef.current) {
        complete('fail')
        return
      }
      submittingRef.current = true
      setAccountStatus('sending')
      setAccountErr('')
      try {
        const monthNum = cycleKey === 'monthly' ? 1 : Number(cycleKey)
        const planSlug = `NB1-${planKey.toUpperCase()}-${monthNum}`
        const intent = await checkoutPaymentIntent({
          plan_slug: planSlug,
          currency,
          shipping_option: shipping,
          discount_code: promoApplied ?? null,
          customer_email: email,
          customer_name: `${fn} ${ln}`.trim() || null,
          customer_phone: phone || null,
          idempotency_key: idempotencyKeyRef.current || undefined,
        })
        const { error: stripeError } = await stripe.confirmCardSetup(intent.client_secret, {
          payment_method: event.paymentMethod.id,
        })
        if (stripeError) {
          complete('fail')
          setAccountErr(stripeError.message ?? accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
        complete('success')
        const walletConfirmation = await checkoutConfirm({
          setup_intent_id: intent.setup_intent_id,
          idempotency_key: idempotencyKeyRef.current || intent.setup_intent_id,
          shipping_address: {
            first_name: fn,
            last_name: ln,
            email,
            phone: phone || null,
            address_line1: a1,
            address_line2: a2 || null,
            city,
            state: null,
            postal_code: zip,
            country,
            country_code: COUNTRY_CODES[country] ?? '',
          },
          billing_address: {
            address_type: 'individual',
            first_name: fn,
            last_name: ln,
            company_name: null,
            tax_id: null,
            registration_number: null,
            email,
            phone: phone || null,
            address_line1: a1,
            address_line2: a2 || null,
            city,
            state: null,
            postal_code: zip,
            country: COUNTRY_CODES[country] ?? country,
          },
        })
        setOrderNumber(walletConfirmation.order_number ?? null)
        setAccountStatus('sent')
        setConfirmed(true)
      } catch (err: unknown) {
        complete('fail')
        setAccountStatus('error')
        const code = (err as { code?: string })?.code
        setAccountErr(
          code === 'auth/email-already-in-use'
            ? accountExists
            : (err as Error).message || accountError,
        )
        submittingRef.current = false
      }
    }
    paymentRequest.on('paymentmethod', handler)
    return () => {
      paymentRequest.off('paymentmethod', handler)
    }
  }, [
    paymentRequest,
    stripe,
    email,
    fn,
    ln,
    phone,
    a1,
    a2,
    zip,
    city,
    country,
    shipping,
    planKey,
    cycleKey,
    promoApplied,
    t.confirm.accountError,
    t.confirm.accountExists,
    // validateBeforePay is re-created each render; listing it re-registers the
    // handler so it always validates against the latest form state.
    validateBeforePay,
  ])

  /* ── helpers ── */
  // Express fee shown in the selected currency once the live price loads;
  // falls back to the dictionary string (EUR) if the fetch hasn't returned.
  const expressPriceLabel = expressShip != null ? fmt(expressShip) : t.shipping.expressPrice
  const expressShipNum =
    expressShip ?? (parseFloat(t.shipping.expressPrice.replace(/[^0-9.]/g, '')) || 9)
  const shippingLabel =
    shipping === 'express'
      ? `${t.shipping.expressName} · ${expressPriceLabel}`
      : `${t.shipping.standardName} · ${t.shipping.standardPrice}`

  function markDone(n: number) {
    setDoneSteps((s) => new Set([...s, n]))
    setStep(n + 1)
  }

  /* ── validation ──
     All checks read React state, never the DOM. The accordion lock/done classes
     and the disabled attribute on the confirm button are cosmetic only — anyone
     can flip them via DevTools or seed step/doneSteps through sessionStorage —
     so every path that can initiate a payment (confirm button, wallet sheet,
     Klarna/PayPal redirects, which all start in nextPayment) must pass
     validateBeforePay first. */
  const hasLetter = (s: string) => /\p{L}/u.test(s)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function getEmailError(): string {
    return !email || !EMAIL_RE.test(email) ? t.email.invalid : ''
  }

  /* Soft, non-blocking "did you mean gmail.com?" nudge for likely domain
     typos. Distinct from getEmailError: a lingering suggestion never stops
     checkout, it only surfaces once the field is well-formed and blurred. */
  function handleEmailBlur() {
    if (EMAIL_RE.test(email)) setEmailSuggestion(suggestEmailDomain(email))
  }

  function applyEmailSuggestion() {
    if (!emailSuggestion) return
    const atIndex = email.lastIndexOf('@')
    if (atIndex === -1) return
    setEmail(email.slice(0, atIndex + 1) + emailSuggestion)
    setEmailSuggestion(null)
  }

  function handleBEmailBlur() {
    if (EMAIL_RE.test(bEmail)) setBEmailSuggestion(suggestEmailDomain(bEmail))
  }

  function applyBEmailSuggestion() {
    if (!bEmailSuggestion) return
    const atIndex = bEmail.lastIndexOf('@')
    if (atIndex === -1) return
    setBEmail(bEmail.slice(0, atIndex + 1) + bEmailSuggestion)
    setBEmailSuggestion(null)
  }

  function getAddrErrors(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!fn.trim()) e.fn = t.required
    else if (!hasLetter(fn)) e.fn = t.nameInvalid
    if (!ln.trim()) e.ln = t.required
    else if (!hasLetter(ln)) e.ln = t.nameInvalid
    if (!a1.trim()) e.a1 = t.required
    if (!zip.trim()) e.zip = t.required
    if (!city.trim()) e.city = t.required
    else if (!hasLetter(city)) e.city = t.nameInvalid
    // Phone is required for delivery updates. The input keeps the value in
    // E.164 (+49…), so isValidPhoneNumber checks it against the numbering
    // rules of the country the visitor picked in the country-code selector.
    if (!phone) e.phone = t.required
    else if (!isValidPhoneNumber(phone)) e.phone = t.address.phoneInvalid
    return e
  }

  function getPayErrors(): Record<string, string> {
    const e: Record<string, string> = {}
    if (payMethod === 'sepa') {
      if (iban.replace(/\s/g, '').length < 15) e.iban = t.payment.ibanInvalid
      if (!ibanName.trim()) e.ibanName = t.required
    }
    if (!billingSame) {
      // bFn/bLn/bEmail/bPhone fall back to the shipping values when left empty,
      // so they are only checked for validity when filled. The billing address
      // core has no fallback and is required.
      if (bAddrType === 'company' && !bCompany.trim()) e.bCompany = t.required
      if (bFn.trim() && !hasLetter(bFn)) e.bFn = t.nameInvalid
      if (bLn.trim() && !hasLetter(bLn)) e.bLn = t.nameInvalid
      if (bEmail.trim() && !EMAIL_RE.test(bEmail)) e.bEmail = t.email.invalid
      if (bPhone && !isValidPhoneNumber(bPhone)) e.bPhone = t.address.phoneInvalid
      if (!bA1.trim()) e.bA1 = t.required
      if (!bZip.trim()) e.bZip = t.required
      if (!bCity.trim()) e.bCity = t.required
      else if (!hasLetter(bCity)) e.bCity = t.nameInvalid
    }
    return e
  }

  /* Full-form gate run before any payment starts. On failure: shows the field
     errors, revokes the done tick of every invalid step, opens the first
     invalid step and scrolls to it. Returns true only when everything is valid. */
  function validateBeforePay(includePayFields: boolean): boolean {
    const emailError = getEmailError()
    const addrErrors = getAddrErrors()
    const payErrors = includePayFields ? getPayErrors() : {}
    setEmailErr(emailError)
    setAddrErr(addrErrors)
    if (includePayFields) setPayErr(payErrors)

    const badSteps: number[] = []
    if (emailError) badSteps.push(1)
    if (Object.keys(addrErrors).length) badSteps.push(2)
    if (Object.keys(payErrors).length) badSteps.push(4)
    if (badSteps.length === 0) return true

    setDoneSteps((s) => {
      const next = new Set(s)
      badSteps.forEach((n) => next.delete(n))
      return next
    })
    setStep(badSteps[0])
    requestAnimationFrame(() => {
      accRefs.current[badSteps[0] - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return false
  }

  function nextEmail() {
    const err = getEmailError()
    setEmailErr(err)
    if (err) return

    // Clicking "Next" fires blur (which sets emailSuggestion via
    // handleEmailBlur) and then this click handler in the same tick, so
    // emailSuggestion is already truthy by the time we get here even on
    // the very first click — it can't tell "just shown by blur" apart
    // from "shown and clicked through". emailAcknowledged tracks that
    // distinction directly: only once the user clicks Next again for this
    // exact address does it proceed, so the warning can never be skipped
    // by the blur+click race, but still never becomes a hard block.
    const suggestion = suggestEmailDomain(email)
    if (suggestion && emailAcknowledged.current !== email) {
      setEmailSuggestion(suggestion)
      emailAcknowledged.current = email
      return
    }

    const esItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
    void pushEventWithUser(
      'email_submitted',
      {
        event_id: mintEventId(),
        ecommerce: {
          currency,
          value: rateNum,
          ...(promoApplied ? { coupon: promoApplied } : {}),
          items: [esItem],
        },
      },
      { email, phone: phone || undefined },
    )
    // Record the visitor's UI language on their Klaviyo profile (keyed by this email),
    // so `language` shows up alongside order_number / plan_title. Best-effort.
    void trackLanguagePublic(email, uiLanguage)
    markDone(1)
  }

  function nextAddr() {
    const e = getAddrErrors()
    setAddrErr(e)
    if (Object.keys(e).length) return
    markDone(2)
  }

  function nextShipping() {
    const siId = mintEventId()
    const siItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
    void pushEventWithUser(
      'add_shipping_info',
      {
        event_id: siId,
        ecommerce: {
          currency,
          value: rateNum,
          ...(promoApplied ? { coupon: promoApplied } : {}),
          shipping_tier: shipping === 'express' ? 'Express' : 'Standard',
          items: [siItem],
        },
      },
      {
        email,
        phone: phone || undefined,
        firstName: fn,
        lastName: ln,
        address: [a1, a2].filter(Boolean).join(' '),
        postalCode: zip,
        city,
        country: COUNTRY_CODES[country] ?? country,
      },
    )
    sendMetaCapiEvent('add_shipping_info', siId, {
      ecommerce: {
        currency,
        value: rateNum,
        items: [
          {
            item_id: siItem.item_id,
            item_name: siItem.item_name,
            price: siItem.price,
            quantity: 1,
          },
        ],
      },
      user: {
        email,
        first_name: fn,
        last_name: ln,
        city,
        zip,
        country: COUNTRY_CODES[country] ?? country,
        phone,
      },
    })
    markDone(3)
  }

  async function nextPayment() {
    // Re-validates EVERY step from state before touching Stripe/backend — a UI
    // unlocked via DevTools or sessionStorage cannot pay with missing data.
    if (!validateBeforePay(true)) return

    if (submittingRef.current) return
    submittingRef.current = true
    setAccountStatus('sending')
    setAccountErr('')

    const apiId = mintEventId()
    const apiItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
    void pushEventWithUser(
      'add_payment_info',
      {
        event_id: apiId,
        ecommerce: {
          currency,
          value: rateNum,
          ...(promoApplied ? { coupon: promoApplied } : {}),
          payment_type:
            payMethod === 'card'
              ? 'Card'
              : payMethod === 'paypal'
                ? 'PayPal'
                : payMethod === 'klarna'
                  ? 'Klarna'
                  : payMethod === 'sepa'
                    ? 'SEPA Direct Debit'
                    : payMethod,
          items: [apiItem],
        },
      },
      {
        email,
        phone: phone || undefined,
        firstName: fn,
        lastName: ln,
        address: [a1, a2].filter(Boolean).join(' '),
        postalCode: zip,
        city,
        country: COUNTRY_CODES[country] ?? country,
      },
    )
    sendMetaCapiEvent('add_payment_info', apiId, {
      ecommerce: {
        currency,
        value: rateNum,
        items: [
          {
            item_id: apiItem.item_id,
            item_name: apiItem.item_name,
            price: apiItem.price,
            quantity: 1,
          },
        ],
      },
      user: {
        email,
        first_name: fn,
        last_name: ln,
        city,
        zip,
        country: COUNTRY_CODES[country] ?? country,
        phone,
      },
    })

    try {
      // 1. Create Stripe PaymentIntent via backend
      // Backend slugs follow the pattern NB1-{PLAN}-{MONTHS} (e.g. NB1-CORE-4)
      const monthNum = cycleKey === 'monthly' ? 1 : Number(cycleKey)
      const planSlug = `NB1-${planKey.toUpperCase()}-${monthNum}`

      const intent = await checkoutPaymentIntent({
        plan_slug: planSlug,
        currency,
        shipping_option: shipping,
        discount_code: promoApplied ?? null,
        customer_email: email,
        customer_name: `${fn} ${ln}`.trim() || null,
        customer_phone: phone || null,
        idempotency_key: idempotencyKeyRef.current || undefined,
        payment_method_type:
          payMethod === 'paypal' ? 'paypal' : payMethod === 'klarna' ? 'klarna' : null,
      })

      // 2. Confirm payment with Stripe.js
      if (payMethod === 'card') {
        // Every early return here MUST release submittingRef — otherwise the
        // first declined/invalid card permanently swallows all later attempts
        // (the guard at the top of this function returns silently).
        if (!stripe || !elements) {
          setAccountErr(t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          setAccountErr(t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
        const { error: stripeError } = await stripe.confirmCardSetup(intent.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardName || `${fn} ${ln}`.trim(), email },
          },
        })
        if (stripeError) {
          setAccountErr(stripeError.message ?? t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
      }

      if (payMethod === 'klarna') {
        if (!stripe) {
          setAccountErr(t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
        // Store setup_intent_id so we can call checkoutConfirm after redirect
        sessionStorage.setItem('nb1_klarna_setup_intent_id', intent.setup_intent_id)
        const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
        // SetupIntent (method saved, no charge) → must use confirmKlarnaSetup, NOT confirmKlarnaPayment.
        const { error: klarnaError } = await (
          stripe as unknown as StripeSetupConfirms
        ).confirmKlarnaSetup(intent.client_secret, {
          payment_method: {
            billing_details: {
              name: `${fn} ${ln}`.trim(),
              email,
              phone: phone || undefined,
              address: {
                line1: a1,
                line2: a2 || undefined,
                city,
                postal_code: zip,
                country: COUNTRY_CODES[country] ?? 'DE',
              },
            },
          },
          return_url: returnUrl,
          mandate_data: {
            customer_acceptance: { type: 'online', online: { infer_from_client: true } },
          },
        })
        // If we reach here Stripe failed before redirecting
        if (klarnaError) {
          setAccountErr(klarnaError.message ?? t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
        }
        // Redirect is in progress — do not continue
        return
      }

      if (payMethod === 'paypal') {
        if (!stripe) {
          setAccountErr(t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
          return
        }
        sessionStorage.setItem('nb1_paypal_setup_intent_id', intent.setup_intent_id)
        const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
        // SetupIntent (method saved, no charge) → must use confirmPayPalSetup, NOT confirmPayPalPayment.
        const { error: paypalError } = await (
          stripe as unknown as StripeSetupConfirms
        ).confirmPayPalSetup(intent.client_secret, {
          return_url: returnUrl,
          mandate_data: {
            customer_acceptance: { type: 'online', online: { infer_from_client: true } },
          },
        })
        if (paypalError) {
          setAccountErr(paypalError.message ?? t.confirm.accountError)
          setAccountStatus('error')
          submittingRef.current = false
        }
        return
      }

      // 3. Confirm checkout — backend creates user + subscription
      const confirmation = await checkoutConfirm({
        setup_intent_id: intent.setup_intent_id,
        idempotency_key: idempotencyKeyRef.current || intent.setup_intent_id,
        shipping_address: {
          first_name: fn,
          last_name: ln,
          email,
          phone: phone || null,
          address_line1: a1,
          address_line2: a2 || null,
          city,
          state: null,
          postal_code: zip,
          country,
          country_code: COUNTRY_CODES[country] ?? '',
        },
        billing_address: billingSame
          ? {
              address_type: 'individual',
              first_name: fn,
              last_name: ln,
              company_name: null,
              tax_id: null,
              registration_number: null,
              email,
              phone: phone || null,
              address_line1: a1,
              address_line2: a2 || null,
              city,
              state: null,
              postal_code: zip,
              country: COUNTRY_CODES[country] ?? country,
            }
          : {
              address_type: bAddrType,
              first_name: bFn || fn,
              last_name: bLn || ln,
              company_name: bCompany || null,
              tax_id: bTaxId || null,
              registration_number: bRegNum || null,
              email: bEmail || email,
              phone: bPhone || phone || null,
              address_line1: bA1,
              address_line2: bA2 || null,
              city: bCity,
              state: null,
              postal_code: bZip,
              country: COUNTRY_CODES[bCountry] ?? bCountry,
            },
      })

      const purchaseItem = buildNb1Item(planKey, cycleKey, rateNum, {
        planTitle: planLabel,
        discount: promoPreview?.promo_discount,
      })
      void pushEventWithUser(
        'purchase',
        {
          event_id: confirmation.event_id,
          external_id: confirmation.external_id,
          ecommerce: {
            transaction_id: confirmation.subscription_id,
            currency,
            value: rateNum,
            shipping: promoPreview?.shipping_price ?? (shipping === 'express' ? expressShipNum : 0),
            ...(promoApplied ? { coupon: promoApplied } : {}),
            items: [purchaseItem],
          },
        },
        {
          userId: confirmation.external_id,
          email,
          phone: phone || undefined,
          firstName: fn,
          lastName: ln,
          address: [a1, a2].filter(Boolean).join(' '),
          postalCode: zip,
          city,
          country: COUNTRY_CODES[country] ?? country,
        },
      )
      sendMetaCapiEvent('purchase', confirmation.event_id, {
        ecommerce: {
          transaction_id: confirmation.subscription_id,
          currency,
          value: rateNum,
          items: [
            {
              item_id: purchaseItem.item_id,
              item_name: purchaseItem.item_name,
              price: purchaseItem.price,
              quantity: 1,
            },
          ],
        },
        user: {
          email,
          first_name: fn,
          last_name: ln,
          city,
          zip,
          country: COUNTRY_CODES[country] ?? country,
          phone,
          external_id: confirmation.external_id,
        },
      })

      setOrderNumber(confirmation.order_number ?? null)
      setAccountStatus('sent')
      setReferralCode(confirmation.referral_code ?? null)
      setReferralShareUrl(confirmation.referral_share_url ?? null)
    } catch (err: unknown) {
      setAccountStatus('error')
      const code = (err as { code?: string })?.code
      if (code === 'auth/email-already-in-use') {
        setAccountErr(t.confirm.accountExists)
      } else {
        setAccountErr((err as Error).message || t.confirm.accountError)
      }
      submittingRef.current = false
      return
    }

    setConfirmed(true)
  }

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    const planId = planIds[planKey]?.[cycleKey]
    if (!planId) {
      setPromoMsg({ text: dict.promo.invalid, ok: false })
      return
    }
    setPromoLoading(true)
    setPromoMsg(null)
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'
      const res = await fetch(`${backend}/subscriptions/public/checkout/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          currency,
          shipping_option: shipping,
          discount_code: code,
        }),
      })
      const data = await res.json()
      if (data.discount_code_valid) {
        setPromoApplied(code)
        const voucherItem = buildNb1Item(planKey, cycleKey, rateNum, {
          planTitle: planLabel,
          discount: data.promo_discount,
        })
        pushEvent('add_voucher', {
          event_id: mintEventId(),
          ecommerce: {
            coupon: code,
            currency,
            value: rateNum,
            items: [voucherItem],
          },
        })
        setPromoPreview({
          promo_discount: data.promo_discount,
          first_month_price: data.first_month_price,
          monthly_price: data.monthly_price,
          shipping_price: data.shipping_price,
        })
        setPromoMsg({
          text:
            data.discount_message ??
            dict.promo.appliedTemplate.replace('{code}', code).replace('{desc}', ''),
          ok: true,
        })
      } else {
        const errMsg = data.discount_message ?? dict.promo.invalid
        setPromoMsg({ text: errMsg, ok: false })
        const voucherItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
        pushEvent('add_voucher_error', {
          event_id: mintEventId(),
          error: errMsg,
          ecommerce: {
            coupon: code,
            currency,
            value: rateNum,
            items: [voucherItem],
          },
        })
      }
    } catch (err) {
      const errMsg = (err as Error)?.message || dict.promo.invalid
      setPromoMsg({ text: dict.promo.invalid, ok: false })
      const voucherItem = buildNb1Item(planKey, cycleKey, rateNum, { planTitle: planLabel })
      pushEvent('add_voucher_error', {
        event_id: mintEventId(),
        error: errMsg,
        ecommerce: {
          coupon: code,
          currency,
          value: rateNum,
          items: [voucherItem],
        },
      })
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromoApplied(null)
    setPromoInput('')
    setPromoMsg(null)
    setPromoPreview(null)
  }

  function fmtIban(v: string) {
    return v
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 34)
      .replace(/(.{4})(?=.)/g, '$1 ')
  }

  const zero = zeroPrice
  const confirmLabel =
    payMethod === 'paypal'
      ? t.confirm.paypal
      : payMethod === 'klarna'
        ? t.confirm.klarna
        : t.confirm.label.replace('{zeroPrice}', zero)

  const [inboxBodyPrefix, inboxBodySuffix] = t.done.inboxBody.split('{email}')
  const [chargeNotePrefix, chargeNoteSuffix] = t.done.summary.chargeNote.split('{when}')

  /* ── Payment failed screen ── */
  if (paymentFailed) {
    return (
      <PaymentFailedScreen
        locale={locale ?? 'en'}
        t={t}
        onRetry={() => {
          const params = new URLSearchParams(window.location.search)
          for (const key of [
            'redirect_status',
            'payment_intent',
            'payment_intent_client_secret',
            'setup_intent',
            'setup_intent_client_secret',
            'source_redirect_slug',
          ]) {
            params.delete(key)
          }
          const query = params.toString()
          window.location.replace(window.location.pathname + (query ? `?${query}` : ''))
        }}
      />
    )
  }

  /* ── Confirmation screen ── */
  if (confirmed) {
    const SURV_OPTS = [
      { v: 'Social media', sub: ['Instagram', 'TikTok', 'YouTube'] },
      { v: 'Google' },
      { v: 'Influencer / creator' },
      { v: 'A friend' },
      { v: 'Podcast' },
      { v: 'HYROX / event' },
    ]
    const cycleLabel = cycleKey === 'monthly' ? 'Flexible monthly' : `${cycleKey} months`
    const priceFormatted = rate != null ? String(rate) : ''
    return (
      <ConfirmationScreen
        fn={fn}
        email={email}
        orderNumber={orderNumber}
        planLabel={planLabel}
        cycleLabel={cycleLabel}
        priceFormatted={priceFormatted}
        locale={locale ?? 'en'}
        t={t}
        inboxBodyPrefix={inboxBodyPrefix}
        inboxBodySuffix={inboxBodySuffix}
        chargeNotePrefix={chargeNotePrefix}
        chargeNoteSuffix={chargeNoteSuffix}
        survOpts={SURV_OPTS}
      />
    )
  }

  /* ── Main layout ── */
  return (
    <div className="nb1-det-wrap">
      <style jsx global>{`
        /* ── Layout ── */
        .nb1-det-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 46px 28px 80px;
        }
        .nb1-det-hero {
          margin-bottom: 40px;
        }
        .nb1-det-hero h1 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.6vw, 44px);
          letter-spacing: -0.03em;
          color: #12314d;
          margin: 0 0 10px;
        }
        .nb1-det-hero h1 span {
          color: #0a8fb0;
        }
        .nb1-det-hero p {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.65);
          line-height: 1.55;
          max-width: 520px;
          margin: 0;
        }
        .nb1-det-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 44px;
          align-items: start;
        }
        .nb1-det-left {
        }
        .nb1-det-right {
          position: sticky;
          top: 96px;
        }

        /* ── Accordion ── */
        .nb1-acc {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 14px;
          margin-bottom: 14px;
          overflow: hidden;
          background: #fff;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-acc.open {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .nb1-acc.locked {
          opacity: 0.55;
          pointer-events: none;
        }
        .nb1-acc-hd {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }
        .nb1-acc-num {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          color: rgba(18, 49, 77, 0.4);
          transition: all 0.15s;
        }
        .nb1-acc.open .nb1-acc-num {
          border-color: #0a8fb0;
          color: #0a8fb0;
        }
        .nb1-acc.done .nb1-acc-num {
          border-color: #0a8fb0;
          background: #0a8fb0;
          color: #fff;
          font-size: 0;
        }
        .nb1-acc.done .nb1-acc-num::after {
          content: '✓';
          font-size: 13px;
        }
        .nb1-acc-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16.5px;
          color: #12314d;
          flex: 1;
        }
        .nb1-acc.locked .nb1-acc-title {
          color: rgba(18, 49, 77, 0.4);
        }
        .nb1-acc-summary {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          margin-left: auto;
        }
        .nb1-acc-edit {
          font-size: 13px;
          font-weight: 600;
          color: #0a8fb0;
          margin-left: 12px;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nb1-acc-body {
          padding: 2px 24px 24px;
          display: none;
        }
        .nb1-acc.open .nb1-acc-body {
          display: block;
        }

        /* ── Form fields ── */
        .nb1-frow {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .nb1-frow.full {
          grid-template-columns: 1fr;
        }
        .nb1-fg {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .nb1-fg label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-fg input,
        .nb1-fg select {
          padding: 13px 15px;
          border-radius: 11px;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          background: #fff;
          font-size: 15px;
          color: #12314d;
          outline: none;
          width: 100%;
          font-family: 'Inter', sans-serif;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
          box-sizing: border-box;
        }
        .nb1-fg input:focus,
        .nb1-fg select:focus {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.1);
        }
        .nb1-fg input.err {
          border-color: #c0392b;
        }
        .nb1-fg .nb1-err {
          font-size: 12px;
          color: #c0392b;
        }
        .nb1-fg .nb1-hint {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.5);
        }
        .nb1-fg .nb1-suggest {
          display: block;
          font-size: 12.5px;
          color: #8a5a00;
        }
        .nb1-fg .nb1-suggest button {
          background: none;
          border: none;
          padding: 0;
          margin-left: 6px;
          font: inherit;
          font-weight: 600;
          color: #0a8fb0;
          cursor: pointer;
          text-decoration: underline;
        }
        .nb1-fg .nb1-suggest button.nb1-suggest-dismiss {
          text-decoration: none;
        }

        /* ── Next button ── */
        .nb1-acc-next {
          margin-top: 18px;
          height: 48px;
          padding: 0 32px;
          background: #c6ff5b;
          color: #0e2740;
          border: none;
          border-radius: 100px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.18s;
        }
        .nb1-acc-next:hover {
          background: #aaea42;
        }

        /* ── Shipping options ── */
        .nb1-ship-opts {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nb1-ship-opt {
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1.5px solid rgba(18, 49, 77, 0.12);
          border-radius: 12px;
          padding: 16px 18px;
          cursor: pointer;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-ship-opt.sel {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .nb1-ship-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(18, 49, 77, 0.2);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s;
        }
        .nb1-ship-opt.sel .nb1-ship-radio {
          border-color: #0a8fb0;
        }
        .nb1-ship-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0a8fb0;
          display: none;
        }
        .nb1-ship-opt.sel .nb1-ship-radio-dot {
          display: block;
        }
        .nb1-ship-info {
          flex: 1;
        }
        .nb1-ship-name {
          font-size: 14px;
          font-weight: 600;
          color: #12314d;
        }
        .nb1-ship-sub {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-ship-price {
          font-size: 14px;
          font-weight: 600;
          color: #12314d;
        }

        /* ── Payment methods ── */
        .nb1-wallet-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        .nb1-wallet-btn {
          height: 48px;
          border-radius: 10px;
          border: 1.5px solid rgba(18, 49, 77, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .nb1-wallet-btn:hover {
          opacity: 0.85;
        }
        .nb1-wallet-apple {
          background: #000;
          color: #fff;
          border-color: #000;
        }
        .nb1-wallet-gpay {
          background: #fff;
          color: #12314d;
        }
        .nb1-pay-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          color: rgba(18, 49, 77, 0.4);
          font-size: 12.5px;
        }
        .nb1-pay-divider::before,
        .nb1-pay-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(18, 49, 77, 0.1);
        }
        .nb1-pmlist {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nb1-pm-row {
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          border-radius: 12px;
          overflow: hidden;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-pm-row.active {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .nb1-pm-hd {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 18px;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #12314d;
        }
        .nb1-pm-hd:hover {
          background: rgba(18, 49, 77, 0.02);
        }
        .nb1-pm-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(18, 49, 77, 0.2);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s;
        }
        .nb1-pm-row.active .nb1-pm-radio {
          border-color: #0a8fb0;
        }
        .nb1-pm-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0a8fb0;
          display: none;
        }
        .nb1-pm-row.active .nb1-pm-radio-dot {
          display: block;
        }
        .nb1-pm-icons {
          display: flex;
          gap: 5px;
          margin-left: auto;
        }
        .nb1-pm-body {
          padding: 0 18px 18px;
          display: none;
        }
        .nb1-pm-row.active .nb1-pm-body {
          display: block;
        }
        .nb1-pm-note {
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.65);
          line-height: 1.55;
          padding: 4px 0 8px;
        }
        .nb1-klarna-badge {
          display: inline-block;
          background: #ffb3c7;
          color: #0e2740;
          font-style: italic;
          font-weight: 700;
          font-size: 12px;
          padding: 3px 9px;
          border-radius: 100px;
        }

        /* billing same */
        .nb1-billing-check {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          cursor: pointer;
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-billing-check input {
          width: 16px;
          height: 16px;
          accent-color: #0a8fb0;
          cursor: pointer;
        }
        .nb1-billing-addr {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* secure badge */
        .nb1-secure {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 16px;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.5);
          border: none;
          border-radius: 0;
          background: none;
        }

        /* promo in form */
        .nb1-promo-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 600;
          color: #0a8fb0;
          padding: 0;
          margin-top: 14px;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(10, 143, 176, 0.3);
        }
        .nb1-promo-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .nb1-promo-input {
          flex: 1;
          height: 40px;
          padding: 0 12px;
          border: 1.5px solid rgba(18, 49, 77, 0.15);
          border-radius: 8px;
          font-size: 13.5px;
          color: #12314d;
          outline: none;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        .nb1-promo-input:focus {
          border-color: #0a8fb0;
        }
        .nb1-promo-apply {
          height: 40px;
          padding: 0 16px;
          background: #12314d;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .nb1-promo-apply:hover {
          background: #1a4068;
        }
        .nb1-promo-msg {
          font-size: 13px;
          margin-top: 6px;
        }
        .nb1-promo-msg.ok {
          color: #0a8fb0;
          font-weight: 600;
        }
        .nb1-promo-msg.err {
          color: #c0392b;
        }

        /* confirm button */
        .nb1-confirm-btn {
          display: block;
          width: 100%;
          height: 52px;
          background: #c6ff5b;
          color: #0e2740;
          border: none;
          border-radius: 100px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          margin-top: 20px;
          transition: background 0.18s;
        }
        .nb1-confirm-btn:hover {
          background: #aaea42;
        }
        .nb1-confirm-legal {
          font-size: 11.5px;
          color: rgba(18, 49, 77, 0.45);
          line-height: 1.55;
          margin-top: 12px;
        }
        .nb1-confirm-legal a {
          color: #0a8fb0;
          text-decoration: none;
        }

        /* ── What's next ── */
        .nb1-whats-next {
          background: #f1f4f7;
          border: 1px solid rgba(18, 49, 77, 0.07);
          border-radius: 16px;
          padding: 22px 24px;
          margin-top: 40px;
        }
        .nb1-whats-next-h {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.45);
          margin-bottom: 14px;
        }
        .nb1-whats-next ol {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nb1-whats-next li {
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.65);
          line-height: 1.5;
        }

        /* ── Sidebar ── */
        .nb1-sum {
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .nb1-sum-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #12314d;
          margin-bottom: 18px;
        }
        .nb1-sum-rows {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .nb1-sum-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 0;
          border-bottom: 1px solid rgba(18, 49, 77, 0.07);
          font-size: 13.5px;
        }
        .nb1-sum-row:last-of-type {
          border-bottom: none;
        }
        .nb1-sum-label {
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-sum-val {
          font-weight: 600;
          color: #12314d;
        }
        .nb1-sum-divider {
          height: 1px;
          background: rgba(18, 49, 77, 0.1);
          margin: 14px 0;
        }
        .nb1-sum-price-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .nb1-sum-price-label {
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-sum-price {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .nb1-sum-price-big {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 25px;
          letter-spacing: -0.02em;
          color: #12314d;
          line-height: 1;
        }
        .nb1-sum-price-per {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.5);
        }
        .nb1-sum-edit {
          font-size: 12.5px;
          color: #0a8fb0;
          text-decoration: none;
          border-bottom: 1px solid rgba(10, 143, 176, 0.25);
        }
        .nb1-sum-zero {
          margin-top: 18px;
          background: rgba(10, 143, 176, 0.08);
          border-radius: 10px;
          padding: 12px;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: #0a8fb0;
        }
        .nb1-sum-note {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.45);
          line-height: 1.55;
          margin-top: 14px;
        }
        .nb1-sum-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          font-size: 12px;
          color: rgba(18, 49, 77, 0.45);
          border: none;
          border-radius: 0;
          background: none;
        }
        /* sidebar promo */
        .nb1-sum-promo-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #0a8fb0;
          padding: 12px 0 0;
          display: block;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(10, 143, 176, 0.3);
        }

        /* ── Legal footer ── */
        .nb1-det-legal {
          text-align: center;
          margin-top: 60px;
          font-size: 12px;
          color: rgba(18, 49, 77, 0.35);
        }
        .nb1-det-legal a {
          color: rgba(18, 49, 77, 0.45);
          text-decoration: none;
          margin: 0 6px;
        }

        /* ── Responsive ── */
        @media (max-width: 880px) {
          .nb1-det-grid {
            grid-template-columns: 1fr;
          }
          .nb1-det-right {
            position: static;
          }
        }
        @media (max-width: 560px) {
          .nb1-det-wrap {
            padding: 24px 16px 60px;
          }
          .nb1-frow {
            grid-template-columns: 1fr;
          }
          .nb1-wallet-row {
            grid-template-columns: 1fr;
          }
        }

        /* ── Phone input (react-phone-number-input overrides) ── */
        .nb1-phone-wrap .PhoneInput {
          display: flex;
          align-items: stretch;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          border-radius: 11px;
          background: #fff;
          overflow: hidden;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-phone-wrap .PhoneInput--focus {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.1);
        }
        .nb1-phone-wrap.err .PhoneInput {
          border-color: #c0392b;
        }
        .nb1-phone-wrap .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px 0 14px;
          border-right: 1.5px solid rgba(18, 49, 77, 0.08);
          background: rgba(18, 49, 77, 0.02);
          flex-shrink: 0;
          position: relative;
        }
        .nb1-phone-wrap .PhoneInputCountrySelect {
          position: absolute;
          inset: 0;
          opacity: 0;
          width: 100%;
          cursor: pointer;
        }
        .nb1-phone-wrap .PhoneInputCountryIcon {
          width: 22px;
          height: 16px;
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .nb1-phone-wrap .PhoneInputCountrySelectArrow {
          width: 5px;
          height: 5px;
          border-right: 1.5px solid rgba(18, 49, 77, 0.45);
          border-bottom: 1.5px solid rgba(18, 49, 77, 0.45);
          transform: rotate(45deg);
          margin-top: -3px;
          flex-shrink: 0;
        }
        .nb1-phone-wrap .PhoneInputInput {
          flex: 1;
          min-width: 0;
          padding: 13px 15px;
          border: none;
          outline: none;
          font-size: 15px;
          color: #12314d;
          font-family: 'Inter', sans-serif;
          background: transparent;
        }
        .nb1-phone-wrap .PhoneInputInput::placeholder {
          color: rgba(18, 49, 77, 0.35);
        }
      `}</style>

      {/* Hero */}
      <div className="nb1-det-hero">
        <h1>
          {t.hero.titlePrefix}
          <span>{t.hero.titleAccent}</span>
        </h1>
        <p>{t.hero.subtitle}</p>
      </div>

      <div className="nb1-det-grid">
        {/* ── Left: accordion form ── */}
        <div className="nb1-det-left">
          {/* Accordion 1 — Email */}
          <div
            ref={(el) => {
              accRefs.current[0] = el
            }}
            className={`nb1-acc${step === 1 ? ' open' : doneSteps.has(1) ? ' done' : ' locked'}`}
          >
            <div
              role="button"
              tabIndex={0}
              className="nb1-acc-hd"
              onClick={() => doneSteps.has(1) && setStep(1)}
            >
              <span className="nb1-acc-num">1</span>
              <span className="nb1-acc-title">{t.steps.email}</span>
              {doneSteps.has(1) && step !== 1 && (
                <>
                  <span className="nb1-acc-summary">{email}</span>
                  <button
                    type="button"
                    className="nb1-acc-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStep(1)
                    }}
                  >
                    {t.edit}
                  </button>
                </>
              )}
            </div>
            <div className="nb1-acc-body">
              <div className="nb1-frow full">
                <div className="nb1-fg">
                  <label htmlFor="nb1-email">{t.email.label}</label>
                  <input
                    id="nb1-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t.email.placeholder}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailSuggestion(null)
                    }}
                    onBlur={handleEmailBlur}
                    className={emailErr ? 'err' : ''}
                    onKeyDown={(e) => e.key === 'Enter' && nextEmail()}
                  />
                  {emailErr && <span className="nb1-err">{emailErr}</span>}
                  {!emailErr && emailSuggestion && (
                    <span className="nb1-suggest">
                      {t.email.typoSuggestion.replace('{domain}', emailSuggestion)}{' '}
                      <button type="button" onClick={applyEmailSuggestion}>
                        {t.email.useSuggestion}
                      </button>
                      <button
                        type="button"
                        className="nb1-suggest-dismiss"
                        aria-label="Dismiss"
                        onClick={() => setEmailSuggestion(null)}
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <span className="nb1-hint">{t.email.hint}</span>
                </div>
              </div>
              <button type="button" className="nb1-acc-next" onClick={nextEmail}>
                {t.next}
              </button>
            </div>
          </div>

          {/* Accordion 2 — Address */}
          <div
            ref={(el) => {
              accRefs.current[1] = el
            }}
            className={`nb1-acc${step === 2 ? ' open' : doneSteps.has(2) ? ' done' : ' locked'}`}
          >
            <div
              role="button"
              tabIndex={0}
              className="nb1-acc-hd"
              onClick={() => doneSteps.has(2) && setStep(2)}
            >
              <span className="nb1-acc-num">2</span>
              <span className="nb1-acc-title">{t.steps.address}</span>
              {doneSteps.has(2) && step !== 2 && (
                <>
                  <span className="nb1-acc-summary">
                    {fn} {ln}, {city}
                  </span>
                  <button
                    type="button"
                    className="nb1-acc-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStep(2)
                    }}
                  >
                    {t.edit}
                  </button>
                </>
              )}
            </div>
            <div className="nb1-acc-body">
              <div className="nb1-frow">
                <div className="nb1-fg">
                  <label htmlFor="nb1-fn">{t.address.firstName}</label>
                  <input
                    id="nb1-fn"
                    type="text"
                    autoComplete="given-name"
                    value={fn}
                    onChange={(e) => setFn(e.target.value)}
                    className={addrErr.fn ? 'err' : ''}
                  />
                  {addrErr.fn && <span className="nb1-err">{addrErr.fn}</span>}
                </div>
                <div className="nb1-fg">
                  <label htmlFor="nb1-ln">{t.address.lastName}</label>
                  <input
                    id="nb1-ln"
                    type="text"
                    autoComplete="family-name"
                    value={ln}
                    onChange={(e) => setLn(e.target.value)}
                    className={addrErr.ln ? 'err' : ''}
                  />
                  {addrErr.ln && <span className="nb1-err">{addrErr.ln}</span>}
                </div>
              </div>
              <div className="nb1-frow full">
                <div className="nb1-fg">
                  <label htmlFor="nb1-country">{t.address.country}</label>
                  <select
                    id="nb1-country"
                    value={country}
                    onChange={(e) => {
                      const next = e.target.value
                      setCountry(next)
                      // UAE has no postal codes, but the field is required → auto-fill 00000.
                      // Leaving AE drops that placeholder so a real code is entered.
                      if (COUNTRY_CODES[next] === 'AE') setZip('00000')
                      else if (zip === '00000') setZip('')
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {dict.countries[c] ?? c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="nb1-frow full">
                <div className="nb1-fg">
                  <label htmlFor="nb1-a1">{t.address.addressLabel}</label>
                  <AddressAutocomplete
                    id="nb1-a1"
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                    language={locale}
                    placeholder={t.address.addressPlaceholder}
                    value={a1}
                    onValueChange={(v) => {
                      setA1(v)
                      // Clearing the street invalidates the address → reset postal code + city
                      // and let autocomplete start fresh.
                      if (!v.trim()) {
                        // UAE keeps the 00000 placeholder (no postal codes); others clear.
                        setZip(COUNTRY_CODES[country] === 'AE' ? '00000' : '')
                        setCity('')
                        setA2('')
                      }
                    }}
                    onPick={handleAddressPick}
                    countries={
                      COUNTRY_CODES[country] ? [COUNTRY_CODES[country].toLowerCase()] : null
                    }
                    className={addrErr.a1 ? 'err' : ''}
                  />
                  {addrErr.a1 && <span className="nb1-err">{addrErr.a1}</span>}
                </div>
              </div>
              <div className="nb1-frow full">
                <div className="nb1-fg">
                  <label htmlFor="nb1-a2">
                    {t.address.apt}{' '}
                    <span style={{ fontWeight: 400, opacity: 0.6 }}>{t.address.optional}</span>
                  </label>
                  <input
                    id="nb1-a2"
                    type="text"
                    autoComplete="address-line2"
                    value={a2}
                    onChange={(e) => setA2(e.target.value)}
                  />
                </div>
              </div>
              <div className="nb1-frow">
                <div className="nb1-fg">
                  <label htmlFor="nb1-zip">{t.address.postalCode}</label>
                  <input
                    id="nb1-zip"
                    type="text"
                    autoComplete="postal-code"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className={addrErr.zip ? 'err' : ''}
                  />
                  {addrErr.zip && <span className="nb1-err">{addrErr.zip}</span>}
                </div>
                <div className="nb1-fg">
                  <label htmlFor="nb1-city">{t.address.city}</label>
                  <input
                    id="nb1-city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={addrErr.city ? 'err' : ''}
                  />
                  {addrErr.city && <span className="nb1-err">{addrErr.city}</span>}
                </div>
              </div>
              <div className="nb1-frow full">
                <div className="nb1-fg">
                  <label htmlFor="nb1-phone">
                    {t.address.phone}{' '}
                    <span style={{ fontWeight: 400, opacity: 0.6 }}>{t.address.phoneNote}</span>
                  </label>
                  <div className={`nb1-phone-wrap${addrErr.phone ? ' err' : ''}`}>
                    <PhoneInput
                      id="nb1-phone"
                      country={phoneCountry}
                      onCountryChange={(c) => setPhoneCountry(c ?? 'DE')}
                      value={phone}
                      onChange={(val) => setPhone(val ?? '')}
                      international
                      autoComplete="tel"
                      placeholder={t.address.phonePlaceholder}
                    />
                  </div>
                  {addrErr.phone && <span className="nb1-err">{addrErr.phone}</span>}
                </div>
              </div>
              <button type="button" className="nb1-acc-next" onClick={nextAddr}>
                {t.next}
              </button>
            </div>
          </div>

          {/* Accordion 3 — Shipping */}
          <div
            ref={(el) => {
              accRefs.current[2] = el
            }}
            className={`nb1-acc${step === 3 ? ' open' : doneSteps.has(3) ? ' done' : ' locked'}`}
          >
            <div
              role="button"
              tabIndex={0}
              className="nb1-acc-hd"
              onClick={() => doneSteps.has(3) && setStep(3)}
            >
              <span className="nb1-acc-num">3</span>
              <span className="nb1-acc-title">{t.steps.shipping}</span>
              {doneSteps.has(3) && step !== 3 && (
                <>
                  <span className="nb1-acc-summary">{shippingLabel}</span>
                  <button
                    type="button"
                    className="nb1-acc-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStep(3)
                    }}
                  >
                    {t.edit}
                  </button>
                </>
              )}
            </div>
            <div className="nb1-acc-body">
              <div className="nb1-ship-opts">
                <div className="nb1-ship-opt sel" onClick={() => setShipping('standard')}>
                  <div className="nb1-ship-radio">
                    <div className="nb1-ship-radio-dot" />
                  </div>
                  <div className="nb1-ship-info">
                    <div className="nb1-ship-name">{t.shipping.standardName}</div>
                    <div className="nb1-ship-sub">{t.shipping.standardSub}</div>
                  </div>
                  <div className="nb1-ship-price">{t.shipping.standardPrice}</div>
                </div>
              </div>
              <button type="button" className="nb1-acc-next" onClick={nextShipping}>
                {t.next}
              </button>
            </div>
          </div>

          {/* Accordion 4 — Payment */}
          <div
            ref={(el) => {
              accRefs.current[3] = el
            }}
            className={`nb1-acc${step === 4 ? ' open' : doneSteps.has(4) ? ' done' : ' locked'}`}
          >
            <div className="nb1-acc-hd">
              <span className="nb1-acc-num">4</span>
              <span className="nb1-acc-title">{t.steps.payment}</span>
            </div>
            <div className="nb1-acc-body">
              {walletAvailable && paymentRequest && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <PaymentRequestButtonElement
                      onClick={(event) => {
                        // Don't open the wallet sheet while earlier steps are invalid
                        if (!validateBeforePay(false)) event.preventDefault()
                      }}
                      options={{
                        paymentRequest,
                        style: { paymentRequestButton: { height: '48px' } },
                      }}
                    />
                  </div>
                  <div className="nb1-pay-divider" style={{ marginTop: 0 }}>
                    {t.payment.orPayAnotherWay}
                  </div>
                </>
              )}

              {/* Payment method list */}
              <div className="nb1-pmlist">
                {/* Card */}
                <div className={`nb1-pm-row${payMethod === 'card' ? ' active' : ''}`}>
                  <button type="button" className="nb1-pm-hd" onClick={() => setPayMethod('card')}>
                    <div className="nb1-pm-radio">
                      <div className="nb1-pm-radio-dot" />
                    </div>
                    {t.payment.card}
                    <div className="nb1-pm-icons">
                      <svg viewBox="0 0 38 24" width={32} height={20} rx="4">
                        <rect width={38} height={24} rx="4" fill="#1A1F71" />
                        <text
                          x="5"
                          y="17"
                          fill="#fff"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          VISA
                        </text>
                      </svg>
                      <svg viewBox="0 0 38 24" width={32} height={20}>
                        <rect width={38} height={24} rx="4" fill="#fff" stroke="#e0e0e0" />
                        <circle cx="15" cy="12" r="7" fill="#EB001B" />
                        <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                        <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
                      </svg>
                    </div>
                  </button>
                  <div className="nb1-pm-body">
                    <div className="nb1-frow full">
                      <div className="nb1-fg">
                        <label>{t.payment.nameOnCard}</label>
                        <input
                          type="text"
                          autoComplete="cc-name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className={payErr.cardName ? 'err' : ''}
                        />
                        {payErr.cardName && <span className="nb1-err">{payErr.cardName}</span>}
                      </div>
                    </div>
                    <div className="nb1-frow full">
                      <div className="nb1-fg">
                        <label>{t.payment.cardNumber}</label>
                        <div
                          style={{
                            padding: '13px 15px',
                            borderRadius: '11px',
                            border: `1.5px solid rgba(18,49,77,0.1)`,
                            background: '#fff',
                          }}
                        >
                          <CardElement
                            options={{
                              hidePostalCode: true,
                              style: {
                                base: {
                                  fontSize: '15px',
                                  color: '#12314d',
                                  fontFamily: 'Inter, sans-serif',
                                  '::placeholder': { color: 'rgba(18,49,77,0.35)' },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PayPal */}
                <div className={`nb1-pm-row${payMethod === 'paypal' ? ' active' : ''}`}>
                  <button
                    type="button"
                    className="nb1-pm-hd"
                    onClick={() => setPayMethod('paypal')}
                  >
                    <div className="nb1-pm-radio">
                      <div className="nb1-pm-radio-dot" />
                    </div>
                    <span style={{ color: '#003087', fontWeight: 700 }}>Pay</span>
                    <span style={{ color: '#009cde', fontWeight: 700 }}>Pal</span>
                  </button>
                  <div className="nb1-pm-body">
                    <p className="nb1-pm-note">{t.payment.paypalNote}</p>
                  </div>
                </div>

                {/* Klarna temporarily disabled: it cannot be charged off-session for recurring billing. */}
                {false && (
                <div className={`nb1-pm-row${payMethod === 'klarna' ? ' active' : ''}`}>
                  <button
                    type="button"
                    className="nb1-pm-hd"
                    onClick={() => setPayMethod('klarna')}
                  >
                    <div className="nb1-pm-radio">
                      <div className="nb1-pm-radio-dot" />
                    </div>
                    {t.payment.klarna} <span className="nb1-klarna-badge">Klarna</span>
                  </button>
                  <div className="nb1-pm-body">
                    <p className="nb1-pm-note">{t.payment.klarnaNote}</p>
                  </div>
                </div>
                )}

                {/* SEPA */}
                {/* <div className={`nb1-pm-row${payMethod === 'sepa' ? ' active' : ''}`}>
                  <button type="button" className="nb1-pm-hd" onClick={() => setPayMethod('sepa')}>
                    <div className="nb1-pm-radio"><div className="nb1-pm-radio-dot" /></div>
                    {t.payment.sepa}
                  </button>
                  <div className="nb1-pm-body">
                    <div className="nb1-frow full">
                      <div className="nb1-fg">
                        <label>{t.payment.iban}</label>
                        <input type="text" placeholder={t.payment.ibanPlaceholder} value={iban} onChange={e => setIban(fmtIban(e.target.value))} className={payErr.iban ? 'err' : ''} />
                        {payErr.iban && <span className="nb1-err">{payErr.iban}</span>}
                      </div>
                    </div>
                    <div className="nb1-frow full">
                      <div className="nb1-fg">
                        <label>{t.payment.accountHolder}</label>
                        <input type="text" autoComplete="name" value={ibanName} onChange={e => setIbanName(e.target.value)} className={payErr.ibanName ? 'err' : ''} />
                        {payErr.ibanName && <span className="nb1-err">{payErr.ibanName}</span>}
                      </div>
                    </div>
                    <p className="nb1-pm-note" style={{fontSize:'12px',marginTop:8}}>{t.payment.sepaConsent}</p>
                  </div>
                </div> */}
              </div>

              {/* Billing address */}
              <label className="nb1-billing-check">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                />
                {t.payment.billingSame}
              </label>
              {!billingSame && (
                <div className="nb1-billing-addr">
                  {/* Address type toggle */}
                  <div
                    className="nb1-frow"
                    style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}
                  >
                    {(['individual', 'company'] as const).map((type) => (
                      <div
                        key={type}
                        className={`nb1-ship-opt${bAddrType === type ? ' sel' : ''}`}
                        onClick={() => setBAddrType(type)}
                        style={{ padding: '12px 16px' }}
                      >
                        <div className="nb1-ship-radio">
                          <div className="nb1-ship-radio-dot" />
                        </div>
                        <span className="nb1-ship-name" style={{ fontSize: 14 }}>
                          {type === 'individual'
                            ? t.payment.billingIndividual
                            : t.payment.billingCompany}
                        </span>
                      </div>
                    ))}
                  </div>

                  {bAddrType === 'company' && (
                    <>
                      <div className="nb1-frow full">
                        <div className="nb1-fg">
                          <label>{t.payment.companyName}</label>
                          <input
                            type="text"
                            autoComplete="organization"
                            value={bCompany}
                            onChange={(e) => setBCompany(e.target.value)}
                            className={payErr.bCompany ? 'err' : ''}
                          />
                          {payErr.bCompany && <span className="nb1-err">{payErr.bCompany}</span>}
                        </div>
                      </div>
                      <div className="nb1-frow">
                        <div className="nb1-fg">
                          <label>{t.payment.taxId}</label>
                          <input
                            type="text"
                            value={bTaxId}
                            onChange={(e) => setBTaxId(e.target.value)}
                          />
                        </div>
                        <div className="nb1-fg">
                          <label>{t.payment.registrationNumber}</label>
                          <input
                            type="text"
                            value={bRegNum}
                            onChange={(e) => setBRegNum(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="nb1-frow">
                    <div className="nb1-fg">
                      <label>{t.address.firstName}</label>
                      <input
                        type="text"
                        autoComplete="billing given-name"
                        value={bFn}
                        onChange={(e) => setBFn(e.target.value)}
                        className={payErr.bFn ? 'err' : ''}
                      />
                      {payErr.bFn && <span className="nb1-err">{payErr.bFn}</span>}
                    </div>
                    <div className="nb1-fg">
                      <label>{t.address.lastName}</label>
                      <input
                        type="text"
                        autoComplete="billing family-name"
                        value={bLn}
                        onChange={(e) => setBLn(e.target.value)}
                        className={payErr.bLn ? 'err' : ''}
                      />
                      {payErr.bLn && <span className="nb1-err">{payErr.bLn}</span>}
                    </div>
                  </div>
                  <div className="nb1-frow">
                    <div className="nb1-fg">
                      <label>{t.email.label}</label>
                      <input
                        type="email"
                        autoComplete="billing email"
                        value={bEmail}
                        onChange={(e) => {
                          setBEmail(e.target.value)
                          setBEmailSuggestion(null)
                        }}
                        onBlur={handleBEmailBlur}
                        className={payErr.bEmail ? 'err' : ''}
                      />
                      {payErr.bEmail && <span className="nb1-err">{payErr.bEmail}</span>}
                      {!payErr.bEmail && bEmailSuggestion && (
                        <span className="nb1-suggest">
                          {t.email.typoSuggestion.replace('{domain}', bEmailSuggestion)}{' '}
                          <button type="button" onClick={applyBEmailSuggestion}>
                            {t.email.useSuggestion}
                          </button>
                          <button
                            type="button"
                            className="nb1-suggest-dismiss"
                            aria-label="Dismiss"
                            onClick={() => setBEmailSuggestion(null)}
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                    <div className="nb1-fg">
                      <label>
                        {t.address.phone}{' '}
                        <span style={{ fontWeight: 400, opacity: 0.6 }}>{t.address.phoneNote}</span>
                      </label>
                      <div className={`nb1-phone-wrap${payErr.bPhone ? ' err' : ''}`}>
                        <PhoneInput
                          country={bPhoneCountry}
                          onCountryChange={(c) => setBPhoneCountry(c ?? 'DE')}
                          value={bPhone}
                          onChange={(val) => setBPhone(val ?? '')}
                          international
                          autoComplete="billing tel"
                          placeholder={t.address.phonePlaceholder}
                        />
                      </div>
                      {payErr.bPhone && <span className="nb1-err">{payErr.bPhone}</span>}
                    </div>
                  </div>
                  <div className="nb1-frow full">
                    <div className="nb1-fg">
                      <label>{t.address.country}</label>
                      <select
                        autoComplete="billing country-name"
                        value={bCountry}
                        onChange={(e) => setBCountry(e.target.value)}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {dict.countries[c] ?? c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="nb1-frow full">
                    <div className="nb1-fg">
                      <label>{t.address.addressLabel}</label>
                      <input
                        type="text"
                        autoComplete="billing address-line1"
                        placeholder={t.address.addressPlaceholder}
                        value={bA1}
                        onChange={(e) => setBA1(e.target.value)}
                        className={payErr.bA1 ? 'err' : ''}
                      />
                      {payErr.bA1 && <span className="nb1-err">{payErr.bA1}</span>}
                    </div>
                  </div>
                  <div className="nb1-frow full">
                    <div className="nb1-fg">
                      <label>
                        {t.address.apt}{' '}
                        <span style={{ fontWeight: 400, opacity: 0.6 }}>{t.address.optional}</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="billing address-line2"
                        value={bA2}
                        onChange={(e) => setBA2(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="nb1-frow">
                    <div className="nb1-fg">
                      <label>{t.address.postalCode}</label>
                      <input
                        type="text"
                        autoComplete="billing postal-code"
                        value={bZip}
                        onChange={(e) => setBZip(e.target.value)}
                        className={payErr.bZip ? 'err' : ''}
                      />
                      {payErr.bZip && <span className="nb1-err">{payErr.bZip}</span>}
                    </div>
                    <div className="nb1-fg">
                      <label>{t.address.city}</label>
                      <input
                        type="text"
                        autoComplete="billing address-level2"
                        value={bCity}
                        onChange={(e) => setBCity(e.target.value)}
                        className={payErr.bCity ? 'err' : ''}
                      />
                      {payErr.bCity && <span className="nb1-err">{payErr.bCity}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Secure */}
              <div className="nb1-secure">
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="#0a8fb0"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t.secured}
              </div>

              {/* Promo in form */}
              <button
                type="button"
                className="nb1-promo-toggle"
                onClick={() => setPromoOpenForm((o) => !o)}
              >
                {promoApplied ? t.promoUi.changeCode : t.promoUi.addCode}
              </button>
              {promoOpenForm && (
                <div>
                  <div className="nb1-promo-row">
                    <input
                      className="nb1-promo-input"
                      placeholder={t.promoUi.placeholder}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void applyPromo()
                      }}
                    />
                    <button
                      type="button"
                      className="nb1-promo-apply"
                      onClick={() => void applyPromo()}
                      disabled={promoLoading}
                    >
                      {promoLoading ? '…' : t.promoUi.apply}
                    </button>
                  </div>
                  {promoMsg && (
                    <div className={`nb1-promo-msg${promoMsg.ok ? ' ok' : ' err'}`}>
                      {promoMsg.text}
                    </div>
                  )}
                  {promoApplied && (
                    <button
                      type="button"
                      style={{
                        fontSize: '12px',
                        color: 'rgba(18,49,77,0.5)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                      }}
                      onClick={removePromo}
                    >
                      {t.promoUi.removeCode}
                    </button>
                  )}
                </div>
              )}

              {/* Confirm */}
              {accountErr && (
                <p style={{ color: '#c0392b', fontSize: '13px', marginTop: 12 }}>{accountErr}</p>
              )}
              {/* Stays clickable while the form is incomplete on purpose: the
                  click runs validateBeforePay, which opens the first invalid
                  section and shows what's missing. Only disabled while sending. */}
              <button
                type="button"
                className="nb1-confirm-btn"
                onClick={nextPayment}
                disabled={accountStatus === 'sending'}
                style={
                  accountStatus === 'sending' ? { opacity: 0.65, cursor: 'not-allowed' } : undefined
                }
              >
                {accountStatus === 'sending' ? t.confirm.processing : confirmLabel}
              </button>
              <p className="nb1-confirm-legal">
                {t.confirm.legalPrefix} <a href="#">{t.confirm.terms}</a> {t.confirm.and}{' '}
                <a href="#">{t.confirm.privacyPolicy}</a>
                {t.confirm.legalMid}
                <strong>{t.confirm.feeBold}</strong> {t.confirm.legalEnd}
              </p>
            </div>
          </div>

          {/* What's next */}
          <div className="nb1-whats-next">
            <div className="nb1-whats-next-h">{t.whatsNext.heading}</div>
            <ol>
              <li>{t.whatsNext.step1}</li>
              <li>{t.whatsNext.step2}</li>
              <li>{t.whatsNext.step3}</li>
            </ol>
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div className="nb1-det-right">
          <div className="nb1-sum">
            <div className="nb1-sum-title">{t.summary.title}</div>
            <div className="nb1-sum-rows">
              <div className="nb1-sum-row">
                <span className="nb1-sum-label">{t.summary.plan}</span>
                <span className="nb1-sum-val">{planLabel}</span>
              </div>
              <div className="nb1-sum-row">
                <span className="nb1-sum-label">{t.summary.duration}</span>
                <span className="nb1-sum-val">{planInfo.label}</span>
              </div>
              <div className="nb1-sum-row">
                <span className="nb1-sum-label">{t.summary.billing}</span>
                <span className="nb1-sum-val">{planInfo.billing}</span>
              </div>
              <div className="nb1-sum-row">
                <span className="nb1-sum-label">{t.summary.shipping}</span>
                <span className="nb1-sum-val">{shippingLabel}</span>
              </div>
            </div>
            <div className="nb1-sum-divider" />
            <div className="nb1-sum-price-row">
              <span className="nb1-sum-price-label">{t.summary.monthly}</span>
              <div className="nb1-sum-price">
                <span
                  className="nb1-sum-price-big"
                  style={
                    promoPreview
                      ? { textDecoration: 'line-through', opacity: 0.45, fontSize: '1rem' }
                      : undefined
                  }
                >
                  {promoPreview ? fmt(promoPreview.monthly_price) : planInfo.rate}
                </span>
                <span className="nb1-sum-price-per">{dict.plans.perMonth}</span>
              </div>
            </div>
            {promoPreview && (
              <>
                <div
                  className="nb1-sum-row"
                  style={{ color: '#0a8fb0', fontWeight: 600, marginTop: 4 }}
                >
                  <span className="nb1-sum-label">{t.promoUi.discount ?? 'Discount'}</span>
                  <span className="nb1-sum-val">−{fmt(promoPreview.promo_discount)}</span>
                </div>
                <div className="nb1-sum-price-row" style={{ marginTop: 4 }}>
                  <span className="nb1-sum-price-label">
                    {t.promoUi.firstMonth ?? 'First month'}
                  </span>
                  <div className="nb1-sum-price">
                    <span className="nb1-sum-price-big" style={{ color: '#0a8fb0' }}>
                      {fmt(promoPreview.first_month_price)}
                    </span>
                    <span className="nb1-sum-price-per">{dict.plans.perMonth}</span>
                  </div>
                </div>
              </>
            )}
            <a href={orderHref} className="nb1-sum-edit">
              {t.summary.editLink}
            </a>
            {/* Sidebar promo */}
            <button
              type="button"
              className="nb1-sum-promo-toggle"
              onClick={() => setPromoOpenSidebar((o) => !o)}
            >
              {promoApplied
                ? t.promoUi.appliedSuffix.replace('{code}', promoApplied)
                : t.promoUi.addCode}
            </button>
            {promoOpenSidebar && (
              <div style={{ marginTop: 8 }}>
                <div className="nb1-promo-row">
                  <input
                    className="nb1-promo-input"
                    placeholder={t.promoUi.placeholder}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void applyPromo()
                    }}
                  />
                  <button type="button" className="nb1-promo-apply" onClick={applyPromo}>
                    {t.promoUi.apply}
                  </button>
                </div>
                {promoMsg && (
                  <div className={`nb1-promo-msg${promoMsg.ok ? ' ok' : ' err'}`}>
                    {promoMsg.text}
                  </div>
                )}
              </div>
            )}

            <div className="nb1-sum-zero">{t.summary.dueToday.replace('{zeroPrice}', zero)}</div>
            <p className="nb1-sum-note">{t.summary.note}</p>
          </div>
          <div className="nb1-sum-secure">
            <svg
              viewBox="0 0 24 24"
              width={13}
              height={13}
              fill="none"
              stroke="#0a8fb0"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {t.secured}
          </div>
        </div>
      </div>

      {/* Legal footer */}
      <div className="nb1-det-legal">
        <a href={`https://nb1.com/${locale || 'en'}/privacy-policy`}>{t.legal.privacy}</a>·
        <a href={`https://nb1.com/${locale || 'en'}/terms-conditions`}>{t.legal.terms}</a>·
        <a href={`https://nb1.com/${locale || 'en'}/imprint`}>{t.legal.imprint}</a>·
        <a href="#">{t.legal.gdpr}</a>· {t.legal.copyright}
      </div>
    </div>
  )
}

/* ── Exported wrapper (Elements + Suspense for useSearchParams) ─────── */
export const CheckoutFormClient: React.FC<Props> = (props) => (
  <Elements stripe={stripePromise}>
    <Suspense fallback={null}>
      <CheckoutFormInner {...props} />
    </Suspense>
  </Elements>
)
