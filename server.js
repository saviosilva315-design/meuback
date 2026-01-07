const express = require("express");
const cors = require("cors");
const pool = require("./db");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Executar schema.sql uma vez
(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql")).toString();
    await pool.query(schema);
    console.log("Tabelas verificadas/criadas");
  } catch (err) {
    console.error("Erro ao iniciar banco:", err);
  }
})();

// ============== FORNECEDORES ==================
app.get("/fornecedores", async (req, res) => {
  const result = await pool.query("SELECT * FROM fornecedores ORDER BY id ASC");
  res.json(result.rows);
});

app.post("/fornecedores", async (req, res) => {
  const { nome, contato } = req.body;
  const result = await pool.query(
    "INSERT INTO fornecedores (nome, contato) VALUES ($1, $2) RETURNING id",
    [nome, contato]
  );
  res.json({ id: result.rows[0].id });
});

app.delete("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM fornecedores WHERE id = $1", [id]);
  res.json({ mensagem: "Fornecedor excluído", id });
});

// ============== PRODUTOS ==================
app.get("/produtos", async (req, res) => {
  const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
  res.json(result.rows);
});

app.post("/produtos", async (req, res) => {
  const { nome, fornecedorId } = req.body;
  const result = await pool.query(
    "INSERT INTO produtos (nome, fornecedorId) VALUES ($1, $2) RETURNING id",
    [nome, fornecedorId]
  );
  res.json({ id: result.rows[0].id });
});

app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
  res.json({ mensagem: "Produto excluído", id });
});

// ============== SERVIDOR ==================
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
