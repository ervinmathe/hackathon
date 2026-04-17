/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('calendar_events', (table) => {
    table.boolean('is_approved').defaultTo(false).notNullable();
    table.uuid('university_id').references('id').inTable('universities').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('calendar_events', (table) => {
    table.dropColumn('university_id');
    table.dropColumn('is_approved');
  });
};
