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
| Server Middleware — runs on ALL requests
|--------------------------------------------------------------------------
*/
server.use([
  () => import('#middleware/force_json_response_middleware'),
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/*
|--------------------------------------------------------------------------
| Router Middleware — runs on matched routes only
|--------------------------------------------------------------------------
*/
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/*
|--------------------------------------------------------------------------
| Named Middleware — applied selectively on routes
|--------------------------------------------------------------------------
*/
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
})
