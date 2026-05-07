import { defineConfig } from '@adonisjs/cors'

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
| In production, restrict to allowed origins via APP_URL env var.
| In development/test, allow all origins for convenience.
*/
const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
