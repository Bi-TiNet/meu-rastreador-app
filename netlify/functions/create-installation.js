// Arquivo: netlify/functions/create-installation.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// A autenticação continua a mesma
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
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Solicitações de Instalação'];
    const data = JSON.parse(event.body);

    // *** LÓGICA INTELIGENTE ***
    // Se recebemos um 'rowIndex', significa que é um AGENDAMENTO (ATUALIZAÇÃO)
    if (data.rowIndex !== undefined) {
      const rows = await sheet.getRows();
      const rowToUpdate = rows[data.rowIndex];
      if (!rowToUpdate) throw new Error("Linha não encontrada");

      const [date, time] = data.dateTime.split('T');
      rowToUpdate.set('STATUS', 'Agendado');
      rowToUpdate.set('DATA DA INSTALAÇÃO', date);
      rowToUpdate.set('HORÁRIO', time);
      await rowToUpdate.save();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Agendamento salvo com sucesso!" }),
      };

    } else {
      // Se NÃO recebemos um 'rowIndex', é um NOVO CADASTRO
      await sheet.addRow({
        'NOME COMPLETO': data.nome,
        'Nº DE CONTATO': data.contato,
        'PLACA DO VEÍCULO': data.placa,
        'MODELO DO VEÍCULO': data.modelo,
        'ANO DE FABRICAÇÃO': data.ano,
        'COR DO VEÍCULO': data.cor,
        'ENDEREÇO CLIENTE': data.endereco,
        'USUÁRIO': data.usuario,
        'SENHA': data.senha,
        'BASE': data.base,
        'BLOQUEIO': data.bloqueio,
        'STATUS': 'A agendar',
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Dados salvos com sucesso!" }),
      };
    }
  } catch (error) {
    console.error("ERRO NA FUNÇÃO:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Erro ao processar a solicitação." }) };
  }
};