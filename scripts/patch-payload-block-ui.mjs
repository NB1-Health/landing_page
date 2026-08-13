import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const payloadUIRoot = resolve('node_modules/@payloadcms/ui')
const packageJSON = JSON.parse(readFileSync(resolve(payloadUIRoot, 'package.json'), 'utf8'))

if (packageJSON.version !== '3.82.1') {
  throw new Error(
    `Payload UI patch expects @payloadcms/ui 3.82.1, found ${packageJSON.version}. Review or remove the patch before upgrading.`,
  )
}

const bundlePath = resolve(payloadUIRoot, 'dist/exports/client/index.js')
let bundle = readFileSync(bundlePath, 'utf8')

const replacements = [
  {
    label: 'expanded block field rendering',
    before: 'pn(No,{className:`${ei}__fields`,fields:c,margins:"small"',
    after: 'pn(No,{className:`${ei}__fields`,fields:c,forceRender:!w.collapsed,margins:"small"',
  },
  {
    label: 'block schema path separator',
    before: 'schemaPath:I+je.slug,setCollapse:ae',
    after: 'schemaPath:`${I}.${je.slug}`,setCollapse:ae',
  },
]

let changed = false

for (const { after, before, label } of replacements) {
  if (bundle.includes(after)) continue

  const occurrences = bundle.split(before).length - 1
  if (occurrences !== 1) {
    throw new Error(`Could not safely patch Payload UI ${label}: found ${occurrences} matches`)
  }

  bundle = bundle.replace(before, after)
  changed = true
}

if (changed) {
  writeFileSync(bundlePath, bundle)
  console.log('Applied Payload expanded-block rendering patch.')
}
