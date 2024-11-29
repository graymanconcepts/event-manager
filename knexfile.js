// Update with your config settings.
module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './src/db/dev.sqlite3'
    },
    migrations: {
      directory: './src/db/migrations'
    },
    useNullAsDefault: true
  },

  production: {
    client: 'better-sqlite3',
    connection: {
      filename: './src/db/prod.sqlite3'
    },
    migrations: {
      directory: './src/db/migrations'
    },
    useNullAsDefault: true
  }
};
