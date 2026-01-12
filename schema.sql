CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  fornecedorId INTEGER NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS digisac_webhook_messages (
  id SERIAL PRIMARY KEY,
  messageId TEXT UNIQUE,
  event TEXT,
  isFromMe BOOLEAN,
  contactId TEXT,
  ticketId TEXT,
  text TEXT,
  messageTimestamp TEXT,
  payload TEXT
);
