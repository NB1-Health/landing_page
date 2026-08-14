import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const productionDeployFiles = ['.github/workflows/deploy-prod.yml', 'deploy-prod.sh']
const unsafePatterns = [
  ['staging database environment', /\.env\.stg/i],
  ['database dump', /\bpg_dump\b/i],
  ['database restore', /\bpg_restore\b/i],
  ['destructive schema operation', /\bDROP\s+(?:SCHEMA|TABLE|TYPE)\b/i],
  ['staging-to-production dump marker', /stg_to_prod/i],
  ['database synchronization command', /\b(?:db:sync-stg|sync-from-stg)\b/i],
]

export function findUnsafeProductionDeployPatterns(source) {
  return unsafePatterns
    .filter(([, pattern]) => pattern.test(source))
    .map(([description]) => description)
}

export function assertSafeProductionDeploy(root = process.cwd()) {
  const findings = productionDeployFiles.flatMap((file) =>
    findUnsafeProductionDeployPatterns(readFileSync(resolve(root, file), 'utf8')).map(
      (description) => `${file}: ${description}`,
    ),
  )

  if (findings.length > 0) {
    throw new Error(
      `Production deploy must preserve its database. Remove:\n${findings
        .map((finding) => `- ${finding}`)
        .join('\n')}`,
    )
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assertSafeProductionDeploy()
  console.log('Production deployment is code-only; CMS content is preserved.')
}
