import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  /*
  |--------------------------------------------------------------------------
  | Application
  |--------------------------------------------------------------------------
  */
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum.optional([
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
  ] as const),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string.optional(),
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |--------------------------------------------------------------------------
  | Database (PostgreSQL)
  |--------------------------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string(),
  DB_DATABASE: Env.schema.string(),

  /*
  |--------------------------------------------------------------------------
  | Redis
  |--------------------------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  /*
  |--------------------------------------------------------------------------
  | JWT
  |--------------------------------------------------------------------------
  */
  JWT_SECRET: Env.schema.string(),
  JWT_ACCESS_EXPIRES_IN: Env.schema.string(),
  JWT_REFRESH_EXPIRES_IN: Env.schema.string(),
})
