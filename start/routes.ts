import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import transmit from '@adonisjs/transmit/services/main'
import RateLimitMiddleware from '#middleware/rate_limit_middleware'
import { rateLimitConfig } from '#config/rate_limit'

/*
|--------------------------------------------------------------------------
| Register Transmit SSE Routes
|--------------------------------------------------------------------------
*/
transmit.registerRoutes((route) => {
  route.use(middleware.auth())
})

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
    |──────────────────────────────────────────────────────────────────
    | Auth Routes — /api/v1/auth/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router
          .post('/register', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).register(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.auth.register)
          })

        router
          .post('/login', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).login(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.auth.login)
          })

        router
          .post('/refresh', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).refresh(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.auth.refresh)
          })

        router
          .post('/guest', async (ctx) => {
            const { default: AuthController } = await import('#controllers/auth_controller')
            const authService = await ctx.containerResolver.make('IAuthService')
            return new AuthController(authService).guest(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.auth.guest)
          })

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
    |──────────────────────────────────────────────────────────────────
    | Realtime Routes — /api/v1/realtime/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router.get('/info', async (ctx) => {
          const { default: RealtimeController } = await import('#controllers/realtime_controller')
          return new RealtimeController().info(ctx)
        })
      })
      .prefix('/realtime')
      .use(middleware.auth())

    /*
    |──────────────────────────────────────────────────────────────────
    | Presence Routes — /api/v1/presence/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router.post('/online', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).online(ctx)
        })

        router.post('/offline', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).offline(ctx)
        })

        router.post('/typing', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).typing(ctx)
        })

        router.get('/:conversationId', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).show(ctx)
        })
      })
      .prefix('/presence')
      .use(middleware.auth())

    /*
    |──────────────────────────────────────────────────────────────────
    | Notification Routes — /api/v1/notifications/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router.get('/unread-count', async (ctx) => {
          const { default: NotificationController } =
            await import('#controllers/notification_controller')
          const notificationService = await ctx.containerResolver.make('NotificationService')
          return new NotificationController(notificationService).unreadCount(ctx)
        })

        router.patch('/read-all', async (ctx) => {
          const { default: NotificationController } =
            await import('#controllers/notification_controller')
          const notificationService = await ctx.containerResolver.make('NotificationService')
          return new NotificationController(notificationService).markAllRead(ctx)
        })

        router.get('/', async (ctx) => {
          const { default: NotificationController } =
            await import('#controllers/notification_controller')
          const notificationService = await ctx.containerResolver.make('NotificationService')
          return new NotificationController(notificationService).index(ctx)
        })

        router.patch('/:id/read', async (ctx) => {
          const { default: NotificationController } =
            await import('#controllers/notification_controller')
          const notificationService = await ctx.containerResolver.make('NotificationService')
          return new NotificationController(notificationService).markRead(ctx)
        })

        router.delete('/:id', async (ctx) => {
          const { default: NotificationController } =
            await import('#controllers/notification_controller')
          const notificationService = await ctx.containerResolver.make('NotificationService')
          return new NotificationController(notificationService).destroy(ctx)
        })
      })
      .prefix('/notifications')
      .use(middleware.auth())

    /*
    |──────────────────────────────────────────────────────────────────
    | Search Routes — /api/v1/search/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router.get('/messages', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).messages(ctx)
        })

        router.get('/conversations', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).conversations(ctx)
        })

        router.get('/', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).global(ctx)
        })
      })
      .prefix('/search')
      .use(middleware.auth())

    /*
    |──────────────────────────────────────────────────────────────────
    | Upload Routes — /api/v1/uploads/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router
          .post('/image', async (ctx) => {
            const { default: UploadController } = await import('#controllers/upload_controller')
            const uploadService = await ctx.containerResolver.make('UploadService')
            return new UploadController(uploadService).image(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.upload)
          })

        router
          .post('/file', async (ctx) => {
            const { default: UploadController } = await import('#controllers/upload_controller')
            const uploadService = await ctx.containerResolver.make('UploadService')
            return new UploadController(uploadService).file(ctx)
          })
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.upload)
          })

        router.get('/:fileId', async (ctx) => {
          const { default: UploadController } = await import('#controllers/upload_controller')
          const uploadService = await ctx.containerResolver.make('UploadService')
          return new UploadController(uploadService).show(ctx)
        })

        router.delete('/:fileId', async (ctx) => {
          const { default: UploadController } = await import('#controllers/upload_controller')
          const uploadService = await ctx.containerResolver.make('UploadService')
          return new UploadController(uploadService).destroy(ctx)
        })
      })
      .prefix('/uploads')
      .use(middleware.auth())

    /*
    |──────────────────────────────────────────────────────────────────
    | Conversation Routes — /api/v1/conversations/*
    |──────────────────────────────────────────────────────────────────
    */
    router
      .group(() => {
        router.post('/', async (ctx) => {
          const { default: ConversationController } =
            await import('#controllers/conversation_controller')
          const conversationService = await ctx.containerResolver.make('IConversationService')
          return new ConversationController(conversationService).create(ctx)
        })

        router.get('/', async (ctx) => {
          const { default: ConversationController } =
            await import('#controllers/conversation_controller')
          const conversationService = await ctx.containerResolver.make('IConversationService')
          return new ConversationController(conversationService).list(ctx)
        })

        router
          .get('/:id', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).show(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .delete('/:id', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).destroy(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .post('/:id/participants', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).addParticipant(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .delete('/:id/participants/:userId', async (ctx) => {
            const { default: ConversationController } =
              await import('#controllers/conversation_controller')
            const conversationService = await ctx.containerResolver.make('IConversationService')
            return new ConversationController(conversationService).removeParticipant(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .post('/:id/messages', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).send(ctx)
          })
          .use(middleware.conversationAccess())
          .use(async (ctx, next) => {
            return new RateLimitMiddleware().handle(ctx, next, rateLimitConfig.message)
          })

        router
          .get('/:id/messages', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).list(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .patch('/:id/messages/:messageId', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).edit(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .delete('/:id/messages/:messageId', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).destroy(ctx)
          })
          .use(middleware.conversationAccess())

        router
          .post('/:id/messages/read', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).markRead(ctx)
          })
          .use(middleware.conversationAccess())
      })
      .prefix('/conversations')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
