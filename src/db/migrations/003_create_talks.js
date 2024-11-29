exports.up = function(knex) {
  return knex.schema.createTable('talks', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.integer('speaker_id').unsigned().notNullable();
    table.foreign('speaker_id').references('speakers.id');
    table.string('room');
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('talks');
};
