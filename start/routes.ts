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
  |────────────────────────────────────────────────────────────────────
  | Auth Routes — /api/v1/auth/*
  |────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
        // Public
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

        // Protected
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

    /*
  |────────────────────────────────────────────────────────────────────
  | Conversation Routes — /api/v1/conversations/*
  |────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
        // Create conversation
        router.post('/', async (ctx) => {
          const { default: ConversationController } =
            await import('#controllers/conversation_controller')
          const conversationService = await ctx.containerResolver.make('IConversationService')
          return new ConversationController(conversationService).create(ctx)
        })

        // List my conversations
        router.get('/', async (ctx) => {
          const { default: ConversationController } =
            await import('#controllers/conversation_controller')
          const conversationService = await ctx.containerResolver.make('IConversationService')
          return new ConversationController(conversationService).list(ctx)
        })

        // Get single conversation
        router
          .get('/:id', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).show(ctx)
          })
          .use(middleware.conversationAccess())

        // Delete conversation
        router
          .delete('/:id', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).destroy(ctx)
          })
          .use(middleware.conversationAccess())

        // Add participant
        router
          .post('/:id/participants', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).addParticipant(ctx)
          })
          .use(middleware.conversationAccess())

        // Remove participant
        router
          .delete('/:id/participants/:userId', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).removeParticipant(ctx)
          })
          .use(middleware.conversationAccess())
      })
      .prefix('/conversations')
      .use(middleware.auth())

    // ── Phase 4: Messages (coming soon) ───────────────────────────────
    // ── Phase 5: Real-time (coming soon) ──────────────────────────────
  })
  .prefix('/api/v1')
