const express = require("express");
const cors = require("cors");
const cotacaoRoutes = require("./src/routes/cotacaoRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Rotas principais
app.use("/cotacao", cotacaoRoutes);
app.use("/webhook", webhookRoutes);

// Rota inicial apenas para teste
app.get("/", (req, res) => {
    res.send({ status: "Backend rodando com sucesso" });
});

// Porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("Servidor iniciado na porta " + PORT);
});
