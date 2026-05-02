/*
|--------------------------------------------------------------------------
| HTTP Kernel
|--------------------------------------------------------------------------
|
| Registers middleware for the application.
| We keep this lean for a pure REST API — no session/shield needed.
|
*/
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/
server.errorHandler(() => import('#exceptions/handler'))

/*
|--------------------------------------------------------------------------
| Server Middleware (runs on ALL requests)
|--------------------------------------------------------------------------
*/
server.use([
  () => import('#middleware/force_json_response_middleware'),
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/*
|--------------------------------------------------------------------------
| Router Middleware (runs on matched routes only)
|--------------------------------------------------------------------------
*/
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/*
|--------------------------------------------------------------------------
| Named Middleware
| Applied selectively on specific routes/groups
|--------------------------------------------------------------------------
*/
export const middleware = router.named({
  // Enforces authentication — returns 401 if no valid token
  auth: () => import('#middleware/auth_middleware'),

  // Phase 3: Verify user is a conversation participant
  // conversationAccess: () => import('#middleware/conversation_access_middleware'),
})
