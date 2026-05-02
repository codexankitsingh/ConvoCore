import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'

/*
|--------------------------------------------------------------------------
| User Model
|--------------------------------------------------------------------------
|
| Represents both registered users and guest users.
| We handle password verification manually in AuthService
| to support nullable email (guest users have no email).
|
*/
export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare email: string | null

  @column({ serializeAs: null }) // Never expose in API responses
  declare password: string | null

  @column()
  declare isGuest: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /*
  |--------------------------------------------------------------------------
  | Access Tokens Provider
  |--------------------------------------------------------------------------
  */
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30d',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  /*
  |--------------------------------------------------------------------------
  | Hash password before saving
  | Only for registered users — guests have no password
  |--------------------------------------------------------------------------
  */
  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password && user.password && !user.isGuest) {
      user.password = await hash.make(user.password)
    }
  }
}
