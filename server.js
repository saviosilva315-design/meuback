const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// BANCO DE DADOS
// =========================
const db = new Database("database.db");

// Criar tabelas se não existirem
db.exec(`
    CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        contato TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        fornecedorId INTEGER,
        FOREIGN KEY(fornecedorId) REFERENCES fornecedores(id)
    );
`);

// =========================
// ROTAS FORNECEDORES
// =========================
app.get("/fornecedores", (req, res) => {
    const fornecedores = db.prepare("SELECT * FROM fornecedores").all();
    res.json(fornecedores);
});

app.post("/fornecedores", (req, res) => {
    const { nome, contato } = req.body;

    const stmt = db.prepare(
        "INSERT INTO fornecedores (nome, contato) VALUES (?, ?)"
    );
    const result = stmt.run(nome, contato);

    res.json({ id: result.lastInsertRowid, nome, contato });
});

app.delete("/fornecedores/:id", (req, res) => {
    const id = req.params.id;

    db.prepare("DELETE FROM produtos WHERE fornecedorId = ?").run(id);
    db.prepare("DELETE FROM fornecedores WHERE id = ?").run(id);

    res.json({ mensagem: "Fornecedor removido" });
});

// =========================
// ROTAS PRODUTOS
// =========================
app.get("/fornecedores/:id/produtos", (req, res) => {
    const id = req.params.id;
    const produtos = db
        .prepare("SELECT * FROM produtos WHERE fornecedorId = ?")
        .all(id);

    res.json(produtos);
});

app.post("/produtos", (req, res) => {
    const { nome, fornecedorId } = req.body;

    const stmt = db.prepare(
        "INSERT INTO produtos (nome, fornecedorId) VALUES (?, ?)"
    );
    const result = stmt.run(nome, fornecedorId);

    res.json({ id: result.lastInsertRowid, nome, fornecedorId });
});

app.delete("/produtos/:id", (req, res) => {
    const id = req.params.id;

    db.prepare("DELETE FROM produtos WHERE id = ?").run(id);

    res.json({ mensagem: "Produto removido" });
});

// =========================
// BUSCA NOVA (LISTAR TODOS OS FORNECEDORES QUE TÊM O PRODUTO)
// =========================
app.get("/buscar", (req, res) => {
    const termo = req.query.q;

    const fornecedores = db.prepare(`
        SELECT f.id, f.nome, f.contato, p.nome AS produto
        FROM fornecedores f
        JOIN produtos p ON p.fornecedorId = f.id
        WHERE LOWER(p.nome) LIKE LOWER(?)
    `).all(`%${termo}%`);

    res.json(fornecedores);
});

// =========================
// INICIAR SERVIDOR
// =========================
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
