import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import RateLimitService from '#services/rate_limit_service'
import { rateLimitConfig, type RateLimitRule } from '#config/rate_limit'
import app from '@adonisjs/core/services/app'

/*
|--------------------------------------------------------------------------
| RateLimitMiddleware
|--------------------------------------------------------------------------
|
| Factory middleware — call with a rule to create a specific limiter.
| Adds standard rate limit headers to every response.
|
*/
export default class RateLimitMiddleware {
  private rateLimitService = new RateLimitService()

  /*
  |--------------------------------------------------------------------------
  | Get client IP (proxy-aware)
  |--------------------------------------------------------------------------
  */
  private getClientIp(ctx: HttpContext): string {
    const forwarded = ctx.request.header('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    return ctx.request.header('x-real-ip') || ctx.request.ip() || 'unknown'
  }

  /*
  |--------------------------------------------------------------------------
  | Get rate limit key
  |--------------------------------------------------------------------------
  | Uses userId if authenticated, falls back to IP
  */
  private getRateLimitKey(ctx: HttpContext): string {
    const user = (ctx as any).authUser
    if (user?.id) return `user:${user.id}`
    return `ip:${this.getClientIp(ctx)}`
  }

  /*
  |--------------------------------------------------------------------------
  | Apply rate limit with given rule
  |--------------------------------------------------------------------------
  */
  async handle(ctx: HttpContext, next: NextFn, rule: RateLimitRule): Promise<void> {
    if (app.inTest && ctx.request.header('x-test-rate-limit') !== 'true') {
      return next()
    }
    const key = this.getRateLimitKey(ctx)
    const result = await this.rateLimitService.check(key, rule)

    // Set standard rate limit headers
    ctx.response.header('X-RateLimit-Limit', String(result.total))
    ctx.response.header('X-RateLimit-Remaining', String(result.remaining))
    ctx.response.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

    if (!result.allowed) {
      ctx.response.header('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)))

      ctx.response.tooManyRequests({
        message: 'Too many requests. Please try again later.',
        code: 'E_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        resetAt: new Date(result.resetAt).toISOString(),
      })
      return
    }

    await next()
  }
}

/*
|--------------------------------------------------------------------------
| Named Rate Limit Factories
|--------------------------------------------------------------------------
| Use these in routes.ts for clean syntax
*/
export const rateLimits = {
  global: () => ({
    rule: rateLimitConfig.global,
  }),

  api: () => ({
    rule: rateLimitConfig.api,
  }),

  login: () => ({
    rule: rateLimitConfig.auth.login,
  }),

  register: () => ({
    rule: rateLimitConfig.auth.register,
  }),

  guest: () => ({
    rule: rateLimitConfig.auth.guest,
  }),

  refresh: () => ({
    rule: rateLimitConfig.auth.refresh,
  }),

  upload: () => ({
    rule: rateLimitConfig.upload,
  }),

  message: () => ({
    rule: rateLimitConfig.message,
  }),
}
