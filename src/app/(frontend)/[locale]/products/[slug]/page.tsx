import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { JsonLd, type JsonLdValue } from '@/components/JsonLd'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'

// ISR: cache product pages — the DB query becomes a cache hit after the first
// render, re-validated every 10 min, instead of a live query per request.
export const revalidate = 600

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug, locale } = await params

  const payload = await getPayload({ config })

  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    // `payload.config.ts` sets no `defaultDepth`, so an omitted depth is 2.
    // This page reads three scalars off the result — `jsonLd`, `name` and
    // `description` — so those two levels of relationship resolution were
    // bought and thrown away on every render.
    //
    // Raise this if the page starts rendering a related document, a product
    // image being the obvious one. At depth 0 a relationship arrives as a bare
    // id and renders as nothing, which fails silently rather than throwing.
    depth: 0,
  })

  const product = res.docs?.[0]
  if (!product) return notFound()

  const productJsonLd: JsonLdValue = (product?.jsonLd ?? null) as JsonLdValue

  return (
    <>
      <Header locale={locale} />

      {/* ✅ Per-product JSON-LD */}
      <JsonLd data={productJsonLd} />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
      </main>

      <Footer locale={locale} />
    </>
  )
}
