/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Enrollments (Szakok)
  await knex.schema.createTable('enrollments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique(); // e.g. "Mérnökinformatikus BSc"
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  // 2. Modify Users table (add enrollment_id, year, username)
  await knex.schema.table('users', (table) => {
    table.string('username').notNullable().unique();
    table.uuid('enrollment_id').references('id').inTable('enrollments').onDelete('SET NULL');
    table.integer('year').nullable(); // e.g. 1, 2, 3
  });

  // 3. Forums (Tantárgyak/Kurzusok - 1 fórum = 1 tantárgy)
  await knex.schema.createTable('forums', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable(); // A tantárgy neve
    table.text('description').nullable();
    table.uuid('enrollment_id').notNullable().references('id').inTable('enrollments').onDelete('CASCADE');
    table.timestamps(true, true);
  });

  // 4. Posts (Posztok és Jegyzetek a fórumokban)
  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('forum_id').notNullable().references('id').inTable('forums').onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').nullable();
    table.text('content').notNullable();
    table.timestamps(true, true);
  });

  // 5. Calendar Events (Naptár Események)
  await knex.schema.createTable('calendar_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.text('description').nullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').nullable();
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('forum_id').nullable().references('id').inTable('forums').onDelete('CASCADE'); // Ha tantárgyhoz kötött
    table.uuid('enrollment_id').nullable().references('id').inTable('enrollments').onDelete('CASCADE'); // Ha szakhoz kötött
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('calendar_events');
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('forums');
  
  await knex.schema.table('users', (table) => {
    table.dropColumn('username');
    table.dropForeign('enrollment_id');
    table.dropColumn('enrollment_id');
    table.dropColumn('year');
  });

  await knex.schema.dropTableIfExists('enrollments');
};
