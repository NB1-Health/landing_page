export function isMarketingRuntimeEnabled(environment: { NODE_ENV?: string } = process.env) {
  return environment.NODE_ENV === 'production'
}
