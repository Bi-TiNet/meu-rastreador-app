// netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Configuração do servidor incompleta." }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const data = JSON.parse(event.body);
    data.status = 'A agendar'; // status inicial sempre

    const { data: insertData, error } = await supabase
      .from('instalacoes')
      .insert(data)
      .select();

    if (error) throw error;

    return { 
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ message: 'Solicitação cadastrada com sucesso!', insertData }) 
    };

  } catch (error) {
    return { 
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message || "Erro interno no servidor." }) 
    };
  }
};
