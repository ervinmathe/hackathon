exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('displayName').nullable();
    table.string('fullName').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('displayName');
    table.dropColumn('fullName');
  });
};
