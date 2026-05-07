import type { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // ── User Repository ──────────────────────────────────────────────
    this.app.container.bind('IUserRepository', async () => {
      const { default: UserRepository } = await import('#repositories/user_repository')
      return new UserRepository()
    })

    // ── Auth Service ─────────────────────────────────────────────────
    this.app.container.bind('IAuthService', async () => {
      const { default: AuthService } = await import('#services/auth_service')
      const userRepository = await this.app.container.make('IUserRepository')
      return new AuthService(userRepository)
    })

    // ── Conversation Repository ──────────────────────────────────────
    this.app.container.bind('IConversationRepository', async () => {
      const { default: ConversationRepository } =
        await import('#repositories/conversation_repository')
      return new ConversationRepository()
    })

    // ── Realtime Service ─────────────────────────────────────────────
    this.app.container.bind('RealtimeService', async () => {
      const { default: RealtimeService } = await import('#services/realtime_service')
      return new RealtimeService()
    })

    // ── Notification Repository ──────────────────────────────────────
    this.app.container.bind('INotificationRepository', async () => {
      const { default: NotificationRepository } =
        await import('#repositories/notification_repository')
      return new NotificationRepository()
    })

    // ── Notification Service ─────────────────────────────────────────
    this.app.container.bind('NotificationService', async () => {
      const { default: NotificationService } = await import('#services/notification_service')
      const notificationRepository = await this.app.container.make('INotificationRepository')
      const realtimeService = await this.app.container.make('RealtimeService')
      return new NotificationService(notificationRepository, realtimeService)
    })

    // ── Presence Service ─────────────────────────────────────────────
    this.app.container.bind('PresenceService', async () => {
      const { default: PresenceService } = await import('#services/presence_service')
      const realtimeService = await this.app.container.make('RealtimeService')
      return new PresenceService(realtimeService)
    })

    // ── Conversation Service ─────────────────────────────────────────
    this.app.container.bind('IConversationService', async () => {
      const { default: ConversationService } = await import('#services/conversation_service')
      const conversationRepository = await this.app.container.make('IConversationRepository')
      const userRepository = await this.app.container.make('IUserRepository')
      const realtimeService = await this.app.container.make('RealtimeService')
      const notificationService = await this.app.container.make('NotificationService')
      return new ConversationService(
        conversationRepository,
        userRepository,
        realtimeService,
        notificationService
      )
    })

    // ── Message Repository ───────────────────────────────────────────
    this.app.container.bind('IMessageRepository', async () => {
      const { default: MessageRepository } = await import('#repositories/message_repository')
      return new MessageRepository()
    })

    // ── Message Service ──────────────────────────────────────────────
    // ── Message Service ──────────────────────────────────────────────────
    this.app.container.bind('IMessageService', async () => {
      const { default: MessageService } = await import('#services/message_service')
      const messageRepository = await this.app.container.make('IMessageRepository')
      const realtimeService = await this.app.container.make('RealtimeService')
      const notificationService = await this.app.container.make('NotificationService')
      return new MessageService(messageRepository, realtimeService, notificationService)
    })

    // ── Search Service ───────────────────────────────────────────────
    this.app.container.bind('SearchService', async () => {
      const { default: SearchService } = await import('#services/search_service')
      return new SearchService()
    })

    // ── Upload Service ───────────────────────────────────────────────
    this.app.container.bind('UploadService', async () => {
      const { default: UploadService } = await import('#services/upload_service')
      return new UploadService()
    })
  }

  async boot() {}
  async ready() {}
  async shutdown() {}
}
