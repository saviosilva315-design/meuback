const express = require("express");
const cors = require("cors");
const pool = require("./db");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ Healthcheck
app.get("/health", (req, res) => {
  return res.status(200).send("ok");
});

// ✅ Executar schema.sql uma vez (cria/atualiza tabelas se não existirem)
(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql")).toString();
    await pool.query(schema);
    console.log("Tabelas verificadas/criadas");
  } catch (err) {
    console.error("Erro ao iniciar banco:", err);
  }
})();

// ============== WEBHOOK DIGISAC ==================
app.post("/webhook/digisac", async (req, res) => {
  try {
    console.log("[DIGISAC] Webhook recebido em /webhook/digisac");
    console.log("[DIGISAC] Headers:", {
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
    });
    console.log("[DIGISAC] Body:", JSON.stringify(req.body));

    const event = req.body && req.body.event ? req.body.event : null;
    const data = req.body && req.body.data ? req.body.data : null;

    // Se não vier no formato esperado, só confirma recebimento e sai
    if (!event || !data) {
      return res.sendStatus(200);
    }

    const messageId = data.id || null;
    const isFromMe = data.isFromMe === true;
    const contactId = data.contactId || null;
    const ticketId = data.ticketId || null;
    const text = data.text || null;
    const messageTimestamp = data.timestamp || null;

    // ✅ Regra: salvar somente mensagem nova vinda do fornecedor (não sua)
    const isInboundSupplierMessage = event === "message.created" && isFromMe === false;

    if (isInboundSupplierMessage && messageId) {
      try {
        await pool.query(
          "INSERT INTO digisac_webhook_messages (messageId, event, isFromMe, contactId, ticketId, text, messageTimestamp, payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (messageId) DO NOTHING",
          [
            messageId,
            event,
            isFromMe,
            contactId,
            ticketId,
            text,
            messageTimestamp,
            JSON.stringify(req.body),
          ]
        );

        console.log("[DIGISAC] Mensagem do fornecedor salva no banco:", {
          messageId,
          contactId,
          ticketId,
          text,
        });
      } catch (dbErr) {
        console.error("[DIGISAC] Erro ao salvar mensagem no banco:", dbErr);
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("[DIGISAC] Erro ao processar webhook:", err);
    return res.sendStatus(200);
  }
});

// ✅ Ver as últimas mensagens salvas do webhook
app.get("/digisac/mensagens", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM digisac_webhook_messages ORDER BY id DESC LIMIT 50"
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar mensagens", detalhe: String(err) });
  }
});

// ============== FORNECEDORES ==================
app.get("/fornecedores", async (req, res) => {
  const result = await pool.query("SELECT * FROM fornecedores ORDER BY id ASC");
  return res.json(result.rows);
});

app.post("/fornecedores", async (req, res) => {
  const { nome, contato } = req.body;
  const result = await pool.query(
    "INSERT INTO fornecedores (nome, contato) VALUES ($1, $2) RETURNING id",
    [nome, contato]
  );
  return res.json({ id: result.rows[0].id });
});

app.delete("/fornecedores/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM fornecedores WHERE id = $1", [id]);
  return res.json({ mensagem: "Fornecedor excluído", id });
});

// ============== PRODUTOS ==================
app.get("/produtos", async (req, res) => {
  const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
  return res.json(result.rows);
});

app.post("/produtos", async (req, res) => {
  const { nome, fornecedorId } = req.body;
  const result = await pool.query(
    "INSERT INTO produtos (nome, fornecedorId) VALUES ($1, $2) RETURNING id",
    [nome, fornecedorId]
  );
  return res.json({ id: result.rows[0].id });
});

app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
  return res.json({ mensagem: "Produto excluído", id });
});

// ============== SERVIDOR ==================
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
