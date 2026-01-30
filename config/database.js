const { Sequelize } = require("sequelize");
const path = require("path");

// Get database type from environment variable, default to sqlite unless DATABASE_URL is present.
// Priority:
// 1) If DATABASE_URL exists, use it (Heroku-style URL for Postgres).
// 2) Else if DATABASE_TYPE=postgres, use discrete POSTGRES_* vars.
// 3) Else fall back to SQLite file.
const DB_TYPE = process.env.DATABASE_URL ? "postgres" : (process.env.DATABASE_TYPE || "sqlite");

let sequelize;

if (DB_TYPE === "postgres" && process.env.DATABASE_URL) {
  // Parse and use DATABASE_URL (Heroku)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl: process.env.PGSSLMODE === "disable" ? false : { require: true, rejectUnauthorized: false }
    }
  });
} else if (DB_TYPE === "postgres") {
  // PostgreSQL configuration via discrete vars
  sequelize = new Sequelize(
    process.env.POSTGRES_DB || "notes",
    process.env.POSTGRES_USER || "postgres",
    process.env.POSTGRES_PASSWORD || "postgres",
    {
      host: process.env.POSTGRES_HOST || "localhost",
      port: process.env.POSTGRES_PORT || 5432,
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: process.env.PGSSLMODE === "disable" ? false : { require: true, rejectUnauthorized: false }
      }
    }
  );
} else {
  // SQLite configuration (default)
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "../data/notes.db");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: process.env.NODE_ENV === "development" ? console.log : false
  });
}

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`Database connection successful (${DB_TYPE})`);
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  DB_TYPE
};

