import { BaseSchema } from '@adonisjs/lucid/schema'

/*
|--------------------------------------------------------------------------
| Messages Table
|--------------------------------------------------------------------------
|
| Stores all messages for all conversations.
| type: 'text' | 'image' | 'file' | 'system'
| parent_id: for threaded replies (Phase 6)
| is_edited: flag set when message content is updated
| deleted_at: soft delete — message shown as "deleted" not removed
|
*/
export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // UUID primary key
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)

      // Which conversation this message belongs to
      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')

      // Who sent the message
      table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Message type
      table.enum('type', ['text', 'image', 'file', 'system']).notNullable().defaultTo('text')

      // Message content (text or file URL)
      table.text('content').notNullable()

      // Optional reply to another message (threading)
      table.uuid('parent_id').nullable().references('id').inTable('messages').onDelete('SET NULL')

      // Edit tracking
      table.boolean('is_edited').notNullable().defaultTo(false)

      // Soft delete
      table.timestamp('deleted_at', { useTz: true }).nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Indexes for performance
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['conversation_id'], 'messages_conversation_id_index')
      table.index(['sender_id'], 'messages_sender_id_index')
      table.index(['created_at'], 'messages_created_at_index')
      table.index(['parent_id'], 'messages_parent_id_index')
      table.index(['conversation_id', 'created_at'], 'messages_conversation_created_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
