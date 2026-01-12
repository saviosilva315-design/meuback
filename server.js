const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const pool = require("./db");

process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DIGISAC_URL = process.env.DIGISAC_URL || "";
const DIGISAC_TOKEN = process.env.DIGISAC_TOKEN || "";
const DIGISAC_SERVICE_ID = process.env.DIGISAC_SERVICE_ID || "";

const BUILD_STAMP = `build_${new Date().toISOString()}`;

function onlyDigits(v) {
  return String(v || "").replace(/\D/g, "").trim();
}

function assertDigisacEnv() {
  const missing = [];
  if (!DIGISAC_URL) missing.push("DIGISAC_URL");
  if (!DIGISAC_TOKEN) missing.push("DIGISAC_TOKEN");
  if (!DIGISAC_SERVICE_ID) missing.push("DIGISAC_SERVICE_ID");
  return missing;
}

// ✅ Inicializa DB (cria tabelas se não existirem)
(async () => {
  try {
    const schema = fs.readFileSync("./schema.sql", "utf8");
    await pool.query(schema);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
})();

// ✅ Saúde
app.get("/health", (req, res) => res.status(200).send("ok"));

// ✅ Build/diagnóstico
app.get("/build", (req, res) => {
  res.json({
    ok: true,
    buildStamp: BUILD_STAMP,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDigisacUrl: !!DIGISAC_URL,
    hasDigisacToken: !!DIGISAC_TOKEN,
    hasDigisacServiceId: !!DIGISAC_SERVICE_ID
  });
});

// ✅ Lista rotas (para nunca mais “misteriosamente 404”)
app.get("/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).map(x => x.toUpperCase()).join(",");
      routes.push(`${methods} ${m.route.path}`);
    }
  });
  res.json(routes);
});

// ===============================
// FORNECEDORES
// ===============================
app.get("/fornecedores", async (req, res) => {
  try {
    const r = await pool.query("SELECT id, nome, contato FROM fornecedores ORDER BY id ASC");
    return res.json(r.rows);
  } catch (err) {
    console.error("ERRO GET /fornecedores:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao listar fornecedores" });
  }
});

app.post("/fornecedores", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const contato = String(req.body.contato || "").trim();

    if (!nome) return res.status(400).json({ ok: false, erro: "nome é obrigatório" });

    const r = await pool.query(
      "INSERT INTO fornecedores (nome, contato) VALUES ($1, $2) RETURNING id, nome, contato",
      [nome, contato]
    );

    return res.json(r.rows[0]);
  } catch (err) {
    console.error("ERRO POST /fornecedores:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao criar fornecedor" });
  }
});

app.delete("/fornecedores/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, erro: "id inválido" });

    await pool.query("DELETE FROM fornecedores WHERE id = $1", [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("ERRO DELETE /fornecedores/:id:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao excluir fornecedor" });
  }
});

// ===============================
// PRODUTOS
// ===============================
app.get("/produtos", async (req, res) => {
  try {
    // Alias fornecedorId -> fornecedorid (minúsculo) para bater com seu front
    const r = await pool.query("SELECT id, nome, fornecedorId AS fornecedorid FROM produtos ORDER BY id ASC");
    return res.json(r.rows);
  } catch (err) {
    console.error("ERRO GET /produtos:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao listar produtos" });
  }
});

app.post("/produtos", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const fornecedorId = Number(req.body.fornecedorId);

    if (!nome) return res.status(400).json({ ok: false, erro: "nome é obrigatório" });
    if (!fornecedorId) return res.status(400).json({ ok: false, erro: "fornecedorId é obrigatório" });

    const r = await pool.query(
      "INSERT INTO produtos (nome, fornecedorId) VALUES ($1, $2) RETURNING id, nome, fornecedorId AS fornecedorid",
      [nome, fornecedorId]
    );

    return res.json(r.rows[0]);
  } catch (err) {
    console.error("ERRO POST /produtos:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao criar produto" });
  }
});

app.delete("/produtos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, erro: "id inválido" });

    await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("ERRO DELETE /produtos/:id:", err);
    return res.status(500).json({ ok: false, erro: "Falha ao excluir produto" });
  }
});

