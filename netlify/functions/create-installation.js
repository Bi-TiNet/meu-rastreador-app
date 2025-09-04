// Arquivo: netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Configuração do servidor incompleta." }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const data = JSON.parse(event.body);

    // O status inicial é sempre 'A agendar' ao criar uma nova solicitação.
    data.status = 'A agendar';

    const { data: insertData, error } = await supabase
      .from('instalacoes')
      .insert(data) // Insere o objeto de dados diretamente
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    console.log("Insert successful:", insertData);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Solicitação cadastrada com sucesso!' }) 
    };

  } catch (error) {
    console.error("Caught an error in the function:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno no servidor." }) 
    };
  }
};