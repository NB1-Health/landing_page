import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Ad links (?discount=CODE) and creator pages hand a code to the checkout through
// readCheckoutOffer(). The redesign checkout was first built by copying the old checkout's
// readInfluencerOffer() call, which silently ignored link codes. These checks make any
// current or future checkout (a rebrand, a new block) fail here instead.

const SRC = path.resolve(__dirname, '../../src')
const HELPER = path.join(SRC, 'lib/influencerOffer.ts')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return name === 'migrations' ? [] : sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const files = sourceFiles(SRC).map((file) => ({
  file: path.relative(SRC, file),
  full: file,
  text: readFileSync(file, 'utf8'),
}))
const checkouts = files.filter(
  ({ full, text }) =>
    full !== path.join(SRC, 'lib/checkoutApi.ts') && /\bcheckout(Preview|Confirm)\(/.test(text),
)

describe('checkout offer contract', () => {
  it('finds the checkouts it guards', () => {
    expect(checkouts.map((c) => c.file)).toEqual(
      expect.arrayContaining([
        'blocks/checkoutBlocks/CheckoutForm/Component.client.tsx',
        'blocks/redesign/CheckoutPage/Component.tsx',
      ]),
    )
  })

  it('every checkout picks up creator AND ad-link codes via readCheckoutOffer()', () => {
    const missing = checkouts.filter(({ text }) => !/\breadCheckoutOffer\(/.test(text))
    expect(missing.map((c) => c.file), 'checkouts not calling readCheckoutOffer()').toEqual([])
  })

  it('nothing outside the helper reads only the creator offer', () => {
    const offenders = files.filter(
      ({ full, text }) => full !== HELPER && /\breadInfluencerOffer\(/.test(text),
    )
    expect(
      offenders.map((c) => c.file),
      'use readCheckoutOffer() so ?discount= link codes are not skipped',
    ).toEqual([])
  })
})
