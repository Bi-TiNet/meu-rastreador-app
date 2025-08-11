// Arquivo: netlify/functions/create-installation.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    
    // IMPORTANTE: Os nomes aqui (ex: 'USUÁRIO') devem ser
    // IDÊNTICOS aos cabeçalhos da primeira linha da sua Planilha Google.
    // Verifique se a sua planilha tem as colunas 'USUÁRIO', 'SENHA', 'BASE' e 'BLOQUEIO' escritas exatamente assim.
    await sheet.addRow({
      'NOME COMPLETO': data.nome,
      'Nº DE CONTATO': data.contato,
      'PLACA DO VEÍCULO': data.placa,
      'MODELO DO VEÍCULO': data.modelo,
      'ENDEREÇO CLIENTE': data.endereco,
      'USUÁRIO': data.usuario,
      'SENHA': data.senha,
      'BASE': data.base,
      'BLOQUEIO': data.bloqueio,
      'STATUS': 'A agendar',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Dados salvos com sucesso na planilha!" }),
    };
  } catch (error) {
    console.error("Erro ao salvar na planilha:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro interno ao salvar na planilha." }),
    };
  }
};