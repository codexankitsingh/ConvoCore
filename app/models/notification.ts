import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/*
|--------------------------------------------------------------------------
| Notification Model
|--------------------------------------------------------------------------
*/
export default class Notification extends BaseModel {
  static table = 'notifications'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare actorId: string | null

  @column()
  declare type: 'message:new' | 'conversation:new' | 'participant:added' | 'participant:removed'

  @column()
  declare conversationId: string | null

  @column()
  declare messageId: string | null

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  declare isRead: boolean

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'actorId' })
  declare actor: BelongsTo<typeof User>
}
