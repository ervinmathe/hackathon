/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('post_id').references('id').inTable('posts').onDelete('CASCADE').notNullable();
    table.uuid('author_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('comments');
};
