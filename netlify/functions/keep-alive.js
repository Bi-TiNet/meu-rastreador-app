// Arquivo: netlify/functions/keep-alive.js

const { createClient } = require('@supabase/supabase-js');

// A função handler agora é exportada para o agendador da Netlify
exports.handler = async function(event, context) {
  console.log("Executando a função 'keep-alive' para manter o Supabase ativo.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const errorMessage = "Variáveis de ambiente do Supabase não encontradas.";
    console.error(errorMessage);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // A consulta mais simples possível para gerar atividade.
    // Pega apenas o ID de um único registro.
    const { error } = await supabase
      .from('instalacoes')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    const successMessage = "Consulta realizada com sucesso! Projeto Supabase ativado.";
    console.log(successMessage);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: successMessage }),
    };

  } catch (error) {
    const errorMessage = `Erro ao executar a consulta: ${error.message}`;
    console.error(errorMessage);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: errorMessage }) 
    };
  }
};