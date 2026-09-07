/**
 * Italian UI strings.
 *
 * Translated from the IT columns of "NB1 Website - Final IT.xlsx" and the
 * follow-up "NB1 Website Missing Strings - IT locale - Final.xlsx", matched on
 * the English source text. 175 of 201 keys are translated.
 *
 * The 26 values still equal to English are intentional: 12 are the same word in
 * Italian (Email, CVC, IBAN, GDPR, Klarna, Privacy, Standard, Express, Austria,
 * Romania, the copyright line, the support address), 11 are keys nothing in the
 * codebase reads, and 3 were deliberately left (an example IBAN, the express
 * price, and the referral promo message).
 */
export const it = {
  header: {
    language: 'Lingua',
    currency: 'Valuta',
    apply: 'Applica',
    onThisPage: 'In questa pagina',
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
    heading: 'Punti chiave',
  },
  disclaimer: {
    text: 'Le informazioni del NB1 Microbiome Test sono solo a scopo informativo e non sostituiscono il parere, la diagnosi o il trattamento di un professionista sanitario. In caso di dubbi su una condizione di salute, o prima di modificare la dieta o l’assunzione di integratori, chiedi sempre consiglio a un professionista sanitario qualificato.',
  },
  faq: {
    heading: 'Domande frequenti',
  },
  dataTable: {
    glossary: {
      termHeader: 'Termine',
      definitionHeader: 'Significato',
    },
  },
  cta: {
    heading: 'Potenzia la tua biologia',
    buttonText: 'Ordina il tuo kit NB1 Microbiome Discovery',
  },
  forms: {
    thankYouRegistering: 'Grazie per la registrazione!',
    contactMessagePlaceholder: 'Come possiamo aiutarti?',
    contactSubmit: 'Invia messaggio',
    contactSending: 'Invio in corso…',
  },
  scienceBoard: {
    viewBio: 'Vedi profilo',
  },
  plans: {
    months: { 1: '1 month', 4: '4 months', 12: '12 months' } as Record<1 | 4 | 12, string>,
    perMonth: '/mese',
    savingsPrefix: 'Risparmia',
    savingsSuffix: '/ ciclo',
    bestValue: 'Più conveniente',
    compareShow: 'Confronta Core e Advanced nel dettaglio',
    compareHide: 'Nascondi confronto completo',
    guaranteeBilledMonthly: 'Fatturazione mensile.',
    guaranteeNoUpfront: 'Nessun pagamento anticipato.',
    guaranteePayNothing: 'Non paghi nulla finché la tua formula non è pronta.',
  },
  countries: {
    Germany: 'Germania',
    Austria: 'Austria',
    Netherlands: 'Paesi Bassi',
    Belgium: 'Belgio',
    France: 'Francia',
    Luxembourg: 'Lussemburgo',
    Ireland: 'Irlanda',
    'United Kingdom': 'Regno Unito',
    'United Arab Emirates': 'Emirati Arabi Uniti',
    Switzerland: 'Svizzera',
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
    appliedTemplate: '✓ {code} applicato.',
    invalid: "That code isn't valid.",
    // Localised versions of the free-text messages the checkout API returns for
    // a discount code (both rejections and the success confirmation). The
    // backend sends no machine code, so applyPromo maps its English message text
    // to these keys. Add an entry here — in EVERY locale — for each backend
    // message you want translated; anything unmapped falls back to the generic
    // localised text for that branch.
    messages: {
      notFound: 'Codice sconto non trovato.',
      valid: 'Il codice sconto è valido.',
      referralFirstMonthFree: '✓ First month free with your referral code.',
    } as Record<string, string>,
  },
  checkout: {
    hero: {
      titlePrefix: 'Ci siamo ',
      titleAccent: 'quasi.',
      subtitle:
        'La tua email, il tuo indirizzo, i dettagli di spedizione e il metodo di pagamento: inserisci tutto qui. Oggi non ti verrà addebitato nulla.',
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
    nameInvalid: 'Inserisci un nome valido.',
    email: {
      label: 'Email',
      placeholder: 'tu@email.com',
      hint: "We'll create your account and send kit tracking + results here. You'll set a password when your kit arrives.",
      invalid: 'Inserisci un indirizzo email valido.',
      typoSuggestion: 'Intendevi {domain}?',
      useSuggestion: 'Usa questo',
    },
    address: {
      firstName: 'Nome',
      lastName: 'Cognome',
      country: 'Paese',
      addressLabel: 'Indirizzo',
      addressPlaceholder: 'Via e numero civico',
      apt: 'Appartamento, interno, ecc.',
      optional: '(facoltativo)',
      postalCode: 'CAP',
      city: 'Città',
      phone: 'Telefono',
      phoneNote: '(per aggiornamenti sulla consegna)',
      phonePlaceholder: '+39 …',
      phoneInvalid: 'Inserisci un numero di telefono valido per il Paese selezionato.',
    },
    shipping: {
      standardName: 'Standard',
      standardSub: '3-5 giorni lavorativi · con tracciamento',
      standardPrice: 'Gratis',
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
      sepa: 'Addebito diretto SEPA',
      iban: 'IBAN',
      ibanPlaceholder: 'DE00 0000 0000 0000 0000 00',
      ibanInvalid: 'Inserisci un IBAN valido.',
      accountHolder: 'Intestatario del conto',
      sepaConsent:
        'Fornendo il tuo IBAN, autorizzi NB1 e Stripe a inviare disposizioni alla tua banca per addebitare il tuo conto tramite addebito diretto SEPA, a partire solo da quando la tua formula viene prodotta.',
      billingSame: 'Indirizzo di fatturazione uguale a quello di consegna',
      streetNumber: 'Via e numero',
      billingIndividual: 'Privato',
      billingCompany: 'Azienda',
      companyName: 'Ragione sociale',
      taxId: 'Partita IVA / Codice fiscale',
      registrationNumber: 'Numero di registrazione',
    },
    secured: 'Protetto da Stripe',
    promoUi: {
      switchTemplate: 'Passa a {plan} {duration} · {price}/mese',
      excludeOneMonth: 'Questo codice è valido solo per gli abbonamenti di 4 o 12 mesi.',
      addCode: 'Aggiungi codice sconto',
      changeCode: 'Cambia codice',
      removeCode: 'Rimuovi',
      placeholder: 'Codice sconto',
      apply: 'Applica',
      appliedSuffix: '{code} applicato',
      discount: 'Sconto',
      firstMonth: 'Primo mese',
    },
    confirm: {
      label: 'Conferma: {zeroPrice} da pagare oggi',
      paypal: 'Continua con PayPal →',
      klarna: 'Continua con Klarna →',
      processing: 'Elaborazione…',
      legalPrefix: 'Confermando, accetti le nostre',
      terms: 'Condizioni generali',
      and: 'e',
      privacyPolicy: 'Informativa sulla privacy',
      legalMid:
        ', e acconsenti al trattamento del tuo campione biologico da parte di NB1. Il primo addebito avverrà circa due settimane dopo la restituzione del campione, solo quando la tua formula entra in produzione. Una tariffa una tantum di',
      feeBold: 'Costo di 49 €',
      legalEnd: "applies only if your sample isn't returned within 4 weeks.",
      accountExists: 'Esiste già un account con questa email. Accedi.',
      accountError: 'Non siamo riusciti a creare il tuo account. Riprova.',
      checkDetails: 'Controlla i dati e riprova.',
      orderError: "We couldn't complete your order:",
    },
    whatsNext: {
      heading: 'Cosa succede dopo',
      step1:
        'Ti spediamo il kit: un campione intestinale da raccogliere in due minuti, sigillato nell\'apposita bustina e rispedito nella sua scatola originale.',
      step2: 'Lo analizziamo tramite sequenziamento e il nostro team scientifico valida la tua formula.',
      step3: 'Scatta il primo addebito, dopodiché la tua formula esclusiva viene spedita.',
    },
    summary: {
      title: 'Il tuo ordine',
      plan: 'Piano',
      duration: 'Durata',
      billing: 'Fatturazione',
      billingMonthly: 'Fatturazione mensile',
      cancelAnytime: 'Disdici quando vuoi',
      shipping: 'Spedizione',
      monthly: 'Mensile',
      editLink: 'Modifica piano o durata',
      dueToday: '{zeroPrice} da pagare oggi',
      note: 'Il primo addebito avverrà circa due settimane dopo la restituzione del campione, solo quando la tua formula entra in produzione.',
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
        body: 'C’è stato un problema con il pagamento. Non ti abbiamo addebitato nulla. Riprova o contattaci.',
        retry: 'Riprova →',
        help: 'Serve aiuto?',
      },
      supportLine: 'o',
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
        somethingElse: 'Qualcos’altro',
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
        deliveryValue: 'Tracciato · gratuito',
        monthly: 'Mensile',
        dueToday: '€0 addebitati oggi',
        chargeNote: 'Primo addebito {when}.',
        chargeWhen: 'quando la tua formula entra in fase di produzione',
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
