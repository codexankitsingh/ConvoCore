import { BaseSchema } from '@adonisjs/lucid/schema'

/*
|--------------------------------------------------------------------------
| Conversations Table
|--------------------------------------------------------------------------
|
| Stores both direct (2-person) and group conversations.
| type: 'direct' | 'group'
| Direct conversations are unique per user pair (enforced in service).
| Group conversations have a name and optional avatar.
|
*/
export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // UUID primary key
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)

      // Conversation type
      table.enum('type', ['direct', 'group']).notNullable().defaultTo('direct')

      // Group-only fields (null for direct conversations)
      table.string('name', 100).nullable()
      table.string('avatar_url', 500).nullable()

      // Creator of the conversation
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Indexes
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['created_by'], 'conversations_created_by_index')
      table.index(['type'], 'conversations_type_index')
      table.index(['updated_at'], 'conversations_updated_at_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
