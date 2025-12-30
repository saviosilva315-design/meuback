const express = require("express");
const router = express.Router();
const cotacaoController = require("../controllers/cotacaoController");

// Envia cotação a fornecedores (base, sem Digisac ainda)
router.post("/enviar", cotacaoController.enviarCotacao);

// Lista status das cotações
router.get("/status", cotacaoController.listarStatus);

module.exports = router;
