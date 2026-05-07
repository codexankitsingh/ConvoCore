import redis from '@adonisjs/redis/services/main'
import type { RateLimitRule } from '#config/rate_limit'

/*
|--------------------------------------------------------------------------
| RateLimitService
|--------------------------------------------------------------------------
|
| Redis-backed sliding window rate limiter.
| NOTE: AdonisJS Redis client automatically prepends the keyPrefix
| defined in config/redis.ts (e.g. "convocore:") to all keys.
| So our keyPrefix in rateLimitConfig should NOT include it.
|
*/
export default class RateLimitService {
  /*
  |--------------------------------------------------------------------------
  | Check Rate Limit
  |--------------------------------------------------------------------------
  */
  async check(
    key: string,
    rule: RateLimitRule
  ): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
    total: number
  }> {
    const redisKey = `${rule.keyPrefix}:${key}`
    const windowSec = Math.ceil(rule.windowMs / 1000)

    // Atomic increment + expiry using pipeline
    const pipeline = redis.pipeline()
    pipeline.incr(redisKey)
    pipeline.ttl(redisKey)
    const results = await pipeline.exec()

    const current = (results?.[0]?.[1] as number) ?? 1
    let ttl = (results?.[1]?.[1] as number) ?? -1

    // Set expiry only on first request in window
    if (ttl < 0) {
      await redis.expire(redisKey, windowSec)
      ttl = windowSec
    }

    const resetAt = Date.now() + ttl * 1000
    const remaining = Math.max(0, rule.maxRequests - current)
    const allowed = current <= rule.maxRequests

    return { allowed, remaining, resetAt, total: rule.maxRequests }
  }

  /*
  |--------------------------------------------------------------------------
  | Reset Rate Limit
  |--------------------------------------------------------------------------
  */
  async reset(key: string, rule: RateLimitRule): Promise<void> {
    const redisKey = `${rule.keyPrefix}:${key}`
    await redis.del(redisKey)
  }

  /*
  |--------------------------------------------------------------------------
  | Get Current Count
  |--------------------------------------------------------------------------
  */
  async getCount(key: string, rule: RateLimitRule): Promise<number> {
    const redisKey = `${rule.keyPrefix}:${key}`
    const val = await redis.get(redisKey)
    return val ? parseInt(val, 10) : 0
  }
}
