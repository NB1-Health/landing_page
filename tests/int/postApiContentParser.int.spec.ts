import { describe, expect, it } from 'vitest'

import { parseApiContent } from '@/collections/Posts/hooks/parseApiContent'
import { parseHtmlToContent } from '@/utilities/parseHtmlToBlocks'

const richText = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
          },
        ],
      },
    ],
  },
})

const runHook = (args: Record<string, unknown>) =>
  parseApiContent(args as never) as unknown as Record<string, unknown>

describe('API post HTML parsing', () => {
  it('preserves ordinary links and inline formatting', () => {
    const document = parseHtmlToContent(
      '<p>Read <a href="https://example.com/guide" target="_blank"><strong>the guide</strong></a> today.</p>',
    )
    const paragraph = document.root.children[0] as {
      children: Array<Record<string, unknown>>
    }

    expect(paragraph.children).toEqual([
      expect.objectContaining({ type: 'text', text: 'Read ' }),
      expect.objectContaining({
        type: 'link',
        fields: {
          linkType: 'custom',
          newTab: true,
          url: 'https://example.com/guide',
        },
        children: [expect.objectContaining({ type: 'text', text: 'the guide', format: 1 })],
      }),
      expect.objectContaining({ type: 'text', text: ' today.' }),
    ])
  })

  it('rejects unsafe link protocols', () => {
    expect(() => parseHtmlToContent('<p><a href="javascript:alert(1)">Click</a></p>')).toThrow(
      'Unsupported link protocol "javascript:".',
    )
  })

  it('rejects unsupported, malformed, and unclosed block markers', () => {
    expect(() => parseHtmlToContent('<!-- block:gallery --><p>Image</p><!-- /block -->')).toThrow(
      'Unsupported block marker "gallery".',
    )

    expect(() => parseHtmlToContent('<!-- block:cta --><p>Order now</p>')).toThrow(
      'Block "cta" is missing its closing marker.',
    )

    expect(() => parseHtmlToContent('<!-- /block --><p>Text</p>')).toThrow(
      'Found a closing block marker without an opening marker.',
    )

    expect(() => parseHtmlToContent('<!-- block cta --><p>Text</p>')).toThrow(
      'Malformed block marker "block cta".',
    )
  })

  it.each(['', '   ', '<p> </p><!-- editorial note -->'])('rejects empty input: %j', (html) => {
    expect(() => parseHtmlToContent(html)).toThrow(
      /cannot be empty|did not contain any usable content/,
    )
  })

  it('parses supported embedded blocks', () => {
    const document = parseHtmlToContent(
      '<!-- block:cta --><p>Order your kit.</p><a href="/order">Order</a><!-- /block -->',
    )

    expect(document.root.children[0]).toEqual(
      expect.objectContaining({
        type: 'block',
        fields: expect.objectContaining({
          blockType: 'ctaBlock',
          body: 'Order your kit.',
          buttonUrl: '/order',
        }),
      }),
    )
  })

  it('rejects supported blocks whose required content is missing', () => {
    expect(() => parseHtmlToContent('<!-- block:cta --><!-- /block -->')).toThrow(
      'Block "cta" requires body text.',
    )

    expect(() =>
      parseHtmlToContent('<!-- block:dataTable --><p>Not a table</p><!-- /block -->'),
    ).toThrow('Block "dataTable" requires a table.')
  })
})

describe('API post ingestion hook', () => {
  it('parses valid API-source drafts before saving', () => {
    const result = runHook({
      data: {
        source: 'api',
        intro: richText('Intro'),
        htmlContent: '<p>Article body.</p>',
      },
      operation: 'create',
    })

    expect(result.content).toEqual(
      expect.objectContaining({
        root: expect.objectContaining({
          children: [expect.objectContaining({ type: 'paragraph' })],
        }),
      }),
    )
  })

  it('requires intro and HTML content for API-source drafts', () => {
    expect(() =>
      runHook({
        data: { source: 'api', htmlContent: '<p>Article body.</p>' },
        operation: 'create',
      }),
    ).toThrow('API posts require a non-empty intro.')

    expect(() =>
      runHook({
        data: { source: 'api', intro: richText('Intro'), htmlContent: '   ' },
        operation: 'create',
      }),
    ).toThrow('API posts require non-empty HTML content.')
  })

  it('does not overwrite editor changes when source HTML is unchanged', () => {
    const editedContent = richText('Edited in Payload')
    const data = { title: 'Updated title' }
    const result = runHook({
      data,
      operation: 'update',
      originalDoc: {
        source: 'api',
        intro: richText('Intro'),
        htmlContent: '<p>Original pipeline HTML.</p>',
        content: editedContent,
      },
    })

    expect(result).toBe(data)
    expect(result).not.toHaveProperty('content')
  })

  it('leaves manual-source posts unchanged', () => {
    const data = { source: 'manual', htmlContent: '' }

    expect(runHook({ data, operation: 'create' })).toBe(data)
  })
})
