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
