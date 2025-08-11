// Arquivo: netlify/functions/update-installation.js
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
    const { rowIndex, dateTime } = JSON.parse(event.body);

    if (rowIndex === undefined || !dateTime) {
      return { statusCode: 400, body: "Dados inválidos." };
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    const rows = await sheet.getRows();
    const rowToUpdate = rows[rowIndex];

    if (!rowToUpdate) {
      return { statusCode: 404, body: "Linha não encontrada." };
    }
    
    // Separa a data e a hora que vêm do formulário
    const [date, time] = dateTime.split('T');

    // Atualiza as colunas na planilha.
    // Verifique se os nomes das colunas aqui são IDÊNTICOS aos da sua planilha.
    rowToUpdate.set('DATA DA INSTALAÇÃO', date);
    rowToUpdate.set('HORÁRIO', time);
    rowToUpdate.set('STATUS', 'Agendado');
    
    await rowToUpdate.save(); // Salva as alterações

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Agendamento atualizado com sucesso!" }),
    };
  } catch (error) {
    console.error("Erro ao atualizar a planilha:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao atualizar a planilha." }),
    };
  }
};