// Arquivo: netlify/functions/get-installations.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// A autenticação é a mesma da outra função
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

exports.handler = async (event, context) => {
  try {
    // Carrega as informações da planilha
    await doc.loadInfo();
    // Seleciona a aba correta pelo nome
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    
    // O comando .getRows() busca todas as linhas preenchidas da aba
    const rows = await sheet.getRows();

    // Mapeamos as linhas para um formato JSON mais limpo
    const installations = rows.map(row => {
      return row.toObject(); // Converte cada linha em um objeto simples
    });

    // Retornamos a lista de instalações para quem chamou a API
    return {
      statusCode: 200,
      body: JSON.stringify(installations),
    };

  } catch (error) {
    console.error("Erro ao ler a planilha:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao ler os dados da planilha." }),
    };
  }
};