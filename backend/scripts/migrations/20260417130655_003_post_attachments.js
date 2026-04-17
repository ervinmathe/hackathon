/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('post_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.string('file_name').notNullable(); // e.g. "jegyzet_c_alapok.pdf"
    table.string('file_url').notNullable();  // e.g. "/uploads/pdfs/xxx.pdf" vagy S3 link
    table.string('file_type').notNullable(); // e.g. "application/pdf" vagy "text/plain"
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('post_attachments');
};
