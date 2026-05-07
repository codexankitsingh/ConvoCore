import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/*
|--------------------------------------------------------------------------
| Server Error Handler
|--------------------------------------------------------------------------
*/
server.errorHandler(() => import('#exceptions/handler'))

/*
|--------------------------------------------------------------------------
| Server Middleware
|--------------------------------------------------------------------------
| ORDER MATTERS:
| 1. Body parser   → parse request body FIRST
| 2. CORS          → handle cross-origin
| 3. Security      → add security headers
*/
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('#middleware/security_headers_middleware'),
])

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
*/
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  conversationAccess: () =>
    import('#middleware/conversation_access_middleware'),
  rateLimit: () => import('#middleware/rate_limit_middleware'),
})
