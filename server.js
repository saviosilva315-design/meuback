const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db');
db.serialize(() => {

  db.run(`DROP TABLE IF EXISTS fornecedores`);
  db.run(`CREATE TABLE fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    contato TEXT
  )`);
    db.run(`DROP TABLE IF EXISTS produtos`);
  db.run(`CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT
  )`);

  db.run(`DROP TABLE IF EXISTS fornecedor_produto`);
  db.run(`CREATE TABLE fornecedor_produto (
    fornecedorId INTEGER,
    produtoId INTEGER
  )`);
});
app.get('/fornecedores', (req, res) => {
  db.all('SELECT * FROM fornecedores', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/fornecedores', (req, res) => {
  const { nome, contato } = req.body;

  db.run(
    'INSERT INTO fornecedores (nome, contato) VALUES (?, ?)',
    [nome, contato],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, nome, contato });
    }
  );
});
app.delete('/fornecedores/:id', (req, res) => {
  db.run('DELETE FROM fornecedores WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Fornecedor excluído', id: req.params.id });
  });
});
app.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/produtos', (req, res) => {
  const { nome } = req.body;

  db.run('INSERT INTO produtos (nome) VALUES (?)', [nome], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nome });
  });
});
app.post('/produtos/:id/fornecedores', (req, res) => {
  const produtoId = req.params.id;
  const { fornecedorId } = req.body;

  db.run(
    'INSERT INTO fornecedor_produto (fornecedorId, produtoId) VALUES (?, ?)',
    [fornecedorId, produtoId],
    function (err) {
            if (err) return res.status(500).json({ error: err.message });
      res.json({ mensagem: 'Fornecedor vinculado', fornecedorId, produtoId });
    }
  );
});
app.get('/produtos/:id/fornecedores', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT f.id, f.nome, f.contato
    FROM fornecedores f
    JOIN fornecedor_produto fp ON fp.fornecedorId = f.id
        WHERE fp.produtoId = ?
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.delete('/produtos/:id', (req, res) => {
  db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Produto excluído', id: req.params.id });
  });
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
