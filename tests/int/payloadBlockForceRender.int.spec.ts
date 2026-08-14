import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Payload nested block rendering patch', () => {
  it('renders fields for expanded block rows without waiting for viewport observation', () => {
    const blockField = readFileSync(
      resolve('node_modules/@payloadcms/ui/dist/fields/Blocks/index.js'),
      'utf8',
    )
    const blockRow = readFileSync(
      resolve('node_modules/@payloadcms/ui/dist/fields/Blocks/BlockRow.js'),
      'utf8',
    )
    const clientBundle = readFileSync(
      resolve('node_modules/@payloadcms/ui/dist/exports/client/index.js'),
      'utf8',
    )

    expect(blockField).toContain('forceRender: forceRender')
    expect(blockField).toContain('schemaPath: `${schemaPath}.${blockConfig.slug}`')
    expect(blockRow).toMatch(
      /RenderFields,[\s\S]*?fields,[\s\S]*?forceRender: forceRender \|\| !row\.collapsed/,
    )
    expect(clientBundle).toContain(
      'bn(No,{className:`${ei}__fields`,fields:c,forceRender:!x.collapsed,margins:"small"',
    )
    expect(clientBundle).toContain('schemaPath:`${S}.${qe.slug}`,setCollapse:Q')
  })
})
