import type { Payload, PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { isAdmin } from '@/access/roles'
import { getPreviewTarget, verifyPreviewToken } from '@/utilities/preview'

async function getNormalizedPreviewPath(
  payload: Payload,
  target: NonNullable<ReturnType<typeof getPreviewTarget>>,
  user: NonNullable<PayloadRequest['user']>,
) {
  if (target.collection !== 'pages' || target.path === `/${target.locale}`) return target.path

  const result = await payload.find({
    collection: 'pages',
    draft: true,
    depth: 0,
    fallbackLocale: false,
    limit: 1,
    locale: target.locale,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    user,
    where: { slug: { equals: target.slug } },
  })
  const page = result.docs[0]
  if (!page?.id) return target.path

  const english = await payload.findByID({
    collection: 'pages',
    id: page.id,
    draft: true,
    depth: 0,
    disableErrors: true,
    fallbackLocale: false,
    locale: 'en',
    overrideAccess: false,
    select: { slug: true },
    user,
  })

  return english?.slug === 'home' || english?.slug === 'home-page'
    ? `/${target.locale}`
    : target.path
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const { locale } = await params
  const target = getPreviewTarget({
    collection: searchParams.get('collection'),
    locale,
    slug: searchParams.get('slug'),
  })
  const validToken =
    target &&
    verifyPreviewToken({
      secret: process.env.PREVIEW_SECRET,
      target,
      token: searchParams.get('token'),
    })

  if (!target || !validToken) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const payload = await getPayload({ config: configPromise })
  let user: NonNullable<PayloadRequest['user']>
  try {
    const auth = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
    if (!auth.user || !isAdmin(auth.user)) {
      const draft = await draftMode()
      draft.disable()
      return new Response('You are not allowed to preview this page', { status: 403 })
    }
    user = auth.user
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview')
    const draft = await draftMode()
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const path = await getNormalizedPreviewPath(payload, target, user)
  const draft = await draftMode()

  draft.enable()

  redirect(path)
}
