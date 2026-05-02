import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

/*
|--------------------------------------------------------------------------
| Redis Configuration
|--------------------------------------------------------------------------
|
| Redis is used for:
|   1. Storing refresh tokens (with TTL-based expiry)
|   2. Pub/Sub for real-time message broadcasting (Phase 5)
|
*/
const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | Main Connection
    |--------------------------------------------------------------------------
    */
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: 'convocore:',
      /*
      |--------------------------------------------------------------------------
      | Retry Strategy
      | Exponential backoff — max 2 seconds between retries
      |--------------------------------------------------------------------------
      */
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000)
      },
    },
  },
})

export default redisConfig
