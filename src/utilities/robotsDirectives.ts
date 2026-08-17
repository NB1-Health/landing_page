export function parseRobotsDirectives(value: null | string | undefined) {
  if (!value) return undefined
  const tokens = new Set(value.split(',').map((token) => token.trim().toLowerCase()))

  return {
    index: tokens.has('index'),
    follow: tokens.has('follow'),
  }
}
