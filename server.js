const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db');

db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descricao TEXT,
    status TEXT
)`);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Backend rodando na porta " + PORT);
});