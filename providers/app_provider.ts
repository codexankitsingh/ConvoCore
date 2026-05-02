import type { ApplicationService } from '@adonisjs/core/types'

/*
|--------------------------------------------------------------------------
| App Provider
|--------------------------------------------------------------------------
|
| Registers application-specific bindings into the IoC container.
| Following Dependency Inversion Principle — controllers and services
| depend on interfaces, not concrete implementations.
|
| Bindings are added here phase by phase as we build each module.
|
*/
export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /*
  |--------------------------------------------------------------------------
  | Register
  | Bind interfaces → concrete implementations in IoC container
  |--------------------------------------------------------------------------
  */
  register() {
    // Phase 2: Auth Service binding
    // Phase 3: Conversation Service binding
    // Phase 4: Message Service binding
    // Phase 5: Realtime Service binding
  }

  async boot() {}
  async ready() {}
  async shutdown() {}
}
