import { BaseSchema } from '@adonisjs/lucid/schema'

/*
|--------------------------------------------------------------------------
| Conversation Participants Table
|--------------------------------------------------------------------------
|
| Junction table linking users to conversations.
| role: 'admin' | 'member'
| Admin can add/remove participants and delete group conversations.
| last_read_at: used for unread message counts (Phase 4).
|
*/
export default class extends BaseSchema {
  protected tableName = 'conversation_participants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()

      // Foreign keys
      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')

      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Role in conversation
      table.enum('role', ['admin', 'member']).notNullable().defaultTo('member')

      // For unread count tracking (used in Phase 4)
      table.timestamp('last_read_at', { useTz: true }).nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Indexes
    this.schema.alterTable(this.tableName, (table) => {
      // Prevent duplicate participants
      table.unique(['conversation_id', 'user_id'], 'participants_conversation_user_unique')
      table.index(['user_id'], 'participants_user_id_index')
      table.index(['conversation_id'], 'participants_conversation_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
