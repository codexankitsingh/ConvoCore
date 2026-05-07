import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/*
|--------------------------------------------------------------------------
| ConversationParticipant Model
|--------------------------------------------------------------------------
| Explicit columnName mappings for every column to prevent
| Lucid from guessing snake_case conversions incorrectly.
*/
export default class ConversationParticipant extends BaseModel {
  static table = 'conversation_participants'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'conversation_id' })
  declare conversationId: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column()
  declare role: 'admin' | 'member'

  @column.dateTime({ columnName: 'last_read_at' })
  declare lastReadAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
