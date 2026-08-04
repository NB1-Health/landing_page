import { createHash } from 'node:crypto'

import type { Block, Field } from 'payload'

const SCHEMA_VERSION = 1

type UnknownRecord = Record<string, unknown>

export type TranslationReviewItem = {
  key: string
  context: string
  valueType: 'richTextText' | 'text' | 'textarea'
  source: string
  sourceHash: string
  targetBefore: string
  status: 'identity' | 'missing' | 'translated'
}

export type TranslationReviewPack = {
  schemaVersion: 1
  page: {
    collection: 'pages'
    id: string
    sourceLocale: 'en'
    targetLocale: string
    sourceVersion: string
    sourceHash: string
  }
  items: TranslationReviewItem[]
  changes: []
}

export type TranslationReviewCheck = {
  schemaVersion: 1
  page: TranslationReviewPack['page']
  pageSourceStale: boolean
  summary: {
    applies: number
    conflicts: number
    invalid: number
    stale: number
    unchanged: number
  }
  changes: {
    key: string
    status: 'apply' | 'conflict' | 'invalid' | 'stale' | 'unchanged'
    reason?: string
  }[]
}

type CollectContext = {
  context: string[]
  fieldPath: string[]
  identity: string[]
  localized: boolean
  pageId: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hash(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function labelFor(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  return fallback
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function rowId(row: unknown, context: string): string {
  if (!isRecord(row) || (typeof row.id !== 'string' && typeof row.id !== 'number')) {
    throw new Error(`${context} has no stable Payload row ID`)
  }
  return String(row.id)
}

function findRow(rows: unknown, id: string): UnknownRecord {
  if (!Array.isArray(rows)) return {}
  return (
    (rows.find(
      (row) =>
        isRecord(row) &&
        (typeof row.id === 'string' || typeof row.id === 'number') &&
        String(row.id) === id,
    ) as UnknownRecord | undefined) ?? {}
  )
}

function keyPart(value: string): string {
  return encodeURIComponent(value)
}

function itemKey(context: CollectContext, fieldPath: string[], textPath?: string[]): string {
  const identity = context.identity.length ? `/${context.identity.join('/')}` : ''
  const text = textPath ? `/text:${textPath.map(keyPart).join('.')}` : ''
  return `pages:${keyPart(context.pageId)}${identity}/field:${fieldPath.map(keyPart).join('.')}${text}`
}

function statusFor(source: string, target: string): TranslationReviewItem['status'] {
  if (!target) return 'missing'
  return source === target ? 'identity' : 'translated'
}

function getAtPath(value: unknown, path: string[]): unknown {
  let current = value
  for (const part of path) {
    if (Array.isArray(current)) {
      current = current[Number(part)]
    } else if (isRecord(current)) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return current
}

function collectRichTextItems(
  source: unknown,
  target: unknown,
  context: CollectContext,
  fieldPath: string[],
  fieldContext: string,
): TranslationReviewItem[] {
  const items: TranslationReviewItem[] = []

  const visit = (value: unknown, path: string[]) => {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, [...path, String(index)]))
      return
    }
    if (!isRecord(value)) return

    if (value.type === 'text' && typeof value.text === 'string' && value.text.length > 0) {
      const textPath = [...path, 'text']
      const targetValue = getAtPath(target, textPath)
      const targetText = typeof targetValue === 'string' ? targetValue : ''
      items.push({
        key: itemKey(context, fieldPath, textPath),
        context: fieldContext,
        valueType: 'richTextText',
        source: value.text,
        sourceHash: hash(value.text),
        targetBefore: targetText,
        status: statusFor(value.text, targetText),
      })
      return
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, [...path, key])
    }
  }

  visit(source, [])
  return items
}

