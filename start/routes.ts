import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
router.get('/health', async ({ response }) => {
  return response.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'convocore-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  })
})

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    /*
  |──────────────────────────────────────────────────────────────────────
  | Auth Routes — /api/v1/auth/*
  |──────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
        // Public routes (no auth required)
        router.post('/register', async (ctx) => {
          const { default: AuthController } = await import('#controllers/auth_controller')
          const authService = await ctx.containerResolver.make('IAuthService')
          return new AuthController(authService).register(ctx)
        })

        router.post('/login', async (ctx) => {
          const { default: AuthController } = await import('#controllers/auth_controller')
          const authService = await ctx.containerResolver.make('IAuthService')
          return new AuthController(authService).login(ctx)
        })

        router.post('/refresh', async (ctx) => {
          const { default: AuthController } = await import('#controllers/auth_controller')
          const authService = await ctx.containerResolver.make('IAuthService')
          return new AuthController(authService).refresh(ctx)
        })

        router.post('/guest', async (ctx) => {
          const { default: AuthController } = await import('#controllers/auth_controller')
          const authService = await ctx.containerResolver.make('IAuthService')
          return new AuthController(authService).guest(ctx)
        })

        // Protected routes (auth required)
        router
          .post('/logout', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).logout(ctx)
          })
          .use(middleware.auth())

        router
          .get('/me', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).me(ctx)
          })
          .use(middleware.auth())
      })
      .prefix('/auth')

    // ── Phase 3: Conversations (coming soon) ──────────────────────────
    // ── Phase 4: Messages (coming soon) ───────────────────────────────
    // ── Phase 6: Reactions (coming soon) ──────────────────────────────
  })
  .prefix('/api/v1')
