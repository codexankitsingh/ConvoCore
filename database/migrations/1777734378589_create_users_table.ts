import { BaseSchema } from '@adonisjs/lucid/schema'

/*
|--------------------------------------------------------------------------
| Users Table Migration
|--------------------------------------------------------------------------
|
| Stores both registered users and guest users.
| - UUID primary key (more secure than sequential integers)
| - email/password nullable to support guest users
| - is_guest flag to differentiate user types
|
*/
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Enable UUID generation extension
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    this.schema.createTable(this.tableName, (table) => {
      // UUID primary key
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)

      // Identity fields
      table.string('name', 100).notNullable()
      table.string('email', 255).nullable().unique()
      table.string('password', 255).nullable()

      // Guest flag — differentiates registered vs anonymous users
      table.boolean('is_guest').notNullable().defaultTo(false)

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Indexes for performance
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['email'], 'users_email_index')
      table.index(['is_guest'], 'users_is_guest_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
