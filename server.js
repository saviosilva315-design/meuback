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
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    console.log('Banco conectado.');
  }
});

// Recriar tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    contato TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    fornecedorId INTEGER
  )`);
});

// ====================== FORNECEDORES ======================
app.get('/fornecedores', (req, res) => {
  db.all('SELECT * FROM fornecedores', [], (err, rows) => {
    res.json(rows);
  });
});

app.post('/fornecedores', (req, res) => {
  db.run(
    'INSERT INTO fornecedores (nome, contato) VALUES (?, ?)',
    [req.body.nome, req.body.contato],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/fornecedores/:id', (req, res) => {
  db.run('DELETE FROM fornecedores WHERE id = ?', [req.params.id], function () {
    res.json({ mensagem: 'Fornecedor excluído', id: req.params.id });
  });
});

// ====================== PRODUTOS ======================
app.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    res.json(rows);
  });
});

app.post('/produtos', (req, res) => {
  db.run(
    'INSERT INTO produtos (nome, fornecedorId) VALUES (?, ?)',
    [req.body.nome, req.body.fornecedorId],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/produtos/:id', (req, res) => {
  db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], function () {
    res.json({ mensagem: 'Produto excluído', id: req.params.id });
  });
});

// ====================== SERVIDOR ======================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
