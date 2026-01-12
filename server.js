const express = require("express");
const cors = require("cors");
const axios = require("axios");

process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DIGISAC_URL = process.env.DIGISAC_URL || "";
const DIGISAC_TOKEN = process.env.DIGISAC_TOKEN || "";
const DIGISAC_SERVICE_ID = process.env.DIGISAC_SERVICE_ID || "";

const BUILD_STAMP = `build_${new Date().toISOString()}`;

function onlyDigits(v) {
  return String(v || "").replace(/\D/g, "").trim();
}

function assertEnv() {
  const missing = [];
  if (!DIGISAC_URL) missing.push("DIGISAC_URL");
  if (!DIGISAC_TOKEN) missing.push("DIGISAC_TOKEN");
  if (!DIGISAC_SERVICE_ID) missing.push("DIGISAC_SERVICE_ID");
  return missing;
}

app.get("/health", (req, res) => res.status(200).send("ok"));

app.get("/build", (req, res) => {
  res.json({
    ok: true,
    buildStamp: BUILD_STAMP,
    hasDigisacUrl: !!DIGISAC_URL,
    hasDigisacToken: !!DIGISAC_TOKEN,
    hasDigisacServiceId: !!DIGISAC_SERVICE_ID
  });
});

// ✅ Envio por telefone (o mesmo conceito do seu PowerShell)
app.post("/digisac/send", async (req, res) => {
  try {
    const missing = assertEnv();
    if (missing.length) {
      return res.status(500).json({ ok: false, erro: `Faltam variáveis no Render: ${missing.join(", ")}` });
    }

    const number = onlyDigits(req.body.number);
    const text = String(req.body.text || "").trim();

    if (!number) return res.status(400).json({ ok: false, erro: "Envie number (somente dígitos com DDI+DDD+número)." });
    if (!text) return res.status(400).json({ ok: false, erro: "Envie text." });

    const body = {
      text,
      type: "chat",
      serviceId: DIGISAC_SERVICE_ID,
      number,
      origin: "bot"
    };

    const r = await axios.post(`${DIGISAC_URL}/api/v1/messages`, body, {
      headers: {
        Authorization: `Bearer ${DIGISAC_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    return res.json({ ok: true, resposta: r.data });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("ERRO /digisac/send:", status, data || err);
    return res.status(500).json({
      ok: false,
      erro: "Falha ao enviar via Digisac",
      detalheStatus: status || null,
      detalhe: data || String(err.message || err)
    });
  }
});

// ✅ Webhook Digisac (por enquanto só loga; depois a gente salva em banco)
app.post("/webhook/digisac", (req, res) => {
  console.log("[DIGISAC] Webhook recebido:", JSON.stringify(req.body));
  return res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
