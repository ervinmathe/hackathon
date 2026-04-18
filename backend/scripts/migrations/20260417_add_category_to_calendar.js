exports.up = function(knex) {
  return knex.schema.table('calendar_events', table => {
    table.string('category').defaultTo('MENTAL'); // 'MENTAL' or 'PHYSICAL'
  });
};

exports.down = function(knex) {
  return knex.schema.table('calendar_events', table => {
    table.dropColumn('category');
  });
};
