import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Conversation from '#models/conversation'

/*
|--------------------------------------------------------------------------
| ConversationParticipant Model
|--------------------------------------------------------------------------
|
| Junction model for the conversation_participants table.
| Tracks role (admin/member) and last_read_at per user per conversation.
|
*/
export default class ConversationParticipant extends BaseModel {
  static table = 'conversation_participants'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversationId: string

  @column()
  declare userId: string

  @column()
  declare role: 'admin' | 'member'

  @column.dateTime()
  declare lastReadAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */
  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Conversation, { foreignKey: 'conversationId' })
  declare conversation: BelongsTo<typeof Conversation>
}
