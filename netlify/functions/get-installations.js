// netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY; // Usamos a chave anon aqui

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: event.headers.authorization }
    }
  });

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    
    // Apenas verificamos o usuário, as regras de acesso (RLS) farão o filtro no banco
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    // A query agora busca também o nome do técnico associado (da tabela profiles)
    let { data, error } = await supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por),
        profiles:tecnico_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Erro ao buscar instalações:', error);
    return { 
      statusCode: 500,
      body: JSON.stringify({ message: error.message || "Falha ao buscar dados." }) 
    };
  }
};