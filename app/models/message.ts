import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Conversation from '#models/conversation'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare conversationId: string

  @column()
  declare senderId: string

  @column()
  declare type: 'text' | 'image' | 'file' | 'system'

  @column()
  declare content: string

  @column()
  declare parentId: string | null

  @column()
  declare isEdited: boolean

  /*
  |--------------------------------------------------------------------------
  | deletedAt — must use @column.dateTime so Lucid maps it correctly
  | DO NOT use a plain getter for isDeleted — read deletedAt directly
  |--------------------------------------------------------------------------
  */
  @column.dateTime()
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */
  @belongsTo(() => User, { foreignKey: 'senderId' })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Conversation, { foreignKey: 'conversationId' })
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => Message, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Message>

  @hasMany(() => Message, { foreignKey: 'parentId' })
  declare replies: HasMany<typeof Message>
}
