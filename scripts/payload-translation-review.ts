import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { Pages } from '@/collections/Pages'
import { isAppLocale, type AppLocale } from '@/i18n/config'
import {
  buildTranslationReviewPack,
  checkTranslationReview,
  readReviewIdentity,
  type TranslationReviewPack,
} from './lib/payload-translation-review'

async function currentPack(
  payload: Payload,
  pageId: string,
  targetLocale: string,
): Promise<TranslationReviewPack> {
  if (!isAppLocale(targetLocale) || targetLocale === 'en') {
    throw new Error(`Unsupported target locale: ${targetLocale}`)
  }

  const [source, target] = await Promise.all([
    payload.findByID({
      collection: 'pages',
      id: pageId,
      locale: 'en',
      fallbackLocale: false,
      draft: true,
      depth: 0,
      overrideAccess: true,
    }),
    payload.findByID({
      collection: 'pages',
      id: pageId,
      locale: targetLocale as AppLocale,
      fallbackLocale: false,
      disableErrors: true,
      draft: true,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  return buildTranslationReviewPack({
    fields: Pages.fields,
    pageId: String(source.id),
    source,
    sourceVersion: source.updatedAt,
    target: target ?? {},
    targetLocale,
  })
}

function usage(): never {
  throw new Error(
    [
      'Usage:',
      '  npm run translations:review -- export <page-id> <locale> [out.json]',
      '  npm run translations:review -- check <returned-review.json>',
    ].join('\n'),
  )
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  const payload = await getPayload({ config })

  try {
    if (command === 'export') {
      const [pageId, targetLocale, outFile] = args
      if (!pageId || !targetLocale) usage()
      const pack = await currentPack(payload, pageId, targetLocale)
      const output = `${JSON.stringify(pack, null, 2)}\n`
      if (outFile) {
        await writeFile(resolve(outFile), output)
      } else {
        process.stdout.write(output)
      }
      return
    }

    if (command === 'check') {
      const [reviewFile] = args
      if (!reviewFile) usage()
      const review = JSON.parse(await readFile(resolve(reviewFile), 'utf8')) as unknown
      const { pageId, targetLocale } = readReviewIdentity(review)
      const check = checkTranslationReview(review, await currentPack(payload, pageId, targetLocale))
      process.stdout.write(`${JSON.stringify(check, null, 2)}\n`)
      return
    }

    usage()
  } finally {
    await payload.destroy()
  }
}

await main()
