const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ===============================
//   CRUD FORNECEDORES
// ===============================
app.get("/fornecedores", async (req, res) => {
    try {
        const fornecedores = await prisma.fornecedor.findMany();
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post("/fornecedores", async (req, res) => {
    try {
        const { nome, contato } = req.body;

        const fornecedor = await prisma.fornecedor.create({
            data: { nome, contato }
        });

        res.status(201).json(fornecedor);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.delete("/fornecedores/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.fornecedor.delete({
            where: { id }
        });

        res.json({ mensagem: "Fornecedor excluído com sucesso" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});


// ===============================
//   CRUD PRODUTOS
// ===============================
app.get("/produtos", async (req, res) => {
    try {
        const produtos = await prisma.produto.findMany();
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post("/produtos", async (req, res) => {
    try {
        const { nome } = req.body;

        const produto = await prisma.produto.create({
            data: { nome }
        });

        res.status(201).json(produto);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.delete("/produtos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.produto.delete({
            where: { id }
        });

        res.json({ mensagem: "Produto excluído com sucesso" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});


// =========================================
//   RELAÇÃO MUITOS‑PARA‑MUITOS (CATÁLOGO)
// =========================================

// Listar produtos de um fornecedor
app.get("/fornecedores/:id/produtos", async (req, res) => {
    try {
        const fornecedorId = Number(req.params.id);

        const dados = await prisma.fornecedor_produto.findMany({
            where: { fornecedorId },
            include: { produto: true }
        });

        const produtos = dados.map(d => d.produto);

        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

// Vincular produto ao fornecedor
app.post("/fornecedores/:id/produtos", async (req, res) => {
    try {
        const fornecedorId = Number(req.params.id);
        const { produtoId } = req.body;

        const vinculo = await prisma.fornecedor_produto.create({
            data: {
                fornecedorId,
                produtoId: Number(produtoId)
            }
        });

        res.json(vinculo);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao vincular produto" });
    }
});

// Desvincular produto
app.delete("/fornecedores/:id/produtos/:produtoId", async (req, res) => {
    try {
        const fornecedorId = Number(req.params.id);
        const produtoId = Number(req.params.produtoId);

        await prisma.fornecedor_produto.deleteMany({
            where: { fornecedorId, produtoId }
        });

        res.json({ mensagem: "Produto desvinculado" });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao desvincular produto" });
    }
});

// ===============================
//   INICIAR SERVIDOR
// ===============================
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
