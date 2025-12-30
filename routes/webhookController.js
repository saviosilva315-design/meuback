const cotacoesDB = require("../database/cotacoesDB");

// Recebe retorno da Digisac (respostas dos fornecedores)
exports.receberMensagem = (req, res) => {
    const { contactId, mensagem } = req.body;

    if (!contactId || !mensagem) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    // Identificar se essa resposta pertence a alguma cotação ativa
    for (let cotacao of cotacoesDB.cotacoes) {
        const fornecedor = cotacao.fornecedores.find(f => f.contactId === contactId);

        if (fornecedor) {
            cotacao.respostas.push({
                contactId,
                mensagem,
                hora: new Date()
            });

            return res.json({ recebido: true });
        }
    }

    return res.json({ ignorado: true }); // mensagem de fora das cotações
};
