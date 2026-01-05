const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// BANCO DE DADOS
// =======================
const db = new sqlite3.Database("database.db");

// Criar tabelas
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS fornecedores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            contato TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            fornecedorId INTEGER,
            FOREIGN KEY (fornecedorId) REFERENCES fornecedores(id)
        )
    `);
});

// =======================
// FORNECEDORES
// =======================
app.get("/fornecedores", (req, res) => {
    db.all("SELECT * FROM fornecedores", [], (err, rows) => {
        res.json(rows);
    });
});

app.post("/fornecedores", (req, res) => {
    const { nome, contato } = req.body;

    db.run(
        "INSERT INTO fornecedores (nome, contato) VALUES (?, ?)",
        [nome, contato],
        function () {
            res.json({ id: this.lastID, nome, contato });
        }
    );
});

app.delete("/fornecedores/:id", (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM produtos WHERE fornecedorId = ?", [id]);
    db.run("DELETE FROM fornecedores WHERE id = ?", [id], () => {
        res.json({ mensagem: "Fornecedor removido" });
    });
});

// =======================
// PRODUTOS
// =======================
app.get("/fornecedores/:id/produtos", (req, res) => {
    const id = req.params.id;

    db.all("SELECT * FROM produtos WHERE fornecedorId = ?", [id], (err, rows) => {
        res.json(rows);
    });
});

app.post("/produtos", (req, res) => {
    const { nome, fornecedorId } = req.body;

    db.run(
        "INSERT INTO produtos (nome, fornecedorId) VALUES (?, ?)",
        [nome, fornecedorId],
        function () {
            res.json({ id: this.lastID, nome, fornecedorId });
        }
    );
});

app.delete("/produtos/:id", (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM produtos WHERE id = ?", [id], () => {
        res.json({ mensagem: "Produto removido" });
    });
});

// =======================
// BUSCA (TODOS OS FORNECEDORES QUE TÊM O PRODUTO)
// =======================
app.get("/buscar", (req, res) => {
    const termo = `%${req.query.q}%`;

    db.all(
        `
        SELECT f.id, f.nome, f.contato, p.nome AS produto
        FROM fornecedores f
        JOIN produtos p ON p.fornecedorId = f.id
        WHERE LOWER(p.nome) LIKE LOWER(?)
        `,
        [termo],
        (err, rows) => {
            res.json(rows);
        }
    );
});

// =======================
// INICIAR SERVIDOR
// =======================
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
