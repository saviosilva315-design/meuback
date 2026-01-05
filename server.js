app.get('/fornecedores/:id/produtos', (req, res) => {
    const fornecedorId = req.params.id;

    const query = `
        SELECT p.id, p.nome
        FROM produtos p
        JOIN fornecedor_produto fp ON fp.produtoId = p.id
        WHERE fp.fornecedorId = ?
    `;

    db.all(query, [fornecedorId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/fornecedores/:id/produtos', (req, res) => {
    const fornecedorId = req.params.id;
    const { produtoId } = req.body;

    const query = `
        INSERT INTO fornecedor_produto (fornecedorId, produtoId)
        VALUES (?, ?)
    `;

    db.run(query, [fornecedorId, produtoId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensagem: "Produto vinculado ao fornecedor" });
    });
});
app.delete('/fornecedores/:id/produtos/:produtoId', (req, res) => {
    const fornecedorId = req.params.id;
    const produtoId = req.params.produtoId;

    const query = `
        DELETE FROM fornecedor_produto
        WHERE fornecedorId = ? AND produtoId = ?
    `;

    db.run(query, [fornecedorId, produtoId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensagem: "Vínculo removido" });
    });
});