function collectFields(
  fields: Field[],
  sourceValue: unknown,
  targetValue: unknown,
  context: CollectContext,
): TranslationReviewItem[] {
  const source = isRecord(sourceValue) ? sourceValue : {}
  const target = isRecord(targetValue) ? targetValue : {}
  const items: TranslationReviewItem[] = []

  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          items.push(
            ...collectFields(tab.fields, source[tab.name], target[tab.name], {
              ...context,
              context: [...context.context, labelFor(tab.label, tab.name)],
              fieldPath: [...context.fieldPath, tab.name],
            }),
          )
        } else {
          items.push(...collectFields(tab.fields, source, target, context))
        }
      }
      continue
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      items.push(...collectFields(field.fields, source, target, context))
      continue
    }

    if (!('name' in field) || !field.name) continue

    const fieldLabel = labelFor(field.label, field.name)
    const localized = context.localized || ('localized' in field && Boolean(field.localized))

    if (field.type === 'group') {
      items.push(
        ...collectFields(field.fields, source[field.name], target[field.name], {
          ...context,
          context: [...context.context, fieldLabel],
          fieldPath: [...context.fieldPath, field.name],
          localized,
        }),
      )
      continue
    }

    if (field.type === 'array') {
      const sourceRows = source[field.name]
      if (!Array.isArray(sourceRows)) continue
      const identityName = [...context.fieldPath, field.name].join('.')

      sourceRows.forEach((sourceRow, index) => {
        const id = rowId(
          sourceRow,
          `${[...context.context, fieldLabel].join(' > ')} row ${index + 1}`,
        )
        items.push(
          ...collectFields(field.fields, sourceRow, findRow(target[field.name], id), {
            ...context,
            context: [...context.context, `${fieldLabel} ${index + 1}`],
            fieldPath: [],
            identity: [...context.identity, `${keyPart(identityName)}:${keyPart(id)}`],
            localized,
          }),
        )
      })
      continue
    }

    if (field.type === 'blocks') {
      const sourceBlocks = source[field.name]
      if (!Array.isArray(sourceBlocks)) continue
      const identityName = [...context.fieldPath, field.name].join('.')

      sourceBlocks.forEach((sourceBlock, index) => {
        if (!isRecord(sourceBlock) || typeof sourceBlock.blockType !== 'string') return
        const block = field.blocks.find(
          (candidate: Block) => candidate.slug === sourceBlock.blockType,
        )
        if (!block) throw new Error(`Unknown block type: ${sourceBlock.blockType}`)
        const id = rowId(sourceBlock, `${sourceBlock.blockType} block ${index + 1}`)
        const targetBlock = findRow(target[field.name], id)
        const blockLabel = labelFor(
          block.labels && 'singular' in block.labels ? block.labels.singular : undefined,
          block.slug,
        )

        items.push(
          ...collectFields(block.fields, sourceBlock, targetBlock, {
            ...context,
            context: [...context.context, blockLabel],
            fieldPath: [],
            identity: [...context.identity, `${keyPart(identityName)}:${keyPart(id)}`],
            localized,
          }),
        )
      })
      continue
    }

    if (
      !localized ||
      (field.type !== 'richText' && field.type !== 'text' && field.type !== 'textarea')
    ) {
      continue
    }

    const fieldPath = [...context.fieldPath, field.name]
    const fieldContext = [...context.context, fieldLabel].join(' > ')
    if (field.type === 'richText') {
      items.push(
        ...collectRichTextItems(
          source[field.name],
          target[field.name],
          context,
          fieldPath,
          fieldContext,
        ),
      )
      continue
    }

    const sourceText = source[field.name]
    if (typeof sourceText !== 'string' || sourceText.length === 0) continue
    const rawTargetText = target[field.name]
    const targetText = typeof rawTargetText === 'string' ? rawTargetText : ''
    items.push({
      key: itemKey(context, fieldPath),
      context: fieldContext,
      valueType: field.type,
      source: sourceText,
      sourceHash: hash(sourceText),
      targetBefore: targetText,
      status: statusFor(sourceText, targetText),
    })
  }

  return items
}

