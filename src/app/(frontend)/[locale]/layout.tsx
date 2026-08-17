/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React, { cache } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
// Mono face used by .cmp2-method, eyebrow labels, etc. Previously only rendered
// where JetBrains Mono was a system font; on servers without it, mono text fell
// back to the platform monospace. Load it explicitly like the other faces.
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import Script from 'next/script'

import { JsonLd, type JsonLdValue } from '@/components/JsonLd'
import { ArminWidget } from '@/components/ArminWidget'
import { PageViewTracker } from '@/components/DataLayerEvents/PageViewTracker'
import { ketchConsentBindingScript } from '@/lib/ketchConsentBridge'
import StyledJsxRegistry from './registry'
import { getPayload } from 'payload'
import config from '@payload-config'
import { appLocales, defaultLocale, isAppLocale, localeConfig, type AppLocale } from '@/i18n/config'

export function generateStaticParams() {
  return appLocales.map((locale) => ({ locale }))
}

const getSiteSettings = cache(async (locale: AppLocale) => {
  const payload = await getPayload({ config })

  return payload.findGlobal({
    slug: 'site-settings',
    locale,
    fallbackLocale: defaultLocale,
  })
})

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { isEnabled } = await draftMode()
  const marketingEnabled = !isEnabled

  const resolved = await params
  const locale: AppLocale = isAppLocale(resolved.locale) ? resolved.locale : defaultLocale

  const ketchLang = localeConfig[locale].hreflangCodes[0]

  let organizationJsonLd: JsonLdValue = null

  try {
    const site = await getSiteSettings(locale)
    organizationJsonLd = (site?.organizationJsonLd ?? null) as JsonLdValue
  } catch {
    organizationJsonLd = null
  }

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable)}
      data-nb1-preview={isEnabled ? 'true' : undefined}
      lang={localeConfig[locale].htmlLang}
      suppressHydrationWarning
    >
      <head>
        <meta name="facebook-domain-verification" content="4r4g0m2wo3hl69f7kdwb6eeq1bz2i6" />
        <InitTheme />

        {marketingEnabled && (
          <>
            <Script id="gtag-consent-mode" strategy="beforeInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            // Temporary policy: tracking starts open until Ketch reports a rejection.
            window.__nb1Consent = { analytics: true, targeted_advertising: true };
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted',
              'analytics_storage': 'granted',
              'wait_for_update': 2000
            });
          `}
            </Script>

            {/* Google Tag Manager */}
            {process.env.NEXT_PUBLIC_GTM_ID && (
              <Script id="gtm-head" strategy="beforeInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=!0;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
          `}</Script>
            )}
            {/* End Google Tag Manager */}

            <Script id="ketch-lang" strategy="beforeInteractive">{`
          (function() {
            var lang = '${ketchLang}';
            try {
              Object.defineProperty(navigator, 'language', { get: function() { return lang; }, configurable: true });
              Object.defineProperty(navigator, 'languages', { get: function() { return [lang]; }, configurable: true });
            } catch(e) {}
            window.ketch_lang = lang;
            window.ketchConfig = window.ketchConfig || {};
            window.ketchConfig.language = lang;
            window.semaphore = window.semaphore || [];
            window.ketch = window.ketch || function() { window.semaphore.push(Array.from(arguments)); };
            window.ketch('setLanguage', lang);
            window.ketch('on', 'willShowExperience', function(experience, next) {
              if (experience && next) { experience.language = lang; next(experience); }
            });
          })();
        `}</Script>
            <Script
              src="https://global.ketchcdn.com/web/v3/config/nb1_health/website_smart_tag/boot.js"
              strategy="beforeInteractive"
              data-ketch-lang={ketchLang}
            />

            {/*
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
        )} */}

            {/* conversion.io A/B testing — beforeInteractive so the install id is set and the
            tracker loads before paint (anti-flicker) and is present when the visual editor
            inspects the page. Order matters: iid must be defined before conversion.js runs;
            next/script preserves order among beforeInteractive scripts. */}
            <Script id="conversion-iid" strategy="beforeInteractive">{`
          window.codebase = window.codebase || {};
          window.codebase.iid = 'B330E7E18FB3';
        `}</Script>
            <Script
              src="https://scripts.conversion.io/conversion.js"
              strategy="beforeInteractive"
            />
          </>
        )}

        <link href="/favicon-1.ico" rel="icon" sizes="32x32" />
        <link href="/favicon-1.svg" rel="icon" type="image/svg+xml" />
        <JsonLd data={organizationJsonLd} />
      </head>

      <body suppressHydrationWarning>
        <StyledJsxRegistry>
          {marketingEnabled && process.env.NEXT_PUBLIC_META_PIXEL_ID && (
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          )}

          {/* Google Tag Manager (noscript) */}
          {marketingEnabled && process.env.NEXT_PUBLIC_GTM_ID && (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          )}
          {/* End Google Tag Manager (noscript) */}

          <Providers>
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />

            {children}
            {marketingEnabled && <PageViewTracker />}

            {marketingEnabled && (
              <>
                <Script id="ketch-consent-bridge" strategy="afterInteractive">
                  {`
                ${ketchConsentBindingScript(ketchLang)}

                // Intercept inline action links added via Ketch dashboard description field:
                //   #ketch-accept   → delegates to the primary (Accept All) button
                //   #ketch-reject   → delegates to the tertiary (Reject All) button
                //   #ketch-settings → delegates to the secondary (Customize Settings) button
                document.addEventListener('click', function(e) {
                  var link = e.target.closest('a[href$="#ketch-accept"], a[href$="#ketch-reject"], a[href$="#ketch-settings"]');
                  if (!link) return;
                  e.preventDefault();
                  var href = link.getAttribute('href') || '';
                  var btnId = href.endsWith('#ketch-accept')   ? 'ketch-banner-button-primary'
                            : href.endsWith('#ketch-reject')   ? 'ketch-banner-button-tertiary'
                            :                                    'ketch-banner-button-secondary';
                  var btn = document.getElementById(btnId);
                  if (btn) btn.click();
                });

                // MutationObserver: enforce layout via inline styles so Ketch's own
                // sm:ketch-flex-row / sm:ketch-w-auto !important classes can't override us.
                function applyKetchLayout() {
                  var banner = document.getElementById('ketch-consent-banner');
                  if (!banner) return;

                  // Header section: force column so logo and title stack
                  var headerSection = banner.querySelector(':scope > div:first-child');
                  if (headerSection) headerSection.style.setProperty('flex-direction', 'column', 'important');

                  // Header row: center contents (X button is absolute, only logo+title group remains)
                  var logoRow = banner.querySelector(':scope > div:first-child > div:first-child');
                  if (logoRow) logoRow.style.setProperty('justify-content', 'center', 'important');

                  // Logo + title inner group (ketch-items-center): stack vertically
                  var logoImg = banner.querySelector('img[alt="header-logo"]');
                  if (logoImg) {
                    var logoTitleGroup = logoImg.closest('.ketch-flex');
                    while (logoTitleGroup && !logoTitleGroup.querySelector('h3')) {
                      logoTitleGroup = logoTitleGroup.parentElement ? logoTitleGroup.parentElement.closest('.ketch-flex') : null;
                    }
                    if (logoTitleGroup) {
                      logoTitleGroup.style.setProperty('flex-direction', 'column', 'important');
                      logoTitleGroup.style.setProperty('align-items', 'stretch', 'important');
                      logoTitleGroup.style.setProperty('width', '100%', 'important');
                      logoTitleGroup.style.setProperty('gap', '8px', 'important');
                    }
                    // Logo wrapper: center the img
                    var logoWrapper = logoImg.parentElement;
                    if (logoWrapper) {
                      logoWrapper.style.setProperty('align-items', 'center', 'important');
                      logoWrapper.style.setProperty('width', '100%', 'important');
                    }
                  }

                  // Content wrapper (sm:ketch-flex-row): force column on all screens
                  var contentWrapper = banner.querySelector(':scope > div:nth-child(2)');
                  if (contentWrapper) contentWrapper.style.setProperty('flex-direction', 'column', 'important');

                  // Buttons container: force row
                  var btnContainer = banner.querySelector('#ketch-banner-buttons-container-compact, #ketch-banner-buttons-container-standard');
                  if (btnContainer) {
                    btnContainer.style.setProperty('display', 'flex', 'important');
                    btnContainer.style.setProperty('flex-direction', 'row', 'important');
                    btnContainer.style.setProperty('width', '100%', 'important');
                    btnContainer.style.setProperty('gap', '10px', 'important');
                  }

                  // Each button: equal half-width, override sm:ketch-w-auto
                  ['ketch-banner-button-primary', 'ketch-banner-button-secondary'].forEach(function(id) {
                    var btn = document.getElementById(id);
                    if (!btn) return;
                    btn.style.setProperty('flex', '1 1 0%', 'important');
                    btn.style.setProperty('width', '0', 'important');
                    btn.style.setProperty('min-width', '0', 'important');
                    btn.style.setProperty('max-width', '100%', 'important');
                  });

                  // Override md:ketch-max-w-[50%] wherever Ketch places it inside the banner
                  banner.querySelectorAll('[class*="ketch-max-w-"]').forEach(function(el) {
                    el.style.setProperty('max-width', '100%', 'important');
                  });
                }

                var ketchObserver = new MutationObserver(function() {
                  if (document.getElementById('ketch-consent-banner')) {
                    applyKetchLayout();
                    ketchObserver.disconnect();
                  }
                });
                ketchObserver.observe(document.body, { childList: true, subtree: true });
              `}
                </Script>

                <ArminWidget locale={locale} />

                <Script
                  src="https://static.klaviyo.com/onsite/js/WwW2Hy/klaviyo.js?company_id=WwW2Hy"
                  strategy="afterInteractive"
                  async
                />

                <Script id="klaviyo-init" strategy="afterInteractive">
                  {`
              !function(){if(!window.klaviyo){
                window._klOnsite=window._klOnsite||[];
                try{
                  window.klaviyo=new Proxy({},{
                    get:function(n,i){
                      return i==="push"
                        ? function(){var n;(n=window._klOnsite).push.apply(n,arguments)}
                        : function(){
                            for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];
                            var t=typeof o[o.length-1]=="function"?o.pop():void 0;
                            var e=new Promise(function(n){
                              window._klOnsite.push([i].concat(o,[function(i){
                                t&&t(i);n(i)
                              }]))
                            });
                            return e
                          }
                    }
                  })
                }catch(n){
                  window.klaviyo=window.klaviyo||[];
                  window.klaviyo.push=function(){
                    var n;(n=window._klOnsite).push.apply(n,arguments)
                  }
                }
              }}();
            `}
                </Script>
              </>
            )}
          </Providers>
        </StyledJsxRegistry>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'NB1 - One gut one plan',
    template: '%s | NB1',
  },
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
