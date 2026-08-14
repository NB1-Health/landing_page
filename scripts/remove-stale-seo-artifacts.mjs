import { rmSync } from 'node:fs'

for (const file of ['public/robots.txt', 'public/sitemap.xml']) {
  rmSync(file, { force: true })
}
