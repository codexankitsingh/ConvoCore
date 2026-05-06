import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import transmit from '@adonisjs/transmit/services/main'

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
  |────────────────────────────────────────────────────────────────────
  | Auth Routes — /api/v1/auth/*
  |────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
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
  | Realtime Routes — /api/v1/realtime/*
  |────────────────────────────────────────────────────────────────────
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
  |────────────────────────────────────────────────────────────────────
  | Presence Routes — /api/v1/presence/*
  |────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
        // Heartbeat — mark user online
        router.post('/online', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).online(ctx)
        })

        // Mark user offline
        router.post('/offline', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).offline(ctx)
        })

        // Typing indicator
        router.post('/typing', async (ctx) => {
          const { default: PresenceController } = await import('#controllers/presence_controller')
          const presenceService = await ctx.containerResolver.make('PresenceService')
          const conversationRepository = await ctx.containerResolver.make('IConversationRepository')
          return new PresenceController(presenceService, conversationRepository).typing(ctx)
        })

        // Get presence for a conversation
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
  |────────────────────────────────────────────────────────────────────
  | Search Routes — /api/v1/search/*
  |────────────────────────────────────────────────────────────────────
  */
    router
      .group(() => {
        // Search messages
        router.get('/messages', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).messages(ctx)
        })

        // Search conversations
        router.get('/conversations', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).conversations(ctx)
        })

        // Global search
        router.get('/', async (ctx) => {
          const { default: SearchController } = await import('#controllers/search_controller')
          const searchService = await ctx.containerResolver.make('SearchService')
          return new SearchController(searchService).global(ctx)
        })
      })
      .prefix('/search')
      .use(middleware.auth())

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

        // Send message
        router
          .post('/:id/messages', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).send(ctx)
          })
          .use(middleware.conversationAccess())

        // List messages
        router
          .get('/:id/messages', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).list(ctx)
          })
          .use(middleware.conversationAccess())

        // Edit message
        router
          .patch('/:id/messages/:messageId', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).edit(ctx)
          })
          .use(middleware.conversationAccess())

        // Delete message
        router
          .delete('/:id/messages/:messageId', async (ctx) => {
            const { default: MessageController } = await import('#controllers/message_controller')
            const messageService = await ctx.containerResolver.make('IMessageService')
            return new MessageController(messageService).destroy(ctx)
          })
          .use(middleware.conversationAccess())

        // Mark messages as read
        router
          .post('/:id/messages/:messageId/read', async (ctx) => {
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
