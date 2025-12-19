const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(cors());
app.use(express.json());

// Conexão com o banco SQLite
const db = new sqlite3.Database('./database.db');

// TABELA PEDIDOS
db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descricao TEXT,
    status TEXT
)`);

// TABELA FORNECEDORES (SIMPLES)
db.run(`CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT
)`);

// TABELA PRODUTOS (SIMPLES)
db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    fornecedorId INTEGER
)`);

// ROTAS PEDIDOS
app.get('/pedidos', (req, res) => {
    db.all("SELECT * FROM pedidos", [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/pedidos', (req, res) => {
    const { titulo, descricao, status } = req.body;
    db.run(
        "INSERT INTO pedidos (titulo, descricao, status) VALUES (?, ?, ?)",
        [titulo, descricao, status],
        function () {
            res.json({ id: this.lastID });
        }
    );
});

// ROTAS FORNECEDORES
app.get('/fornecedores', (req, res) => {
    db.all("SELECT * FROM fornecedores", [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/fornecedores', (req, res) => {
    const { nome } = req.body;
    db.run(
        "INSERT INTO fornecedores (nome) VALUES (?)",
        [nome],
        function () {
            res.json({ id: this.lastID });
        }
    );
});

// ROTAS PRODUTOS
app.get('/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/produtos', (req, res) => {
    const { nome, fornecedorId } = req.body;
    db.run(
        "INSERT INTO produtos (nome, fornecedorId) VALUES (?, ?)",
        [nome, fornecedorId],
        function () {
            res.json({ id: this.lastID });
        }
    );
});

// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Backend rodando na porta " + PORT);
});
