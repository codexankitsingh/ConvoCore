import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/*
|--------------------------------------------------------------------------
| Upload Model
|--------------------------------------------------------------------------
*/
export default class Upload extends BaseModel {
  static table = 'uploads'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare originalName: string

  @column()
  declare storedName: string

  @column()
  declare mimeType: string

  @column()
  declare category: 'image' | 'file'

  @column()
  declare disk: string

  @column()
  declare path: string

  @column()
  declare url: string

  @column()
  declare size: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
