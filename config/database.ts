import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
|
| Uses PostgreSQL in all environments via Docker container.
| Connection details are loaded from environment variables.
|
*/
const dbConfig = defineConfig({
  connection: 'pg',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | PostgreSQL — Primary Database
    |--------------------------------------------------------------------------
    */
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl: env.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      seeders: {
        paths: ['database/seeders'],
      },
      healthCheck: true,
      debug: env.get('NODE_ENV') === 'development',
    },
  },
})

export default dbConfig
