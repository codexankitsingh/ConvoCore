import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { InferAuthGuards } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'api',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  interface Guards extends InferAuthGuards<typeof authConfig> {}
}
