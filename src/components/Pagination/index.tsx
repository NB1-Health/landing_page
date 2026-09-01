'use client'
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'

import { defaultLocale, isAppLocale } from '@/i18n/config'

export const Pagination: React.FC<{
  className?: string
  /**
   * Collection segment this pager belongs to, without a locale prefix or a
   * trailing slash — e.g. `/journal`. The locale is prepended automatically
   * from the route params.
   */
  basePath?: string
  page: number
  totalPages: number
}> = (props) => {
  const router = useRouter()
  const params = useParams()

  const { className, basePath = '/journal', page, totalPages } = props

  // Previously the pager pushed a bare `/posts/page/N` with no locale segment,
  // which does not resolve under the `[locale]` route group — every click
  // bounced through the middleware locale redirect and could land the visitor
  // in a different locale than the one they were reading. Derive it instead.
  const localeParam = Array.isArray(params?.locale) ? params.locale[0] : params?.locale
  const locale = isAppLocale(String(localeParam)) ? String(localeParam) : defaultLocale
  const pageHref = (n: number) => `/${locale}${basePath}/page/${n}`

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(pageHref(page - 1))
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(pageHref(page - 1))
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              onClick={() => {
                router.push(pageHref(page))
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(pageHref(page + 1))
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              disabled={!hasNextPage}
              onClick={() => {
                router.push(pageHref(page + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
