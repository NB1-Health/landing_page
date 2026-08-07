'use client'

import React, { useState } from 'react'
import type { FAQBlock as FAQBlockProps } from '@/payload-types'
import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from '@payloadcms/richtext-lexical/lexical'

import RichText from '@/components/RichText'
import { getDictionary } from '@/i18n/getDictionary'
import '@/styles/article-template.css'

type Props = FAQBlockProps & {
  locale?: string
}

type RichTextValue = SerializedEditorState<SerializedLexicalNode> | null | undefined

export const FAQBlockComponent: React.FC<Props> = ({ items, locale }) => {
  const dict = getDictionary(locale)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!items?.length) return null

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="art-card">
      <h2 className="art-heading">{dict.faq.heading}</h2>

      <div>
        {items.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div key={index} className="art-faq__item">
              <button onClick={() => toggle(index)} className="art-faq__question">
                <span>{item.question}</span>
                <i className={`art-faq__icon${isOpen ? ' art-faq__icon--open' : ''}`}>+</i>
              </button>

              {isOpen && (
                <div className="art-faq__answer [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul:first-child]:mt-0 [&_ul:last-child]:mb-0 [&_ol:first-child]:mt-0 [&_ol:last-child]:mb-0">
                  <RichText data={item.answer} enableGutter={false} enableProse={false} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
