const { Sequelize } = require("sequelize");
const path = require("path");

// Get database type from environment variable, default to sqlite
const DB_TYPE = process.env.DATABASE_TYPE || "sqlite";

let sequelize;

if (DB_TYPE === "postgres") {
  // PostgreSQL configuration
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

