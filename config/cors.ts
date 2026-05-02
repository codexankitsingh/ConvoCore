import { defineConfig } from '@adonisjs/cors'

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/
const corsConfig = defineConfig({
  enabled: true,
  origin: true, // Allow all origins in dev
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
