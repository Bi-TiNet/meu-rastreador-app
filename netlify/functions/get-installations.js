// Arquivo: netlify/functions/get-installations.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

exports.handler = async (event, context) => {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    const rows = await sheet.getRows();

    // CORREÇÃO: Adicionamos o 'rowIndex' a cada objeto retornado.
    // Isso é essencial para sabermos qual linha editar depois.
    const installations = rows.map(row => {
      return {
        ...row.toObject(), // Pega todos os dados da linha
        rowIndex: row.rowIndex - 1 // Adiciona o número da linha (ajustado para índice 0)
      };
    });

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