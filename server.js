const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criar tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descricao TEXT,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    fornecedorId INTEGER
  )`);
});

// =======================================
//               PEDIDOS
// =======================================

// GET todos pedidos
app.get('/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST pedido
app.post('/pedidos', (req, res) => {
  const { titulo, descricao, status } = req.body;
  db.run(
    'INSERT INTO pedidos (titulo, descricao, status) VALUES (?, ?, ?)',
    [titulo, descricao, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// DELETE pedido
app.delete('/pedidos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM pedidos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Pedido excluído', id });
  });
});

// =======================================
//            FORNECEDORES
// =======================================

// GET todos fornecedores
app.get('/fornecedores', (req, res) => {
  db.all('SELECT * FROM fornecedores', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST fornecedor
app.post('/fornecedores', (req, res) => {
  const { nome } = req.body;
  db.run(
    'INSERT INTO fornecedores (nome) VALUES (?)',
    [nome],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// DELETE fornecedor
app.delete('/fornecedores/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM fornecedores WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Fornecedor excluído', id });
  });
});

// =======================================
//               PRODUTOS
// =======================================

// GET todos os produtos
app.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST produto
app.post('/produtos', (req, res) => {
  const { nome, fornecedorId } = req.body;
  db.run(
    'INSERT INTO produtos (nome, fornecedorId) VALUES (?, ?)',
    [nome, fornecedorId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// DELETE produto
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM produtos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Produto excluído', id });
  });
});

// =======================================
//              SERVIDOR
// =======================================

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
