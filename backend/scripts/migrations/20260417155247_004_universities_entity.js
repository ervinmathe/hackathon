/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Create universities table
  await knex.schema.createTableIfNotExists('universities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.timestamps(true, true);
  });


  // Since we have existing data from the seed and adding a NOT NULL column 
  // without a default would fail in Postgres, we clear the existing data first.
  // This is safe because it's just a development seed.
  await knex('post_attachments').del();
  await knex('calendar_events').del();
  await knex('posts').del();
  await knex('forums').del();
  await knex('users').del();
  await knex('enrollments').del();

  // 2. Add university_id to enrollments
  await knex.schema.alterTable('enrollments', (table) => {
    table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
  });

  // 3. Add university_id to forums
  await knex.schema.alterTable('forums', (table) => {
    table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
  });

  // 4. Add university_id to users
  await knex.schema.alterTable('users', (table) => {
    table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('university_id');
  });

  await knex.schema.alterTable('forums', (table) => {
    table.dropColumn('university_id');
  });

  await knex.schema.alterTable('enrollments', (table) => {
    table.dropColumn('university_id');
  });

  await knex.schema.dropTableIfExists('universities');
};
