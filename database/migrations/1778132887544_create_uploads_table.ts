import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'uploads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('original_name').notNullable()
      table.string('stored_name').notNullable().unique()
      table.string('mime_type').notNullable()
      table.string('category').notNullable().defaultTo('file') // 'image' | 'file'
      table.string('disk').notNullable().defaultTo('local')
      table.string('path').notNullable()
      table.string('url').notNullable()
      table.bigInteger('size').notNullable() // bytes
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