// ===============================
// DIGISAC - ENVIOS (NOVO)
// ===============================

// ✅ Botão individual do card
app.post("/digisac/send-fornecedor", async (req, res) => {
  try {
    const missing = assertDigisacEnv();
    if (missing.length) return res.status(500).json({ ok: false, erro: `Faltam variáveis: ${missing.join(", ")}` });

    const fornecedorId = Number(req.body.fornecedorId);
    const text = String(req.body.text || "").trim();

    if (!fornecedorId) return res.status(400).json({ ok: false, erro: "fornecedorId é obrigatório" });
    if (!text) return res.status(400).json({ ok: false, erro: "text é obrigatório" });

    const r = await pool.query("SELECT id, nome, contato FROM fornecedores WHERE id=$1", [fornecedorId]);
    if (r.rows.length === 0) return res.status(404).json({ ok: false, erro: "Fornecedor não encontrado" });

    const fornecedor = r.rows[0];
    const number = onlyDigits(fornecedor.contato);

    if (!number) {
      return res.status(400).json({ ok: false, erro: "Contato do fornecedor inválido. Use DDI+DDD+número (somente dígitos)." });
    }

    const body = {
      text,
      type: "chat",
      serviceId: DIGISAC_SERVICE_ID,
      number,
      origin: "bot"
    };

    const resp = await axios.post(`${DIGISAC_URL}/api/v1/messages`, body, {
      headers: {
        Authorization: `Bearer ${DIGISAC_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    return res.json({ ok: true, fornecedorId, fornecedorNome: fornecedor.nome, resposta: resp.data });
  } catch (err) {
    const status = err?.response?.status || null;
    const data = err?.response?.data || null;
    console.error("ERRO /digisac/send-fornecedor:", status, data || err);
    return res.status(500).json({ ok: false, erro: "Falha ao enviar via Digisac", detalheStatus: status, detalhe: data || String(err.message || err) });
  }
});

// ✅ Botão em massa (lista de IDs deduplicada)
app.post("/digisac/send-many", async (req, res) => {
  try {
    const missing = assertDigisacEnv();
    if (missing.length) return res.status(500).json({ ok: false, erro: `Faltam variáveis: ${missing.join(", ")}` });

    const fornecedorIds = Array.isArray(req.body.fornecedorIds)
      ? req.body.fornecedorIds.map(Number).filter(Boolean)
      : [];

    const text = String(req.body.text || "").trim();

    if (!fornecedorIds.length) return res.status(400).json({ ok: false, erro: "fornecedorIds deve ser um array com pelo menos 1 id" });
    if (!text) return res.status(400).json({ ok: false, erro: "text é obrigatório" });

    const uniqueIds = [...new Set(fornecedorIds)];

    const r = await pool.query(
      "SELECT id, nome, contato FROM fornecedores WHERE id = ANY($1::int[])",
      [uniqueIds]
    );

    const resultados = [];
    for (const f of r.rows) {
      const number = onlyDigits(f.contato);

      if (!number) {
        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: false, erro: "Contato inválido" });
        continue;
      }

      const body = { text, type: "chat", serviceId: DIGISAC_SERVICE_ID, number, origin: "bot" };

      try {
        await axios.post(`${DIGISAC_URL}/api/v1/messages`, body, {
          headers: { Authorization: `Bearer ${DIGISAC_TOKEN}`, "Content-Type": "application/json" }
        });
        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: true });
      } catch (e) {
        resultados.push({ fornecedorId: f.id, fornecedorNome: f.nome, ok: false, erro: "Falha no envio" });
      }
    }

    return res.json({
      ok: true,
      total: resultados.length,
      enviados: resultados.filter(x => x.ok).length,
      falharam: resultados.filter(x => !x.ok).length,
      resultados
    });
  } catch (err) {
    console.error("ERRO /digisac/send-many:", err);
    return res.status(500).json({ ok: false, erro: "Falha no envio em lote" });
  }
});

// ✅ Webhook Digisac (opcional, por enquanto só loga)
app.post("/webhook/digisac", (req, res) => {
  console.log("[DIGISAC] Webhook recebido:", JSON.stringify(req.body));
  return res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
