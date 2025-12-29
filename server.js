const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Conexão com o banco
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Banco conectado.');
  }
});

// Recriar tabelas
db.serialize(() => {

  // Tabela fornecedores (agora com CONTATO)
  db.run(`DROP TABLE IF EXISTS fornecedores`);
  db.run(`CREATE TABLE fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    contato TEXT
  )`);

  // Tabela produtos (agora com PREÇO)
  db.run(`DROP TABLE IF EXISTS produtos`);
  db.run(`CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    preco REAL,
    fornecedorId INTEGER
  )`);

  // Tabela pedidos
  db.run(`DROP TABLE IF EXISTS pedidos`);
  db.run(`CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descricao TEXT,
    status TEXT,
    produtoId INTEGER,
    fornecedorId INTEGER
  )`);
});


// ====================== FORNECEDORES ======================

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

      res.json({
        id: this.lastID,
        nome,
        contato
      });
    }
  );
});

app.delete('/fornecedores/:id', (req, res) => {
  db.run('DELETE FROM fornecedores WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Fornecedor excluído', id: req.params.id });
  });
});


// ====================== PRODUTOS ======================

app.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/produtos', (req, res) => {
  const { nome, preco, fornecedorId } = req.body;

  db.run(
    'INSERT INTO produtos (nome, preco, fornecedorId) VALUES (?, ?, ?)',
    [nome, preco, fornecedorId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        nome,
        preco,
        fornecedorId
      });
    }
  );
});

app.delete('/produtos/:id', (req, res) => {
  db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Produto excluído', id: req.params.id });
  });
});


// ====================== PEDIDOS ======================

app.get('/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/pedidos', (req, res) => {
  const { titulo, descricao, status, produtoId, fornecedorId } = req.body;

  db.run(
    'INSERT INTO pedidos (titulo, descricao, status, produtoId, fornecedorId) VALUES (?, ?, ?, ?, ?)',
    [titulo, descricao, status, produtoId, fornecedorId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ id: this.lastID });
    }
  );
});

app.delete('/pedidos/:id', (req, res) => {
  db.run('DELETE FROM pedidos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensagem: 'Pedido excluído', id: req.params.id });
  });
});


// ====================== SERVIDOR ======================

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
