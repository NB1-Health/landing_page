import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '@/middleware'
import { storePlanSelection } from '@/lib/plans/selectionStore'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('runtime boundaries', () => {
  it('leaves application API routes outside locale routing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ docs: [] })),
    )

    const response = await middleware(
      new NextRequest('http://localhost:3000/api/meta/events', { method: 'POST' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('location')).toBeNull()
  })

  it('does not dispatch browser events after an SSR plan-selection write', () => {
    vi.useFakeTimers()
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })
    vi.stubGlobal('window', undefined)

    expect(() => storePlanSelection({ plan: 'core' })).not.toThrow()
    expect(() => vi.runAllTimers()).not.toThrow()
  })
})
