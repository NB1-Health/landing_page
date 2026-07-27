// Any setup scripts you might need go here
;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// Load .env files
import 'dotenv/config'
