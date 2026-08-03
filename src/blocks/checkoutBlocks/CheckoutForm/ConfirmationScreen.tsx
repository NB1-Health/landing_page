'use client'

import React, { useEffect, useState } from 'react'
import { persistPostPurchaseSurveyResponse } from '@/lib/checkoutApi'
import {
  trackPostPurchaseSurveyAnswered,
  trackPostPurchaseSurveyViewed,
} from '@/lib/dataLayer'

type SurveyDetail = { code: string; label: string }
type SurvOpt = {
  code: string
  label: string
  detailCode?: string
  details?: SurveyDetail[]
}
const SURVEY_KEY = 'checkout_attribution'
const SURVEY_VERSION = 1
const SURVEY_PLACEMENT = 'checkout_confirmation'
const QUESTION_KEY = 'discovery_source'
const QUESTION_VERSION = 1

type Props = {
  fn: string
  email: string
  orderNumber: string | null
  checkoutId: string
  acquisitionEventId: string | null
  transactionId: string | null
  customerId: string | null
  externalId: string | null
  planLabel: string
  cycleLabel: string
  priceFormatted: string
  locale: string
  t: any
  inboxBodyPrefix: string
  inboxBodySuffix: string
  chargeNotePrefix: string
  chargeNoteSuffix: string
  survOpts: SurvOpt[]
}

