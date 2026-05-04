import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ConversationParticipant from '#models/conversation_participant'

/*
|--------------------------------------------------------------------------
| Conversation Model
|--------------------------------------------------------------------------
|
| Represents a chat conversation — either direct (2 users)
| or group (2+ users with a name).
|
*/
export default class Conversation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare type: 'direct' | 'group'

  @column()
  declare name: string | null

  @column()
  declare avatarUrl: string | null

  @column()
  declare createdBy: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */

  // Creator of the conversation
  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  // All participant records (with role, last_read_at)
  @hasMany(() => ConversationParticipant, {
    foreignKey: 'conversationId',
  })
  declare participantRecords: HasMany<typeof ConversationParticipant>

  // Users in this conversation (through participants)
  @manyToMany(() => User, {
    pivotTable: 'conversation_participants',
    pivotForeignKey: 'conversation_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role', 'last_read_at', 'created_at'],
  })
  declare participants: ManyToMany<typeof User>
}
