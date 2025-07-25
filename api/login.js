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

    // Primeiro verifica se a empresa existe
    const empresaData = await queryAirtable(
      'EMPRESAS',
      `{Nome} = "${empresa}"`
    );

    if (empresaData.records.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const empresaRecord = empresaData.records[0];
    const empresaId = empresaRecord.id;

    // Verifica se é um administrador
    if (empresaRecord.fields['Usuário ADM'] === usuario && 
        empresaRecord.fields['Senha ADM'] === senha) {
      return res.json({
        tipo: 'admin',
        nome: usuario,
        empresa: empresaRecord.fields.Nome,
        empresaId: empresaId,
        logo: empresaRecord.fields.Logo,
        corPrimaria: empresaRecord.fields['Cor Primária'],
        corSecundaria: empresaRecord.fields['Cor Secundária']
      });
    }

    // Se não for admin, verifica se é motorista
    const motoristaData = await queryAirtable(
      'MOTORISTAS',
      `AND({Empresa} = "${empresaId}", {Nome Completo} = "${usuario}", {CPF5} = "${senha}", {Ativo} = TRUE())`,
      1
    );

    if (motoristaData.records.length > 0) {
      const motorista = motoristaData.records[0];
      return res.json({
        tipo: motorista.fields.Administrador ? 'admin' : 'motorista',
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

    return res.status(401).json({ error: 'Credenciais inválidas' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