export function buildTranslationReviewPack({
  fields,
  pageId,
  source,
  sourceVersion,
  target,
  targetLocale,
}: {
  fields: Field[]
  pageId: string
  source: unknown
  sourceVersion: string
  target: unknown
  targetLocale: string
}): TranslationReviewPack {
  if (!targetLocale || targetLocale === 'en') throw new Error('targetLocale must not be English')

  const items = collectFields(fields, source, target, {
    context: [],
    fieldPath: [],
    identity: [],
    localized: false,
    pageId,
  })
  const keys = new Set(items.map((item) => item.key))
  if (keys.size !== items.length) throw new Error('Review pack contains duplicate stable keys')
  const sourceHash = hash(JSON.stringify(items.map(({ key, sourceHash }) => ({ key, sourceHash }))))

  return {
    schemaVersion: SCHEMA_VERSION,
    page: {
      collection: 'pages',
      id: pageId,
      sourceLocale: 'en',
      targetLocale,
      sourceVersion,
      sourceHash,
    },
    items,
    changes: [],
  }
}

function requireRecord(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object`)
  return value
}

function requireString(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} must be ${allowEmpty ? 'a string' : 'a non-empty string'}`)
  }
  return value
}

export function readReviewIdentity(review: unknown): { pageId: string; targetLocale: string } {
  const root = requireRecord(review, 'review')
  if (root.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion: ${String(root.schemaVersion)}`)
  }
  const page = requireRecord(root.page, 'page')
  if (page.collection !== 'pages' || page.sourceLocale !== 'en') {
    throw new Error('Review must identify an English-source Pages document')
  }
  return {
    pageId: requireString(page.id, 'page.id'),
    targetLocale: requireString(page.targetLocale, 'page.targetLocale'),
  }
}

export function checkTranslationReview(
  review: unknown,
  currentPack: TranslationReviewPack,
): TranslationReviewCheck {
  const root = requireRecord(review, 'review')
  const identity = readReviewIdentity(root)
  if (
    identity.pageId !== currentPack.page.id ||
    identity.targetLocale !== currentPack.page.targetLocale
  ) {
    throw new Error('Review page identity does not match the current pack')
  }
  if (!Array.isArray(root.changes)) throw new Error('changes must be an array')

  const submittedPage = requireRecord(root.page, 'page')
  const pageSourceStale = submittedPage.sourceHash !== currentPack.page.sourceHash
  const currentItems = new Map(currentPack.items.map((item) => [item.key, item]))
  const seen = new Set<string>()
  const changes: TranslationReviewCheck['changes'] = []

  root.changes.forEach((value, index) => {
    let key = `changes[${index}]`
    try {
      const change = requireRecord(value, key)
      key = requireString(change.key, `${key}.key`)
      const sourceHash = requireString(change.sourceHash, `${key}.sourceHash`)
      const targetBefore = requireString(change.targetBefore, `${key}.targetBefore`, true)
      const targetAfter = requireString(change.targetAfter, `${key}.targetAfter`, true)

      if (seen.has(key)) {
        changes.push({ key, status: 'invalid', reason: 'Duplicate key' })
        return
      }
      seen.add(key)

      const current = currentItems.get(key)
      if (!current) {
        changes.push({ key, status: 'invalid', reason: 'Unknown key' })
      } else if (sourceHash !== current.sourceHash) {
        changes.push({ key, status: 'stale', reason: 'English source changed' })
      } else if (targetBefore !== current.targetBefore) {
        changes.push({ key, status: 'conflict', reason: 'Target value changed' })
      } else if (targetAfter === targetBefore) {
        changes.push({ key, status: 'unchanged' })
      } else {
        changes.push({ key, status: 'apply' })
      }
    } catch (error) {
      changes.push({
        key,
        status: 'invalid',
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  })

  const summary = { applies: 0, conflicts: 0, invalid: 0, stale: 0, unchanged: 0 }
  for (const change of changes) {
    if (change.status === 'apply') summary.applies += 1
    else if (change.status === 'conflict') summary.conflicts += 1
    else summary[change.status] += 1
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    page: currentPack.page,
    pageSourceStale,
    summary,
    changes,
  }
}
