import type { HttpContext } from '@adonisjs/core/http'
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} from '#validators/auth_validator'
import type { IAuthService } from '#services/interfaces/i_auth_service'
import type User from '#models/user'

/*
|--------------------------------------------------------------------------
| AuthController
|--------------------------------------------------------------------------
|
| Thin HTTP layer ONLY.
| Depends on IAuthService interface (Dependency Inversion).
|
*/
export default class AuthController {
  constructor(private readonly authService: IAuthService) {}

  /*
  |--------------------------------------------------------------------------
  | Helper — get authenticated user from context
  |--------------------------------------------------------------------------
  */
  private getAuthUser(ctx: HttpContext): User {
    const user = (ctx as any).authUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    return user
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/auth/register
  |--------------------------------------------------------------------------
  */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const result = await this.authService.register(data)

    return response.created({
      message: 'Account created successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/auth/login
  |--------------------------------------------------------------------------
  */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)
    const result = await this.authService.login(data)

    return response.ok({
      message: 'Login successful',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/auth/refresh
  |--------------------------------------------------------------------------
  */
  async refresh({ request, response }: HttpContext) {
    const { refreshToken } = await request.validateUsing(refreshTokenValidator)
    const tokens = await this.authService.refreshToken(refreshToken)

    return response.ok({
      message: 'Token refreshed successfully',
      data: { tokens },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/auth/guest
  |--------------------------------------------------------------------------
  */
  async guest({ response }: HttpContext) {
    const result = await this.authService.createGuest()

    return response.created({
      message: 'Guest session created successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/auth/logout
  |--------------------------------------------------------------------------
  */
  async logout(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const authHeader = ctx.request.header('Authorization') ?? ''
    const accessToken = authHeader.replace('Bearer ', '').trim()

    await this.authService.logout(user.id, accessToken)

    return ctx.response.ok({
      message: 'Logged out successfully',
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/auth/me
  |--------------------------------------------------------------------------
  */
  async me(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const fullUser = await this.authService.me(user.id)

    return ctx.response.ok({
      data: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        isGuest: fullUser.isGuest,
        createdAt: fullUser.createdAt.toISO(),
      },
    })
  }
}
