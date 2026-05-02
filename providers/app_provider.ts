import type { ApplicationService } from '@adonisjs/core/types'

/*
|--------------------------------------------------------------------------
| App Provider — IoC Container Bindings
|--------------------------------------------------------------------------
|
| Binds interfaces to concrete implementations.
| This is where Dependency Inversion is wired up.
|
| Controllers/Services declare what they NEED (interface).
| This provider decides WHAT they get (implementation).
|
*/
export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // ── Auth Module ──────────────────────────────────────────────────
    this.app.container.bind('IUserRepository', async () => {
      const { default: UserRepository } = await import('#repositories/user_repository')
      return new UserRepository()
    })

    this.app.container.bind('IAuthService', async () => {
      const { default: AuthService } = await import('#services/auth_service')
      const userRepository = await this.app.container.make('IUserRepository')
      return new AuthService(userRepository)
    })

    // ── Phase 3: Conversation Module (coming soon) ───────────────────
    // ── Phase 4: Message Module (coming soon) ────────────────────────
    // ── Phase 5: Realtime Module (coming soon) ───────────────────────
  }

  async boot() {}
  async ready() {}
  async shutdown() {}
}
