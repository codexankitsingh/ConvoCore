import type { ApplicationService } from '@adonisjs/core/types'

/*
|--------------------------------------------------------------------------
| App Provider — IoC Container Bindings
|--------------------------------------------------------------------------
*/
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

    // ── Conversation Service ─────────────────────────────────────────
    this.app.container.bind('IConversationService', async () => {
      const { default: ConversationService } = await import('#services/conversation_service')
      const conversationRepository = await this.app.container.make('IConversationRepository')
      const userRepository = await this.app.container.make('IUserRepository')
      return new ConversationService(conversationRepository, userRepository)
    })

    // ── Phase 4: Message Service (coming soon) ───────────────────────
    // ── Phase 5: Realtime Service (coming soon) ──────────────────────
  }

  async boot() {}
  async ready() {}
  async shutdown() {}
}
