import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import redis from '@adonisjs/redis/services/main'
import env from '#start/env'
import UserRepository from '#repositories/user_repository'

/*
|--------------------------------------------------------------------------
| Auth Middleware
|--------------------------------------------------------------------------
|
| Validates JWT access token on protected routes.
| Stores authenticated user in ctx via AdonisJS auth system.
|
*/
export default class AuthMiddleware {
  redirectTo = '/api/v1/auth/login'

  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('Authorization')

    // 1. Check Authorization header exists
    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.response.unauthorized({
        message: 'Access token is required',
        code: 'E_UNAUTHORIZED',
      })
    }

    const token = authHeader.replace('Bearer ', '').trim()

    // 2. Check Redis blacklist (logged out tokens)
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return ctx.response.unauthorized({
        message: 'Token has been revoked. Please login again.',
        code: 'E_TOKEN_REVOKED',
      })
    }

    // 3. Verify JWT signature and expiry
    let payload: jwt.JwtPayload
    try {
      payload = jwt.verify(token, env.get('JWT_SECRET')) as jwt.JwtPayload
    } catch (error) {
      const message =
        error instanceof jwt.TokenExpiredError
          ? 'Access token has expired. Please refresh your token.'
          : 'Invalid access token'

      return ctx.response.unauthorized({
        message,
        code: 'E_INVALID_TOKEN',
      })
    }

    // 4. Ensure it's an access token (not refresh token)
    if (payload.type !== 'access') {
      return ctx.response.unauthorized({
        message: 'Invalid token type',
        code: 'E_INVALID_TOKEN_TYPE',
      })
    }

    // 5. Load user from DB
    const userRepository = new UserRepository()
    const user = await userRepository.findById(payload.sub as string)

    if (!user) {
      return ctx.response.unauthorized({
        message: 'User account not found',
        code: 'E_USER_NOT_FOUND',
      })
    }

    // 6. Store user in request data for downstream access
    //    AdonisJS v6: ctx.auth.user is read-only getter
    //    We use ctx.request to carry the authenticated user
    ctx.request.updateBody({
      ...ctx.request.body(),
    })

    // Store on ctx directly using a custom property
    ;(ctx as any).authUser = user

    await next()
  }
}
