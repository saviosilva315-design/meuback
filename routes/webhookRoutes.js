const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Endpoint que receberá mensagens da Digisac
router.post("/digisac", webhookController.receberMensagem);

module.exports = router;
