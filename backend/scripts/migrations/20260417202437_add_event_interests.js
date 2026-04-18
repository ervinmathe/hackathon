/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('event_interests', table => {
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('event_id').references('id').inTable('calendar_events').onDelete('CASCADE');
    table.primary(['user_id', 'event_id']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('event_interests');
};
