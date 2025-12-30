const supabase = require('../services/supabaseService');

const fornecedorController = {
  async getAllFornecedores(req, res) {
    try {
      const { data, error } = await supabase.from('fornecedores').select('*');
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getFornecedorById(req, res) {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Fornecedor não encontrado.' });
      }

      if (error) throw error;
      res.status(200).json(data);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createFornecedor(req, res) {
    try {
      const { nome, cnpj, telefone, email, prazo_padrao, observacoes } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'O nome é obrigatório.' });
      }

      const { data, error } = await supabase
        .from('fornecedores')
        .insert([{ nome, cnpj, telefone, email, prazo_padrao, observacoes }])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateFornecedor(req, res) {
    try {
      const { id } = req.params;
      const { nome, cnpj, telefone, email, prazo_padrao, observacoes } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'O nome é obrigatório.' });
      }

      const { data, error } = await supabase
        .from('fornecedores')
        .update({ nome, cnpj, telefone, email, prazo_padrao, observacoes })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data.length === 0) {
        return res.status(404).json({ error: 'Fornecedor não encontrado.' });
      }

      res.status(200).json(data[0]);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteFornecedor(req, res) {
    try {
      const { id } = req.params;

      const { error, count } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (count === 0) {
        return res.status(404).json({ error: 'Fornecedor não encontrado.' });
      }

      res.status(204).send();

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = fornecedorController;