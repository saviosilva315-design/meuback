const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERRO: DATABASE_URL não está definida. O pg pode tentar localhost:5432 e falhar.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
