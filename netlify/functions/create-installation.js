// Arquivo: netlify/functions/create-installation.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Carrega as credenciais das variáveis de ambiente
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

    // Carrega as informações da planilha
    await doc.loadInfo();
    
    // Seleciona a aba correta pelo nome. Garanta que o nome seja EXATO.
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    
    // Adiciona uma nova linha com os dados recebidos do formulário
    // Os nomes aqui (ex: 'NOME COMPLETO') devem ser IDÊNTICOS aos cabeçalhos da sua planilha
    await sheet.addRow({
      'NOME COMPLETO': data.nome,
      'Nº DE CONTATO': data.contato,
      'PLACA DO VEÍCULO': data.placa,
      'MODELO DO VEÍCULO': data.modelo,
      'ANO DE FABRICAÇÃO': data.ano,
      'COR DO VEÍCULO': data.cor,
      'ENDEREÇO CLIENTE': data.endereco,
      'STATUS': 'A agendar', // Define um status padrão
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