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

// ===================== DIGISAC (ENV NO RENDER) =====================
// Ex.: DIGISAC_URL=https://bendiconstrutora.digisac.me
const DIGISAC_URL = process.env.DIGISAC_URL || "";
const DIGISAC_TOKEN = process.env.DIGISAC_TOKEN || "";
// Ex.: d67e4312-dcb3-4442-bab3-124207cd35de
const DIGISAC_SERVICE_ID = process.env.DIGISAC_SERVICE_ID || "";

// ✅ Healthcheck
app.get("/health", (req, res) => res.status(200).send("ok"));

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

// ===================== FUNÇÃO: NORMALIZAR TELEFONE =====================
function normalizarTelefone(telefone) {
  // Mantém só dígitos (remove +, espaço, hífen, parênteses)
  return String(telefone || "").replace(/\D/g, "").trim();
}

// ===================== FUNÇÃO: ENVIAR MENSAGEM DIGISAC (POR NÚMERO) =====================
// Baseado no teste que funcionou no seu PowerShell:
// { text, type:"chat", serviceId:"...", number:"5535...", origin:"bot" }
async function enviarMensagemDigisacPorNumero({ number, text, origin = "bot" }) {
  if (!DIGISAC_URL) throw new Error("Falta DIGISAC_URL no Render (Environment).");
  if (!DIGISAC_TOKEN) throw new Error("Falta DIGISAC_TOKEN no Render (Environment).");
  if (!DIGISAC_SERVICE_ID) throw new Error("Falta DIGISAC_SERVICE_ID no Render (Environment).");

  const num = normalizarTelefone(number);
  if (!num) throw new Error("Telefone inválido (number).");
  if (!text) throw new Error("text é obrigatório para enviar mensagem.");

  const body = {
    text,
    type: "chat",
    serviceId: DIGISAC_SERVICE_ID,
    number: num,
    origin
  };

  const r = await axios.post(`${DIGISAC_URL}/api/v1/messages`, body, {
    headers: {
      Authorization: `Bearer ${DIGISAC_TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  return r.data;
}

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
          [messageId, event, isFromMe, contactId, ticketId, text, messageTimestamp, JSON.stringify(req.body)]
        );

        console.log("[DIGISAC] Mensagem do fornecedor salva no banco:", { messageId, contactId, ticketId, text });
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

// ===================== FORNECEDORES =====================
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

// ===================== PRODUTOS =====================
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

// ===================== ENVIO (TESTE E BOTÃO) =====================

// ✅ TESTE: enviar para 1 número (pra você validar rapidamente)
app.post("/digisac/teste-numero", async (req, res) => {
  try {
    const number = normalizarTelefone(req.body.number);
    const mensagem = String(req.body.mensagem || "").trim();

    const resposta = await enviarMensagemDigisacPorNumero({
      number,
      text: mensagem,
      origin: "bot"
    });

    return res.json({ ok: true, resposta });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e.message || e) });
  }
});

// ✅ BOTÃO: frontend manda fornecedorIds (os que estão na tela) + mensagem
// O backend pega o telefone em fornecedores.contato e envia para cada um.
app.post("/digisac/enviar-para-fornecedores", async (req, res) => {
  try {
    const mensagem = String(req.body.mensagem || "").trim();
    const fornecedorIds = Array.isArray(req.body.fornecedorIds) ? req.body.fornecedorIds : [];

    if (!mensagem) return res.status(400).json({ ok: false, erro: "Envie mensagem no body" });
    if (!fornecedorIds.length) return res.status(400).json({ ok: false, erro: "Envie fornecedorIds[] no body" });

    const idsInteiros = fornecedorIds.map((x) => Number(x)).filter((n) => Number.isInteger(n));
    if (!idsInteiros.length) return res.status(400).json({ ok: false, erro: "fornecedorIds deve conter números inteiros" });

    const q = await pool.query(
      "SELECT id, nome, contato FROM fornecedores WHERE id = ANY($1::int[]) ORDER BY id ASC",
      [idsInteiros]
    );

    const resultados = [];
    for (const f of q.rows) {
      const numero = normalizarTelefone(f.contato);

      if (!numero) {
        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: false, erro: "Fornecedor sem telefone válido no campo contato" });
        continue;
      }

      try {
        await enviarMensagemDigisacPorNumero({
          number: numero,
          text: mensagem,
          origin: "bot"
        });

        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: true });
      } catch (e) {
        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: false, erro: String(e.message || e) });
      }
    }

    return res.json({
      ok: true,
      total: resultados.length,
      enviados: resultados.filter((r) => r.ok).length,
      falharam: resultados.filter((r) => !r.ok).length,
      resultados
    });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e.message || e) });
  }
});

// ===================== SERVIDOR =====================
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
