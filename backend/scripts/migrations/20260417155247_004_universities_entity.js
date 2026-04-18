/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Create universities table if not exists
  const hasUniversities = await knex.schema.hasTable('universities');
  if (!hasUniversities) {
    await knex.schema.createTable('universities', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description').nullable();
      table.timestamps(true, true);
    });
  }

  // Clear data to avoid constraint issues with new NOT NULL columns
  // (Only if we are actually adding columns)
  const hasUniEnroll = await knex.schema.hasColumn('enrollments', 'university_id');
  if (!hasUniEnroll) {
    // Csak akkor törlünk, ha létezik a tábla (rollback után a comments pl még nem létezik)
    const tablesToDelete = [
      'post_attachments',
      'calendar_events',
      'comments',
      'posts',
      'forums',
      'users',
      'enrollments'
    ];

    for (const tableName of tablesToDelete) {
      if (await knex.schema.hasTable(tableName)) {
        await knex(tableName).del();
      }
    }

    await knex.schema.alterTable('enrollments', (table) => {
      table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
    });
  }

  const hasUniForums = await knex.schema.hasColumn('forums', 'university_id');
  if (!hasUniForums) {
    await knex.schema.alterTable('forums', (table) => {
      table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
    });
  }

  const hasUniUsers = await knex.schema.hasColumn('users', 'university_id');
  if (!hasUniUsers) {
    await knex.schema.alterTable('users', (table) => {
      table.uuid('university_id').notNullable().references('id').inTable('universities').onDelete('CASCADE');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasUniUsers = await knex.schema.hasColumn('users', 'university_id');
  if (hasUniUsers) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('university_id');
    });
  }

  const hasUniForums = await knex.schema.hasColumn('forums', 'university_id');
  if (hasUniForums) {
    await knex.schema.alterTable('forums', (table) => {
      table.dropColumn('university_id');
    });
  }

  const hasUniEnroll = await knex.schema.hasColumn('enrollments', 'university_id');
  if (hasUniEnroll) {
    await knex.schema.alterTable('enrollments', (table) => {
      table.dropColumn('university_id');
    });
  }

  await knex.schema.dropTableIfExists('universities');
};
