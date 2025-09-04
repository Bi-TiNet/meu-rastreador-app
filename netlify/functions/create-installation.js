// netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  // ... (código de inicialização do Supabase permanece o mesmo)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Token inválido." }) };
    }

    const data = JSON.parse(event.body);
    data.status = 'A agendar'; // status inicial
    data.created_by = user.id; // Adiciona o ID do criador

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