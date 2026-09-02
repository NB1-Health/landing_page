/**
 * Italian UI strings.
 *
 * Translated from the IT column of "NB1 Website - Final IT.xlsx" (matched on the
 * English source text). 101 of 197 keys are translated; 6 are identical in Italian
 * (Email, CVC, IBAN, GDPR, ©-line, Privacy).
 *
 * The remaining keys are still the English copy from en.ts — either absent from the
 * workbook, or present only inside a longer combined row that the code splits across
 * several keys (e.g. "Phone (for delivery updates)" is one workbook row but two keys
 * here). Those need a human split rather than a guess. /it renders English for them.
 */
export const it = {
  header: {
    language: 'Lingua',
    currency: 'Valuta',
    apply: 'Applica',
    onThisPage: 'On this page',
  },
  theCase: {
    readMore: 'Scopri di più',
    back: 'Indietro',
  },
  gutFirst: {
    revealsLabel: 'Cosa rivela il tuo intestino',
    yourGut: 'Il tuo intestino',
  },
  twoModels: {
    theyLabel: 'Tutti gli altri',
  },
  keyTakeaways: {
    heading: 'Key Takeaways',
  },
  disclaimer: {
    text: 'The insights provided by the NB1 Microbiome Test are for informational purposes only and do not substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions regarding a medical condition or before making changes to your diet or supplement routine.',
  },
  faq: {
    heading: 'Frequently asked questions',
  },
  dataTable: {
    glossary: {
      termHeader: 'Term',
      definitionHeader: 'What it means',
    },
  },
  cta: {
    heading: 'Elevate Your Biology',
    buttonText: 'Order Your NB1 Microbiome Discovery Kit',
  },
  forms: {
    thankYouRegistering: 'Thank you for registering!',
    contactMessagePlaceholder: 'How can we help?',
    contactSubmit: 'Send message',
    contactSending: 'Sending…',
  },
  scienceBoard: {
    viewBio: 'Vedi profilo',
  },
  plans: {
    months: { 1: '1 month', 4: '4 months', 12: '12 months' } as Record<1 | 4 | 12, string>,
    perMonth: '/mese',
    savingsPrefix: 'Save',
    savingsSuffix: '/ cycle',
    bestValue: 'Più conveniente',
    compareShow: 'Confronta Core e Advanced nel dettaglio',
    compareHide: 'Nascondi confronto completo',
    guaranteeBilledMonthly: 'Billed monthly.',
    guaranteeNoUpfront: 'Nessun pagamento anticipato.',
    guaranteePayNothing: 'Non paghi nulla finché la tua formula non è pronta.',
  },
  countries: {
    Germany: 'Germany',
    Austria: 'Austria',
    Netherlands: 'Netherlands',
    Belgium: 'Belgium',
    France: 'France',
    Luxembourg: 'Luxembourg',
    Ireland: 'Ireland',
    'United Kingdom': 'United Kingdom',
    'United Arab Emirates': 'United Arab Emirates',
    Switzerland: 'Switzerland',
    Romania: 'Romania',
  } as Record<string, string>,
  promo: {
    codes: {
      WELCOME10: '10% off your first cycle',
      NB1: '15% off your first cycle',
      HYROX: '20% off your first cycle',
      FREEMONTH: 'First month free',
      FIRSTMONTHFREE: 'First month free',
    } as Record<string, string>,
    appliedTemplate: '✓ {code} applied.',
    invalid: "That code isn't valid.",
    // Localised versions of the free-text messages the checkout API returns for
    // a discount code (both rejections and the success confirmation). The
    // backend sends no machine code, so applyPromo maps its English message text
    // to these keys. Add an entry here — in EVERY locale — for each backend
    // message you want translated; anything unmapped falls back to the generic
    // localised text for that branch.
    messages: {
      notFound: 'Discount code not found.',
      valid: 'Discount code is valid.',
      referralFirstMonthFree: '✓ First month free with your referral code.',
    } as Record<string, string>,
  },
  checkout: {
    hero: {
      titlePrefix: 'Almost ',
      titleAccent: 'there.',
      subtitle:
        'Your email, your address, how it ships, and payment, all here. Nothing is charged today.',
    },
    steps: {
      email: 'La tua email',
      address: 'Dove inviare il tuo kit',
      shipping: 'Opzioni di spedizione',
      payment: 'Pagamento',
    },
    next: 'Avanti →',
    edit: 'Modifica',
    required: 'Obbligatorio.',
    nameInvalid: 'Enter a valid name.',
    email: {
      label: 'Email',
      placeholder: 'tu@email.com',
      hint: "We'll create your account and send kit tracking + results here. You'll set a password when your kit arrives.",
      invalid: 'Inserisci un indirizzo email valido.',
      typoSuggestion: 'Did you mean {domain}?',
      useSuggestion: 'Use this',
    },
    address: {
      firstName: 'Nome',
      lastName: 'Cognome',
      country: 'Paese',
      addressLabel: 'Indirizzo',
      addressPlaceholder: 'Via e numero civico',
      apt: 'Apartment, suite, etc.',
      optional: '(optional)',
      postalCode: 'CAP',
      city: 'Città',
      phone: 'Phone',
      phoneNote: '(for delivery updates)',
      phonePlaceholder: '+39 …',
      phoneInvalid: 'Enter a valid phone number for the selected country.',
    },
    shipping: {
      standardName: 'Standard',
      standardSub: '3–5 working days · tracked',
      standardPrice: 'Free',
      expressName: 'Express',
      expressSub: '1–2 working days · tracked',
      expressPrice: '€9',
    },
    payment: {
      applePay: 'Apple Pay',
      googlePay: 'Pay',
      orPayAnotherWay: 'o paga in un altro modo',
      card: 'Carta',
      cardNumber: 'Numero della carta',
      cardNumberInvalid: 'Inserisci un numero di carta valido.',
      expiry: 'Scadenza',
      expiryFormat: 'MM / YY.',
      cvc: 'CVC',
      cvcDigits: '3–4 digits.',
      nameOnCard: 'Nome sulla carta',
      paypalNote:
        "You'll be redirected to PayPal to approve your plan. Nothing is charged today — your first payment is taken only when your formula is manufactured.",
      klarna: 'Klarna',
      klarnaNote:
        "Pay with Klarna on invoice or instant bank transfer. You'll approve in Klarna — your first charge is taken only at manufacture.",
      sepa: 'SEPA Direct Debit',
      iban: 'IBAN',
      ibanPlaceholder: 'DE00 0000 0000 0000 0000 00',
      ibanInvalid: 'Inserisci un IBAN valido.',
      accountHolder: 'Intestatario del conto',
      sepaConsent:
        'By providing your IBAN you authorise NB1 and Stripe to debit your account by SEPA Direct Debit, beginning only when your formula is manufactured.',
      billingSame: 'Indirizzo di fatturazione uguale a quello di consegna',
      streetNumber: 'Via e numero',
      billingIndividual: 'Individual',
      billingCompany: 'Company',
      companyName: 'Company name',
      taxId: 'VAT / Tax ID',
      registrationNumber: 'Registration number',
    },
    secured: 'Protetto da Stripe',
    promoUi: {
      switchTemplate: 'Change to {plan} {duration} · {price}/mo',
      excludeOneMonth: 'This code can only be used on 4 or 12-month plans.',
      addCode: 'Aggiungi codice sconto',
      changeCode: 'Cambia codice',
      removeCode: 'Rimuovi',
      placeholder: 'Discount code',
      apply: 'Applica',
      appliedSuffix: '{code} applied',
      discount: 'Sconto',
      firstMonth: 'First month',
    },
    confirm: {
      label: 'Confirm — {zeroPrice} due today',
      paypal: 'Continua con PayPal →',
      klarna: 'Continua con Klarna →',
      processing: 'Processing…',
      legalPrefix: 'By confirming you agree to our',
      terms: 'Condizioni generali',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      legalMid:
        ', and consent to NB1 processing your biological sample. Your first charge is around two weeks after you return your sample, only once your formula enters manufacture. A one-time ',
      feeBold: '€49 fee',
      legalEnd: "applies only if your sample isn't returned within 4 weeks.",
      accountExists: 'An account with this email already exists. Please sign in instead.',
      accountError: 'Could not create your account. Please try again.',
      checkDetails: 'Please check your details and try again.',
      orderError: "We couldn't complete your order:",
    },
    whatsNext: {
      heading: 'Cosa succede dopo',
      step1:
        'Your kit ships, a two-minute gut sample, sealed in its bag and posted back in the box it came in.',
      step2: 'Lo analizziamo tramite sequenziamento e il nostro team scientifico valida la tua formula.',
      step3: 'Scatta il primo addebito, dopodiché la tua formula esclusiva viene spedita.',
    },
    summary: {
      title: 'Il tuo ordine',
      plan: 'Piano',
      duration: 'Durata',
      billing: 'Fatturazione',
      billingMonthly: 'Billed monthly',
      cancelAnytime: 'Disdici quando vuoi',
      shipping: 'Shipping',
      monthly: 'Mensile',
      editLink: 'Modifica piano o durata',
      dueToday: '{zeroPrice} due today',
      note: 'Your first charge is around two weeks after you return your sample, only once your formula enters manufacture.',
    },
    done: {
      heading: "You're in",
      body: "Your kit's on its way. We won't charge you anything yet, your first payment only happens once your formula's being made.",
      eyebrow: 'Order',
      inboxTitle: 'Controlla la posta',
      inboxBody:
        "We've sent your confirmation to {email}. Open it to set your password and access your dashboard.",
      dashboard: 'Vai alla mia dashboard →',
      trackOrder: 'Traccia l’ordine',
      helpLink: 'Serve aiuto?',
      failed: {
        heading: "Payment didn't go through",
        body: 'Something went wrong with your payment. No charge was made. Please try again or get in touch.',
        retry: 'Try again →',
        help: 'Serve aiuto?',
      },
      supportLine: 'or',
      supportEmail: 'support@nb1.com',
      chatUs: '💬 Chatta con noi',
      survey: {
        eyebrow: 'Aiutaci a crescere',
        question: 'Come hai scoperto NB1?',
        sub: 'Un tocco, ci aiuta a raggiungere più persone come te.',
        thanks: 'Fatto, grazie.',
        thanksSub: 'Questo ci aiuta a raggiungere più persone come te.',
        whichOne: 'Quale?',
        whichSub: 'Facoltativo — tocca per essere più preciso.',
        somethingElse: 'Something else',
        placeholder: 'Dicci dove…',
        send: 'Invia',
        skip: 'Salta',
      },
      timeline: {
        heading: 'Cosa succede dopo',
        step1: {
          label: 'Oggi',
          title: 'Ordine confermato',
          body: "Check your inbox, we've emailed your receipt and a link to set your password and follow your kit's tracking.",
        },
        step2: {
          label: '~3 giorni',
          title: 'Arriva il tuo kit',
          body: 'Un campione intestinale da raccogliere in due minuti, sigillato nella sua bustina e rispedito nella sua scatola, a cui si aggiunge un rapido questionario medico da compilare online.',
        },
        step3: {
          label: 'Settimane 1–2',
          title: 'Sequenziamo il tuo campione',
          body: 'Analizziamo i dati a livello di specie, dopodiché il nostro team scientifico elabora la bozza della tua formula personalizzata.',
        },
        step4: {
          label: 'Settimana 3',
          title: 'Formula approvata · primo addebito',
          badge: 'Primo addebito',
          body: 'La tua formula viene validata e il tuo primo pagamento viene effettuato solo ora, non appena entra in produzione. Mai un momento prima.',
        },
        step5: {
          label: 'Settimana 4',
          title: 'La tua formula viene spedita',
          body: 'I componenti Activate, Restore e Nourish, confezionati in comodi blister da 30 giorni e pronti da portare con te. Inizia ufficialmente il tuo primo ciclo.',
        },
      },
      summary: {
        heading: 'Riepilogo ordine',
        plan: 'Piano',
        cycle: 'Ciclo',
        delivery: 'Consegna',
        deliveryValue: 'Tracked · free',
        monthly: 'Mensile',
        dueToday: '€0 addebitati oggi',
        chargeNote: 'First charge {when}.',
        chargeWhen: 'when your formula goes into manufacture',
      },
    },
    legal: {
      privacy: 'Privacy',
      terms: 'Condizioni generali',
      imprint: 'Note legali',
      gdpr: 'GDPR',
      copyright: '© NB1 Health GmbH 2026',
    },
  },
}
