// netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  // Define os headers que serão usados em todas as respostas
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  // Responde a requisições OPTIONS (necessário para o CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Erro Crítico: Variáveis de ambiente do Supabase não configuradas.");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Configuração do servidor incompleta." })
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: "Token inválido." }) };
    }

    const data = JSON.parse(event.body);
    data.status = 'A agendar'; // status inicial
    data.created_by = user.id; // Adiciona o ID do criador

    const { data: insertData, error } = await supabase
      .from('instalacoes')
      .insert(data)
      .select();

    if (error) {
      // Log detalhado do erro do Supabase
      console.error("Erro do Supabase ao inserir:", error);
      throw error;
    }

    return { 
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Solicitação cadastrada com sucesso!', data: insertData }) 
    };

  } catch (error) {
    console.error("Erro na função create-installation:", error);
    return { 
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message || "Erro interno no servidor." }) 
    };
  }
};