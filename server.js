const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// Initialize database
(async () => {
  try {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    await pool.query(schema);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
})();

// Routes
app.get('/health', (req, res) => {
  res.send('ok');
});

app.get('/fornecedores', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, contato FROM fornecedores');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/fornecedores', async (req, res) => {
  const { nome, contato } = req.body;
  try {
    const result = await pool.query('INSERT INTO fornecedores (nome, contato) VALUES ($1, $2) RETURNING id', [nome, contato]);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/fornecedores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM fornecedores WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, fornecedorId AS fornecedorid FROM produtos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/produtos', async (req, res) => {
  const { nome, fornecedorId } = req.body;
  try {
    const result = await pool.query('INSERT INTO produtos (nome, fornecedorId) VALUES ($1, $2) RETURNING id', [nome, fornecedorId]);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/build', (req, res) => {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  res.json({ hasDatabaseUrl });
});

app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    }
  });
  res.json(routes);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
