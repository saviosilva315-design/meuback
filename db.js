const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERRO: DATABASE_URL não está definida no ambiente do Render. Sem ela, o pg tenta localhost:5432 e falha.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
