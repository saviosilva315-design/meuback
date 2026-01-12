const express = require("express");
const cors = require("cors");
const axios = require("axios");
const pool = require("./db");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // para formulário HTML

// ===================== DIGISAC (ENV NO RENDER) =====================
const DIGISAC_URL = process.env.DIGISAC_URL || "";
const DIGISAC_TOKEN = process.env.DIGISAC_TOKEN || "";
const DIGISAC_USER_ID = process.env.DIGISAC_USER_ID || "";

// ✅ Healthcheck
app.get("/health", (req, res) => {
  return res.status(200).send("ok");
});

// ✅ Executar schema.sql uma vez
(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql")).toString();
    await pool.query(schema);
    console.log("Tabelas verificadas/criadas");
  } catch (err) {
    console.error("Erro ao iniciar banco:", err);
  }
})();

// ===================== FUNÇÃO: ENVIAR MENSAGEM DIGISAC =====================
// POST {{URL}}/api/v1/messages
// Authorization: Bearer {{token}}
// Body: { text, type:"chat", contactId, userId, origin:"bot", dontOpenTicket:"true" }
async function enviarMensagemDigisac({ contactId, text, dontOpenTicket = true }) {
  if (!DIGISAC_URL) throw new Error("Falta DIGISAC_URL no Render (Environment).");
  if (!DIGISAC_TOKEN) throw new Error("Falta DIGISAC_TOKEN no Render (Environment).");
  if (!DIGISAC_USER_ID) throw new Error("Falta DIGISAC_USER_ID no Render (Environment).");
  if (!contactId) throw new Error("contactId é obrigatório para enviar mensagem.");
  if (!text) throw new Error("text é obrigatório para enviar mensagem.");

  const body = {
    text,
    type: "chat",
    contactId,
    userId: DIGISAC_USER_ID,
    origin: "bot",
  };

  if (dontOpenTicket) body.dontOpenTicket = "true";

  const r = await axios.post(`${DIGISAC_URL}/api/v1/messages`, body, {
    headers: {
      Authorization: `Bearer ${DIGISAC_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return r.data;
}

// ===================== ✅ PÁGINA DE TESTE (SEM CONSOLE) =====================
app.get("/digisac/teste-telefone", async (req, res) => {
  const msg = String(req.query.msg || "");
  const html = `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Teste Digisac por Telefone</title><style>body{font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:24px auto;padding:0 16px}h1{font-size:20px}label{display:block;margin-top:14px;font-weight:600}input,textarea{width:100%;padding:10px;margin-top:6px}button{margin-top:16px;padding:10px 14px;cursor:pointer}.msg{margin:10px 0;padding:10px;border-radius:6px;background:#f3f7ff;border:1px solid #cfe0ff}code{background:#f4f4f4;padding:2px 6px;border-radius:4px}</style></head><body><h1>Teste de envio Digisac usando TELEFONE como contactId</h1>${msg ? `<div class="msg">${msg}</div>` : ""}<form method="POST" action="/digisac/teste-telefone"><label>Telefone (somente dígitos, com DDI+DDD+Número)</label><input name="telefone" placeholder="Ex: 5514995241168" required /><label>Mensagem</label><textarea name="mensagem" rows="4" required>Teste de envio pelo sistema</textarea><label><input type="checkbox" name="dontOpenTicket" checked /> Não abrir chamado (dontOpenTicket)</label><button type="submit">Enviar teste</button></form><p>Exemplo do técnico: <code>5514995241168</code>. Seu número: <code>5535988005763</code>.</p></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
});

app.post("/digisac/teste-telefone", async (req, res) => {
  try {
    const telefone = String(req.body.telefone || "").replace(/\D/g, "").trim();
    const mensagem = String(req.body.mensagem || "").trim();
    const dontOpenTicket = req.body.dontOpenTicket ? true : false;

    const resposta = await enviarMensagemDigisac({
      contactId: telefone,
      text: mensagem,
      dontOpenTicket,
    });

    return res.redirect("/digisac/teste-telefone?msg=" + encodeURIComponent("OK: mensagem enviada. Resposta: " + JSON.stringify(resposta)));
  } catch (e) {
    return res.redirect("/digisac/teste-telefone?msg=" + encodeURIComponent("ERRO: " + String(e.message || e)));
  }
});

// ===================== WEBHOOK DIGISAC =====================
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

    if (!event || !data) return res.sendStatus(200);

    const messageId = data.id || null;
    const isFromMe = data.isFromMe === true;
    const contactId = data.contactId || null;
    const ticketId = data.ticketId || null;
    const text = data.text || null;
    const messageTimestamp = data.timestamp || null;

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

app.get("/digisac/mensagens", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM digisac_webhook_messages ORDER BY id DESC LIMIT 50");
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar mensagens", detalhe: String(err) });
  }
});

// ===================== SERVIDOR =====================
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
