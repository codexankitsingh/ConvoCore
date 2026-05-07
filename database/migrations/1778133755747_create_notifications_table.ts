import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)

      // Who receives this notification
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Who triggered this notification (nullable for system notifications)
      table.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      // Notification type
      table
        .enum('type', [
          'message:new',
          'conversation:new',
          'participant:added',
          'participant:removed',
        ])
        .notNullable()

      // Related resource
      table.uuid('conversation_id').nullable()
      table.uuid('message_id').nullable()

      // Notification content
      table.string('title').notNullable()
      table.string('body').notNullable()

      // State
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('read_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Indexes
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
