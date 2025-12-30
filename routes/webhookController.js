const supabase = require('../services/supabaseService');

const produtoController = {
  async getAllProdutos(req, res) {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, fornecedores(nome)');

      if (error) throw error;
      res.status(200).json(data);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getProdutoById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('produtos')
        .select('*, fornecedores(nome)')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      if (error) throw error;

      res.status(200).json(data);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createProduto(req, res) {
    try {
      const { fornecedor_id, nome, codigo_interno, preco, unidade, prazo_entrega, observacoes } = req.body;

      if (!nome || !fornecedor_id || preco === undefined) {
        return res.status(400).json({ error: 'Nome, fornecedor e preço são obrigatórios.' });
      }

      if (preco < 0) {
        return res.status(400).json({ error: 'Preço não pode ser negativo.' });
      }

      const { data, error } = await supabase
        .from('produtos')
        .insert([{ fornecedor_id, nome, codigo_interno, preco, unidade, prazo_entrega, observacoes }])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateProduto(req, res) {
    try {
      const { id } = req.params;
      const { fornecedor_id, nome, codigo_interno, preco, unidade, prazo_entrega, observacoes } = req.body;

      if (!nome || !fornecedor_id || preco === undefined) {
        return res.status(400).json({ error: 'Nome, fornecedor e preço são obrigatórios.' });
      }

      if (preco < 0) {
        return res.status(400).json({ error: 'Preço não pode ser negativo.' });
      }

      const { data, error } = await supabase
        .from('produtos')
        .update({ fornecedor_id, nome, codigo_interno, preco, unidade, prazo_entrega, observacoes })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (data.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      res.status(200).json(data[0]);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteProduto(req, res) {
    try {
      const { id } = req.params;

      const { error, count } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (count === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      res.status(204).send();

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = produtoController;