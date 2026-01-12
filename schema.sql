CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  contato TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  fornecedorId INTEGER REFERENCES fornecedores(id)
);

CREATE TABLE IF NOT EXISTS cotacoes (
  id SERIAL PRIMARY KEY,
  produto TEXT,
  mensagem TEXT,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cotacao_fornecedores (
  id SERIAL PRIMARY KEY,
  cotacaoId INTEGER REFERENCES cotacoes(id),
  fornecedorId INTEGER REFERENCES fornecedores(id),
  status TEXT,
  resposta TEXT
);

-- ✅ Histórico do webhook da Digisac (para não perder mensagens)
CREATE TABLE IF NOT EXISTS digisac_webhook_messages (
  id SERIAL PRIMARY KEY,
  messageId TEXT UNIQUE,
  event TEXT,
  isFromMe BOOLEAN,
  contactId TEXT,
  ticketId TEXT,
  text TEXT,
  messageTimestamp TEXT,
  receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload TEXT
);

-- ✅ Vincular fornecedor ao contactId da Digisac
ALTER TABLE fornecedores
ADD COLUMN IF NOT EXISTS digisacContactId TEXT;

-- ✅ (opcional, mas recomendado) impede 2 fornecedores com o mesmo contactId
CREATE UNIQUE INDEX IF NOT EXISTS fornecedores_digisacContactId_uq
ON fornecedores(digisacContactId)
WHERE digisacContactId IS NOT NULL;
