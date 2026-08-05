import { isAdminUser } from '@/access/roles'

type SeedEnvironment = {
  ENABLE_DESTRUCTIVE_SEED?: string
  NODE_ENV?: string
}

export function isDestructiveSeedEnabled(environment: SeedEnvironment = process.env): boolean {
  return environment.NODE_ENV === 'development' && environment.ENABLE_DESTRUCTIVE_SEED === 'true'
}

export function canRunDestructiveSeed(
  user: unknown,
  environment: SeedEnvironment = process.env,
): boolean {
  return isDestructiveSeedEnabled(environment) && isAdminUser(user)
}