export function ConfirmationScreen({
  fn, email, orderNumber, planLabel, cycleLabel, priceFormatted,
  checkoutId, acquisitionEventId, transactionId, customerId, externalId,
  locale, t, inboxBodyPrefix, inboxBodySuffix,
  chargeNotePrefix, chargeNoteSuffix,
  survOpts,
}: Props) {
  const td = t.done

  // Survey state
  const [survState, setSurvState] = useState<'top' | 'sub' | 'thanks'>('top')
  const [activeSurvOpt, setActiveSurvOpt] = useState<SurvOpt | null>(null)
  const [showOther, setShowOther] = useState(false)
  const [otherVal, setOtherVal] = useState('')

  useEffect(() => {
    if (!acquisitionEventId || !transactionId || !customerId) return
    trackPostPurchaseSurveyViewed({
      checkoutId,
      acquisitionEventId,
      transactionId,
      customerId,
      externalId: externalId ?? undefined,
      orderNumber,
      email,
      pageLanguage: locale,
      surveyKey: SURVEY_KEY,
      surveyVersion: SURVEY_VERSION,
      surveyPlacement: SURVEY_PLACEMENT,
    })
  }, [
    acquisitionEventId,
    checkoutId,
    customerId,
    email,
    externalId,
    locale,
    orderNumber,
    transactionId,
  ])

  function recordAnswer(
    answerCode: string,
    answerDetailCode?: string,
    hasFreeText = false,
    answerText?: string,
  ) {
    if (!acquisitionEventId || !transactionId || !customerId) return
    const answeredAt = new Date().toISOString()
    const clientEventId = trackPostPurchaseSurveyAnswered({
      checkoutId,
      acquisitionEventId,
      transactionId,
      customerId,
      externalId: externalId ?? undefined,
      orderNumber,
      email,
      pageLanguage: locale,
      surveyKey: SURVEY_KEY,
      surveyVersion: SURVEY_VERSION,
      surveyPlacement: SURVEY_PLACEMENT,
      questionKey: QUESTION_KEY,
      questionVersion: QUESTION_VERSION,
      answerType: 'single_choice',
      answerCode,
      answerDetailCode,
      hasFreeText,
      persistenceStatus: 'backend_requested',
    })

    void persistPostPurchaseSurveyResponse({
      user_id: customerId,
      transaction_id: transactionId,
      survey_key: SURVEY_KEY,
      survey_version: SURVEY_VERSION,
      survey_placement: SURVEY_PLACEMENT,
      page_language: locale,
      checkout_id: checkoutId,
      related_event_id: acquisitionEventId,
      response_source: 'customer_reported',
      context: {
        ...(orderNumber ? { order_number: orderNumber } : {}),
        form: 'checkout_confirmation',
      },
      completed_at: answeredAt,
      answers: [
        {
          question_key: QUESTION_KEY,
          question_version: QUESTION_VERSION,
          answer_type: 'single_choice',
          answer_code: answerCode,
          ...(answerDetailCode ? { answer_detail_code: answerDetailCode } : {}),
          ...(answerText ? { answer_text: answerText } : {}),
          client_event_id: clientEventId,
          answered_at: answeredAt,
          metadata: { has_free_text: hasFreeText },
        },
      ],
    })
  }

  function onTopOpt(opt: SurvOpt) {
    if (opt.details?.length) {
      setActiveSurvOpt(opt)
      setSurvState('sub')
    } else {
      recordAnswer(opt.code, opt.detailCode)
      setSurvState('thanks')
    }
    setShowOther(false)
  }

  function onSubOpt(detailCode?: string) {
    if (!activeSurvOpt) return
    recordAnswer(activeSurvOpt.code, detailCode)
    setSurvState('thanks')
  }

  function onOther() { setShowOther(true); setActiveSurvOpt(null) }

  function onSurvSend() {
    if (!otherVal.trim()) return
    recordAnswer('other', undefined, true, otherVal.trim())
    setSurvState('thanks')
  }


  return (
    <div className="nb1-conf-wrap">
      <style jsx>{`
        .nb1-conf-wrap { max-width: 845px; margin: 0 auto; padding: 0 28px 0; }
        .nb1-conf-legal { text-align: center; font-size: 12px; color: rgba(18,49,77,.40); padding: 28px 0 60px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 8px; }
        .nb1-conf-legal-link { color: rgba(18,49,77,.40); text-decoration: none; transition: color .15s; }
        .nb1-conf-legal-link:hover { color: #12314D; }
        .nb1-conf-legal-dot { color: rgba(18,49,77,.25); }

        /* Hero */
        .nb1-conf-hero { text-align: center; max-width: 640px; margin: 0 auto; padding: 18px 0 6px; }
        .nb1-conf-check { width: 62px; height: 62px; border-radius: 50%; background: #0a8fb0; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; box-shadow: 0 14px 34px -16px rgba(10,143,176,.6); }
        .nb1-conf-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0a8fb0; margin-bottom: 14px; }
        .nb1-conf-hero h1 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: clamp(30px, 4vw, 42px); line-height: 1.05; letter-spacing: -.03em; color: #12314d; }
        .nb1-conf-hero p { font-size: 16px; color: rgba(18,49,77,.70); line-height: 1.55; margin-top: 14px; }

        /* Survey */
        .nb1-conf-sec { padding: 46px 0; border-top: 1px solid rgba(18,49,77,.07); }
        .nb1-conf-sec:first-of-type { border-top: none; padding-top: 6px; }
        .nb1-surv-card { background: #fff; border: 1px solid rgba(18,49,77,.10); border-radius: 16px; padding: 22px 26px; display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
        .nb1-surv-head { flex: none; max-width: 300px; }
        .nb1-surv-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #0a8fb0; margin-bottom: 6px; }
        .nb1-surv-card h3 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 19px; letter-spacing: -.01em; color: #12314d; }
        .nb1-surv-sub { font-size: 12.5px; color: rgba(18,49,77,.55); margin-top: 5px; line-height: 1.45; }
        .nb1-surv-opts { flex: 1; min-width: 260px; display: flex; flex-wrap: wrap; gap: 9px; }
        .nb1-surv-opt { font-size: 13.5px; font-weight: 600; color: rgba(18,49,77,.70); background: #fff; border: 1.5px solid rgba(18,49,77,.10); border-radius: 100px; padding: 10px 16px; cursor: pointer; transition: all .15s; font-family: inherit; }
        .nb1-surv-opt:hover { border-color: rgba(10,143,176,.22); }
        .nb1-surv-opt.on { border-color: #0a8fb0; background: rgba(10,143,176,.08); color: #0a8fb0; }
        .nb1-surv-opt.skip { border-style: dashed; color: rgba(18,49,77,.40); font-weight: 500; }
        .nb1-surv-other { flex-basis: 100%; display: flex; gap: 8px; margin-top: 4px; }
        .nb1-surv-other input { flex: 1; font-family: inherit; font-size: 14px; border: 1.5px solid rgba(18,49,77,.10); border-radius: 11px; padding: 12px 14px; outline: none; }
        .nb1-surv-other input:focus { border-color: #0a8fb0; box-shadow: 0 0 0 3px rgba(10,143,176,.08); }
        .nb1-surv-send { background: #12314d; color: #fff; border: none; border-radius: 10px; padding: 0 18px; font-family: inherit; font-weight: 600; font-size: 13px; cursor: pointer; }
        .nb1-surv-send:disabled { opacity: .45; cursor: not-allowed; }

        /* Grid */
        .nb1-conf-grid { display: grid; grid-template-columns: 1fr 360px; gap: 44px; align-items: start; margin-top: 8px; }
        .nb1-conf-main h2 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 22px; letter-spacing: -.02em; color: #12314d; margin-bottom: 26px; }

        /* Timeline */
        .nb1-conf-rail { display: flex; flex-direction: column; }
        .nb1-conf-tstep { display: grid; grid-template-columns: 168px 1fr; gap: 30px; padding-bottom: 34px; position: relative; align-items: start; }
        .nb1-conf-tstep:last-child { padding-bottom: 0; }
        .nb1-conf-tstep:not(:last-child)::after { content: ''; position: absolute; left: 19px; top: 46px; bottom: 4px; width: 2px; background: rgba(10,143,176,.14); }
        .nb1-conf-tweek { display: flex; flex-direction: row; align-items: center; gap: 13px; }
        .nb1-conf-tmarker { width: 40px; height: 40px; border-radius: 50%; background: rgba(10,143,176,.08); border: 1.5px solid #0a8fb0; color: #0a8fb0; font-size: 16px; font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; display: flex; align-items: center; justify-content: center; flex: none; z-index: 1; }
        .nb1-conf-tstep.payment .nb1-conf-tmarker { border-color: #C2913C; color: #C2913C; background: rgba(212,160,42,.10); }
        .nb1-conf-tweek-lbl { font-size: 14px; font-weight: 700; color: #12314d; white-space: nowrap; }
        .nb1-conf-tcontent { padding-top: 8px; }
        .nb1-conf-tcontent h4 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 18px; letter-spacing: -.01em; color: #12314d; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; line-height: 1.3; }
        .nb1-conf-tcontent p { font-size: 15px; color: rgba(18,49,77,.70); line-height: 1.62; margin-top: 8px; }
        .nb1-conf-pay-badge { font-size: 10.5px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #C2913C; background: rgba(212,160,42,.12); padding: 3px 9px; border-radius: 100px; white-space: nowrap; }

        /* Inbox notice */
        .nb1-conf-inbox { margin-top: 30px; background: rgba(10,143,176,.08); border: 1px solid rgba(10,143,176,.18); border-radius: 14px; padding: 20px 22px; display: flex; gap: 14px; align-items: flex-start; }
        .nb1-conf-inbox b { font-weight: 600; color: #12314d; display: block; margin-bottom: 4px; }
        .nb1-conf-inbox p { font-size: 13.5px; color: rgba(18,49,77,.70); line-height: 1.55; }

        /* Aside */
        .nb1-conf-aside { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 14px; }
        .nb1-conf-card { background: #fff; border: 1px solid rgba(18,49,77,.10); border-radius: 16px; padding: 24px; }
        .nb1-conf-card-h { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 16px; color: #12314d; margin-bottom: 14px; }
        .nb1-conf-row { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 9px 0; font-size: 13.5px; color: rgba(18,49,77,.55); }
        .nb1-conf-row b { color: #12314d; font-weight: 600; text-align: right; }
        .nb1-conf-row.big { font-size: 15px; }
        .nb1-conf-row.big b { font-family: 'Instrument Sans', 'Inter', sans-serif; font-size: 23px; letter-spacing: -.02em; }
        .nb1-conf-row.big b small { font-size: 12px; color: rgba(18,49,77,.40); font-weight: 500; }
        .nb1-conf-div { height: 1px; background: rgba(18,49,77,.07); margin: 7px 0; }
        .nb1-conf-due { margin-top: 16px; background: rgba(10,143,176,.08); color: #0a8fb0; font-weight: 700; font-size: 14px; text-align: center; padding: 11px; border-radius: 10px; }
        .nb1-conf-charge { font-size: 12.5px; color: rgba(18,49,77,.55); line-height: 1.5; margin-top: 10px; text-align: center; }
        .nb1-conf-cta { display: block; background: #c6ff5b; color: #0e2740; border-radius: 100px; padding: 15px; font-weight: 700; font-size: 15px; text-align: center; text-decoration: none; }
        .nb1-conf-cta:hover { background: #aaea42; }
        .nb1-conf-cta2 { display: block; text-align: center; font-size: 13.5px; font-weight: 600; color: #12314d; text-decoration: none; padding: 6px; }
        .nb1-conf-cta2:hover { text-decoration: underline; text-underline-offset: 3px; }
        .nb1-conf-support { text-align: center; font-size: 12.5px; color: rgba(18,49,77,.55); }
        .nb1-conf-support a { color: #0a8fb0; }
        .nb1-conf-chat { background: none; border: none; color: #0a8fb0; font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px; }
        .nb1-conf-chat:hover { color: #12314d; }

        /* Refer band */
        .nb1-refer-band { background: rgba(10,143,176,.08); border: 1px solid rgba(10,143,176,.18); border-radius: 18px; padding: 30px 34px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .nb1-refer-band h2 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 23px; letter-spacing: -.02em; color: #12314d; }
        .nb1-refer-band h2 span { color: #0a8fb0; }
        .nb1-refer-band p { font-size: 14px; color: rgba(18,49,77,.70); margin-top: 6px; max-width: 440px; line-height: 1.5; }
        .nb1-refer-cta { flex: none; background: #0a8fb0; color: #fff; border: none; border-radius: 100px; padding: 14px 26px; font-family: inherit; font-weight: 600; font-size: 14px; cursor: pointer; }
        .nb1-refer-cta:hover { background: #13a6cc; }

        /* Modal */
        .nb1-modal-ov { position: fixed; inset: 0; background: rgba(10,27,46,.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 200; opacity: 0; pointer-events: none; transition: opacity .25s; }
        .nb1-modal-ov.show { opacity: 1; pointer-events: auto; }
        .nb1-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 470px; padding: 34px 34px 30px; box-shadow: 0 30px 80px -20px rgba(10,27,46,.55); transform: translateY(14px) scale(.98); transition: transform .25s; position: relative; max-height: 90vh; overflow: auto; }
        .nb1-modal-ov.show .nb1-modal { transform: none; }
        .nb1-modal-x { position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; border: none; background: #F1F4F7; border-radius: 50%; cursor: pointer; color: rgba(18,49,77,.55); font-size: 17px; display: flex; align-items: center; justify-content: center; }
        .nb1-modal-x:hover { color: #12314d; }
        .nb1-modal-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #0a8fb0; margin-bottom: 10px; }
        .nb1-modal h3 { font-family: 'Instrument Sans', 'Inter', sans-serif; font-weight: 600; font-size: 24px; letter-spacing: -.02em; line-height: 1.15; color: #12314d; }
        .nb1-modal .sub { font-size: 14px; color: rgba(18,49,77,.70); line-height: 1.55; margin-top: 10px; }
        .nb1-modal .sub strong { color: #12314d; font-weight: 600; }
        .nb1-modal-lbl { font-size: 12px; font-weight: 600; color: rgba(18,49,77,.55); margin-top: 18px; display: block; }
        .nb1-modal-msg { width: 100%; font-family: inherit; font-size: 13.5px; color: #12314d; line-height: 1.5; border: 1.5px solid rgba(18,49,77,.10); border-radius: 11px; padding: 12px 14px; resize: vertical; min-height: 78px; margin-top: 6px; }
        .nb1-modal-msg:focus { outline: none; border-color: #0a8fb0; box-shadow: 0 0 0 3px rgba(10,143,176,.08); }
        .nb1-refer-link { display: flex; gap: 8px; margin-top: 20px; }
        .nb1-refer-link input { flex: 1; font-family: inherit; font-size: 13.5px; color: rgba(18,49,77,.70); border: 1.5px solid rgba(18,49,77,.10); border-radius: 10px; padding: 12px 13px; background: #F1F4F7; }
        .nb1-refer-copy { background: #12314d; color: #fff; border: none; border-radius: 10px; padding: 0 18px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; }
        .nb1-refer-sbtns { display: flex; gap: 10px; margin-top: 12px; }
        .nb1-refer-sbtn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; font-weight: 600; font-size: 13px; border-radius: 10px; padding: 12px; cursor: pointer; border: 1.5px solid rgba(18,49,77,.10); background: #fff; color: rgba(18,49,77,.70); text-decoration: none; }
        .nb1-refer-sbtn:hover { border-color: rgba(10,143,176,.22); }
        .nb1-refer-sbtn-primary { background: #12314d; color: #fff; border-color: #12314d; }
        .nb1-refer-sbtn-primary:hover { background: #0e2740; border-color: #0e2740; }
        .nb1-refer-sbtn.wa { background: #25D366; color: #fff; border-color: #25D366; }
        .nb1-modal-actions { display: flex; align-items: center; gap: 14px; margin-top: 24px; }
        .nb1-modal-skip { background: none; border: none; color: rgba(18,49,77,.55); font-family: inherit; font-weight: 600; font-size: 13.5px; cursor: pointer; margin-left: auto; }
        .nb1-modal-skip:hover { color: #12314d; }

        @media (max-width: 880px) {
          .nb1-conf-grid { grid-template-columns: 1fr; gap: 30px; }
          .nb1-conf-aside { position: static; }
        }
        @media (max-width: 640px) {
          .nb1-conf-tstep { grid-template-columns: 1fr; gap: 14px; padding-bottom: 28px; }
          .nb1-conf-tstep:not(:last-child)::after { display: none; }
        }
        @media (max-width: 560px) {
          .nb1-refer-band { padding: 24px 22px; gap: 18px; }
          .nb1-refer-cta { width: 100%; text-align: center; }
          .nb1-surv-card { padding: 22px 20px; gap: 16px; }
          .nb1-surv-head { max-width: none; }
          .nb1-modal { padding: 28px 22px 24px; }
        }
      `}</style>

      {/* Hero */}
      <header className="nb1-conf-hero">
        <div className="nb1-conf-check">
          <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </div>
        {orderNumber && (
          <div className="nb1-conf-eyebrow">Order <span>{orderNumber}</span></div>
        )}
        <h1>{td.heading}{fn ? `, ${fn}` : ''}.</h1>
        <p>{td.body}</p>
      </header>

      {/* Attribution survey */}
      <div className="nb1-conf-sec">
        <div className="nb1-surv-card">
          <div className="nb1-surv-head">
            <div className="nb1-surv-eyebrow">{survState === 'thanks' ? td.survey.thanks.split(',')[0] : td.survey.eyebrow}</div>
            <h3>{survState === 'thanks' ? td.survey.thanks : survState === 'sub' ? td.survey.whichOne : td.survey.question}</h3>
            <p className="nb1-surv-sub">{survState === 'thanks' ? td.survey.thanksSub : survState === 'sub' ? td.survey.whichSub : td.survey.sub}</p>
          </div>
          {survState !== 'thanks' && (
            <div className="nb1-surv-opts">
              {survState === 'top' && survOpts.map((opt) => (
                <button key={`${opt.code}:${opt.detailCode ?? ''}`} type="button" className="nb1-surv-opt" onClick={() => onTopOpt(opt)}>{opt.label}</button>
              ))}
              {survState === 'top' && (
                <button type="button" className="nb1-surv-opt" onClick={onOther}>{td.survey.somethingElse}</button>
              )}
              {survState === 'sub' && activeSurvOpt?.details?.map((detail) => (
                <button key={detail.code} type="button" className="nb1-surv-opt" onClick={() => onSubOpt(detail.code)}>{detail.label}</button>
              ))}
              {survState === 'sub' && (
                <button type="button" className="nb1-surv-opt skip" onClick={() => onSubOpt()}>{td.survey.skip}</button>
              )}
              {showOther && survState === 'top' && (
                <div className="nb1-surv-other">
                  <input value={otherVal} onChange={e => setOtherVal(e.target.value)} placeholder={td.survey.placeholder} autoComplete="off" maxLength={500} />
                  <button type="button" className="nb1-surv-send" onClick={onSurvSend} disabled={!otherVal.trim()}>{td.survey.send}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: timeline + aside */}
      <div className="nb1-conf-sec">
        <div className="nb1-conf-grid">
          <div className="nb1-conf-main">
            <h2>{td.timeline.heading}</h2>
            <div className="nb1-conf-rail">
              {([
                td.timeline.step1,
                td.timeline.step2,
                td.timeline.step3,
                td.timeline.step4,
                td.timeline.step5,
              ] as any[]).map((step, i) => (
                <div key={i} className={`nb1-conf-tstep${i === 3 ? ' payment' : ''}`}>
                  <div className="nb1-conf-tweek">
                    <div className="nb1-conf-tmarker">{i + 1}</div>
                    <div className="nb1-conf-tweek-lbl">{step.label}</div>
                  </div>
                  <div className="nb1-conf-tcontent">
                    <h4>
                      {step.title}
                      {step.badge && <span className="nb1-conf-pay-badge">{step.badge}</span>}
                    </h4>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="nb1-conf-inbox">
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="#0a8fb0" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
              </svg>
              <div>
                <b>{td.inboxTitle}</b>
                <p>{inboxBodyPrefix}<strong>{email}</strong>{inboxBodySuffix}</p>
              </div>
            </div>
          </div>

          <aside className="nb1-conf-aside">
            <div className="nb1-conf-card">
              <div className="nb1-conf-card-h">{td.summary.heading}</div>
              <div className="nb1-conf-row"><span>{td.summary.plan}</span><b>{planLabel}</b></div>
              <div className="nb1-conf-row"><span>{td.summary.cycle}</span><b>{cycleLabel}</b></div>
              <div className="nb1-conf-row"><span>{td.summary.delivery}</span><b>{td.summary.deliveryValue}</b></div>
              <div className="nb1-conf-div" />
              <div className="nb1-conf-row big"><span>{td.summary.monthly}</span><b>{priceFormatted}<small>/mo</small></b></div>
              <div className="nb1-conf-due">{td.summary.dueToday}</div>
              <p className="nb1-conf-charge">{chargeNotePrefix}<b>{td.summary.chargeWhen}</b>{chargeNoteSuffix}</p>
            </div>
            <a href={`/${locale}/login`} className="nb1-conf-cta">{td.dashboard}</a>
            <a href={`/${locale}/login`} className="nb1-conf-cta2">{td.trackOrder}</a>
            <div className="nb1-conf-support">
              <button type="button" className="nb1-conf-chat" onClick={() => { if (typeof window !== 'undefined' && (window as any).$chatwoot) (window as any).$chatwoot.toggle('open') }}>{td.chatUs}</button>
              {' '}{td.supportLine}{' '}
              <a href={`mailto:${td.supportEmail}`}>{td.supportEmail}</a>
            </div>
          </aside>
        </div>
      </div>

      {/* Legal footer */}
      <div className="nb1-conf-legal">
        {[
          { label: t.legal.privacy, href: `/${locale}/privacy` },
          { label: t.legal.terms,   href: `/${locale}/terms` },
          { label: t.legal.imprint, href: `/${locale}/imprint` },
          { label: t.legal.gdpr,    href: `/${locale}/gdpr` },
        ].map((l, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="nb1-conf-legal-dot">·</span>}
            <a href={l.href} className="nb1-conf-legal-link">{l.label}</a>
          </React.Fragment>
        ))}
        <span className="nb1-conf-legal-dot">·</span>
        <span>{t.legal.copyright}</span>
      </div>
    </div>
  )
}
