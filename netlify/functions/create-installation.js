// Arquivo: netlify/functions/create-installation.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Carrega as credenciais das variáveis de ambiente do Netlify
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // A chave privada precisa ter os caracteres de nova linha restaurados
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Inicializa a conexão com a planilha usando o ID e a autenticação
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

// Esta é a função principal que o Netlify vai executar
exports.handler = async (event, context) => {
  // Garante que a requisição seja do tipo POST (envio de formulário)
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Pega os dados enviados pelo formulário e os converte de texto para um objeto
    const data = JSON.parse(event.body);

    // Carrega as informações da planilha (abas, propriedades, etc.)
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
      'ENDEREÇO CLIENTE': data.endereco,
      'USUÁRIO': data.usuario,     // Novo campo
      'SENHA': data.senha,         // Novo campo
      'BASE': data.base,           // Novo campo
      'BLOQUEIO': data.bloqueio,     // Novo campo
      'STATUS': 'A agendar',       // Define um status padrão para novas entradas
    });

    // Retorna uma resposta de sucesso para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Dados salvos com sucesso na planilha!" }),
    };
  } catch (error) {
    // Se qualquer coisa der errado, registra o erro no log do Netlify para podermos depurar
    console.error("Erro ao salvar na planilha:", error);
    
    // Retorna uma resposta de erro para o front-end
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro interno ao salvar na planilha." }),
    };
  }
};