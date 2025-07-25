const { queryAirtable } = require('../lib/airtable');
require('dotenv').config();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { empresa, usuario, senha } = req.body;

    if (!empresa || !usuario || !senha) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Debug: log da tentativa
    console.log('Tentativa de login:', { empresa, usuario, senha });

    // 1. Busca a empresa pelo nome
    const empresaData = await queryAirtable(
      'EMPRESAS',
      `{Nome} = "${empresa}"`
    );

    if (empresaData.records.length === 0) {
      console.log('Empresa não encontrada:', empresa);
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const empresaRecord = empresaData.records[0];
    const empresaId = empresaRecord.id;

    // 2. Verifica se é um motorista (comum ou admin)
    const motoristaData = await queryAirtable(
      'MOTORISTAS',
      `AND(
        {Empresa} = "${empresaId}", 
        {Primeiro Nome} = "${usuario}", 
        {CPF5} = "${senha}",
        {Ativo} = TRUE()
      )`
    );

    if (motoristaData.records.length > 0) {
      const motorista = motoristaData.records[0];
      const isAdmin = motorista.fields.Administrador === true;

      console.log('Login bem-sucedido:', {
        tipo: isAdmin ? 'admin' : 'motorista',
        nome: motorista.fields['Primeiro Nome']
      });

      return res.json({
        tipo: isAdmin ? 'admin' : 'motorista',
        nome: motorista.fields['Primeiro Nome'],
        nomeCompleto: motorista.fields['Nome Completo'],
        empresa: empresaRecord.fields.Nome,
        empresaId: empresaId,
        motoristaId: motorista.id,
        cpf5: motorista.fields.CPF5,
        email: motorista.fields.Email,
        veiculoAtual: motorista.fields['Veículo Atual'],
        logo: empresaRecord.fields.Logo,
        corPrimaria: empresaRecord.fields['Cor Primária'],
        corSecundaria: empresaRecord.fields['Cor Secundária']
      });
    }

    console.log('Credenciais inválidas para:', usuario);
    return res.status(401).json({ error: 'Credenciais inválidas' });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};
