const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables based on NODE_ENV
const environment = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${environment}`),
});

// Database configuration
const config = {
  development: {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: console.log,
  },
  test: {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  },
  production: {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};

// Validate required environment variables
if (
  !process.env.DB_NAME ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_HOST
) {
  console.error(
    "Error: Missing required database environment variables. Check your .env file."
  );
  process.exit(1);
}

// Export Sequelize instance
const dbConfig = config[environment];
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
  }
);

module.exports = { sequelize, config };
