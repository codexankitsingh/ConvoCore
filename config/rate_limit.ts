/*
|--------------------------------------------------------------------------
| Rate Limit Configuration
|--------------------------------------------------------------------------
|
| Defines rate limit rules for different route groups.
| All limits are stored in Redis for distributed support.
|
*/

export const rateLimitConfig = {
  /*
  |--------------------------------------------------------------------------
  | Global Rate Limit
  |--------------------------------------------------------------------------
  | Applied to ALL incoming requests regardless of auth status.
  | Keyed by IP address.
  */
  global: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rl:global',
  },

  /*
  |--------------------------------------------------------------------------
  | API Rate Limit
  |--------------------------------------------------------------------------
  | Applied to all authenticated API routes.
  | Keyed by userId.
  */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rl:api',
  },

  /*
  |--------------------------------------------------------------------------
  | Auth Routes
  |--------------------------------------------------------------------------
  */
  auth: {
    login: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyPrefix: 'rl:auth:login',
    },
    register: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'rl:auth:register',
    },
    guest: {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'rl:auth:guest',
    },
    refresh: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'rl:auth:refresh',
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Upload Routes
  |--------------------------------------------------------------------------
  */
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:upload',
  },

  /*
  |--------------------------------------------------------------------------
  | Message Routes
  |--------------------------------------------------------------------------
  */
  message: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rl:message',
  },
}

export type RateLimitRule = {
  maxRequests: number
  windowMs: number
  keyPrefix: string
}
