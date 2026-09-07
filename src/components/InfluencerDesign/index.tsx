import React from 'react'
import { Gift } from 'lucide-react'
import type { InfluencerLandingPage, InfluencerTemplate } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'
import { Media } from '@/components/Media'
import { OutcomesComponent } from '@/blocks/Outcomes/Component'
import { YpPlansComponent } from '@/blocks/yourPlanBlocks/Plans/Component'
import { getDictionary } from '@/i18n/getDictionary'
import { getInfluencerVideoEmbedURL } from '@/lib/influencerVideo'
import { InfluencerCta } from '@/app/(frontend)/[locale]/influencers/[slug]/InfluencerCta'
import { InfluencerVideo } from '@/app/(frontend)/[locale]/influencers/[slug]/InfluencerVideo'
import './styles.css'

const personalize = (text: string | null | undefined, name: string) =>
  (text ?? '').replaceAll('{name}', name)

function Headline({ text, name }: { text: string; name: string }) {
  return text.split('{name}').map((part, i) => (
    <React.Fragment key={i}>
      {i > 0 && <span className="il-accent">{name}</span>}
      {part}
    </React.Fragment>
  ))
}

export function InfluencerDesign({
  page,
  template,
  locale,
  orderHref,
  coreHref,
  advancedHref,
}: {
  page: InfluencerLandingPage
  template: InfluencerTemplate | null
  locale: AppLocale
  orderHref: string
  coreHref: string
  advancedHref: string
}) {
  const name = page.influencerName
  const offer = {
    code: page.discountCode,
    sourceSlug: page.slug,
    errorLabel: getDictionary(locale).checkout.promoUi.offerUnavailable,
  }
  const cta = <InfluencerCta {...offer} href={orderHref} label={page.ctaLabel} />
  const video = getInfluencerVideoEmbedURL(page.videoUrl)
  const finePrint = page.offerFinePrint ?? template?.offerFinePrint
  const logo = template?.logo
  const brand =
    logo && typeof logo === 'object' ? (
      <Media resource={logo} imgClassName="il-logo" />
    ) : (
      <img src="/nb1/img/nb1-logo.png" className="il-logo" alt="NB1" width="80" height="28" />
    )

  return (
    <div className="influencer-design">
      <nav className="il-nav" aria-label="NB1">
        <div className="il-wrap il-nav-in">
          <a href={`/${locale}`} aria-label="NB1">
            {brand}
          </a>
          {cta}
        </div>
      </nav>
      <main>
        <section className="il-hero">
          <div className="il-wrap il-hero-grid">
            <h1>
              <Headline text={page.heroHeadline} name={name} />
            </h1>
            <p className="il-lede">{personalize(page.heroCopy, name)}</p>
            <p className="il-badge">✦ {personalize(page.giftQuote, name)}</p>
            <div className="il-hero-action">{cta}</div>
            <div className="il-hero-image">
              <Media
                resource={page.primaryImage}
                fill
                priority
                imgClassName="il-cover"
                size="(max-width: 800px) 100vw, 480px"
              />
            </div>
          </div>
        </section>
        <section className="il-quote">
          <blockquote className="il-wrap">
            <span aria-hidden="true" className="il-quote-mark">
              “
            </span>
            <p>{page.testimonial}</p>
            <footer>— {page.testimonialAttribution}</footer>
            {page.handle && <p className="il-handle">{page.handle}</p>}
          </blockquote>
        </section>
        {video && (
          <section className="il-wrap il-video">
            <InfluencerVideo embedURL={video} locale={locale} title={`${name} video`} />
          </section>
        )}
        {!!template?.timeline?.length && (
          <section className="il-journey">
            <div className="il-wrap">
              <h2>
                {template.timelineHeading}{' '}
                <span className="il-accent">{template.timelineAccent}</span>
              </h2>
              <div className="il-timeline-card">
                <ol className="il-timeline">
                  {template.timeline.map((step, i) => (
                    <li key={step.id ?? i}>
                      <span
                        className={`il-marker${step.gift ? ' il-gift' : ''}`}
                        aria-hidden="true"
                      >
                        {step.gift ? <Gift size={22} /> : <span />}
                      </span>
                      <p className="il-when">{personalize(step.when, name)}</p>
                      <h3>{personalize(step.title, name)}</h3>
                      <p>{personalize(step.description, name)}</p>
                    </li>
                  ))}
                </ol>
                {(template.scienceHeading || template.scienceCopy) && (
                  <div className="il-science">
                    {!!template.scientists?.length && (
                      <div className="il-faces">
                        {template.scientists.map((person, i) => (
                          <Media
                            key={person.id ?? i}
                            resource={person.portrait}
                            imgClassName="il-face"
                          />
                        ))}
                      </div>
                    )}
                    <div>
                      <strong>{template.scienceHeading}</strong>
                      <p>{template.scienceCopy}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {template?.sections?.map((section, i) => {
          if (section.blockType === 'outcomes')
            return (
              <OutcomesComponent
                key={section.id ?? i}
                {...section}
                cards={section.cards?.map((card) => ({
                  ...card,
                  image: typeof card.image === 'object' ? card.image : null,
                }))}
              />
            )
          if (section.blockType === 'ypPlans')
            return (
              <YpPlansComponent
                key={section.id ?? i}
                {...section}
                backgroundImage={
                  typeof section.backgroundImage === 'object' ? section.backgroundImage : null
                }
                comparison={
                  section.comparison
                    ? {
                        ...section.comparison,
                        cards: section.comparison.cards?.map(({ features, ...card }) => ({
                          ...card,
                          features: features as NonNullable<
                            NonNullable<
                              React.ComponentProps<typeof YpPlansComponent>['comparison']
                            >['cards']
                          >[number]['features'],
                        })),
                      }
                    : undefined
                }
                locale={locale}
                influencerOffer={{ ...offer, coreHref, advancedHref, orderHref }}
              />
            )
          return null
        })}
        <section className="il-offer">
          {template?.offerBackground && (
            <div className="il-offer-background">
              <Media
                resource={template.offerBackground}
                fill
                imgClassName="il-cover"
                size="100vw"
              />
            </div>
          )}
          <div className="il-wrap il-offer-in">
            <div className="il-offer-card">
              {template?.offerBadge && (
                <p className="il-offer-badge">
                  <Gift size={17} aria-hidden="true" />
                  {personalize(template.offerBadge, name)}
                </p>
              )}
              <h2>{personalize(page.offerHeadline, name)}</h2>
              <p className="il-offer-copy">{personalize(page.offerCopy, name)}</p>
              {cta}
              {finePrint && <p className="il-fine-print">{personalize(finePrint, name)}</p>}
            </div>
          </div>
        </section>
      </main>
      <footer className="il-footer">
        <div className="il-wrap il-footer-in">
          <a href={`/${locale}`} aria-label="NB1">
            {brand}
          </a>
          <div className="il-footer-links">
            {template?.footerLinks?.map((link) => {
              const linked = typeof link.page === 'object' ? link.page : null
              return linked?.slug && linked._status === 'published' ? (
                <a key={link.id} href={`/${locale}/${encodeURIComponent(linked.slug)}`}>
                  {link.label}
                </a>
              ) : null
            })}
          </div>
          {template?.footerCopy && <p>{template.footerCopy}</p>}
        </div>
      </footer>
    </div>
  )
}
