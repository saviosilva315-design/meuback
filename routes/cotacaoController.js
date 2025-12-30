const cotacoesDB = require("../database/cotacoesDB");

// Enviar cotação — ainda sem integração Digisac
exports.enviarCotacao = (req, res) => {
    const { produto, fornecedores } = req.body;

    if (!produto || !fornecedores || fornecedores.length === 0) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    const registro = {
        produto,
        fornecedores,
        horaEnvio: new Date(),
        respostas: []
    };

    cotacoesDB.cotacoes.push(registro);

    return res.json({
        status: "Cotação registrada",
        registro
    });
};

// Listar status das cotações
exports.listarStatus = (req, res) => {
    return res.json(cotacoesDB.cotacoes);
};
