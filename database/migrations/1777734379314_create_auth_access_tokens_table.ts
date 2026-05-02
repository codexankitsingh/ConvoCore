import { BaseSchema } from '@adonisjs/lucid/schema'

/*
|--------------------------------------------------------------------------
| Auth Access Tokens Table
|--------------------------------------------------------------------------
|
| Required by @adonisjs/auth DbAccessTokensProvider.
| tokenable_id is UUID to match our users.id type.
|
*/
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()

      // UUID foreign key → matches users.id (UUID)
      table.uuid('tokenable_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable().unique()
      table.text('abilities').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
    })

    // Index for fast token lookups
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['tokenable_id'], 'tokens_tokenable_id_index')
      table.index(['hash'], 'tokens_hash_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
