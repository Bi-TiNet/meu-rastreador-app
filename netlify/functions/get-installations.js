// Arquivo: netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    // --- QUERY ATUALIZADA ---
    // Adicionado `realizado_por` na consulta do histórico
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por)
      `);

    if (user.app_metadata?.role !== 'admin') {
      query = query.eq('base', 'Atena');
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Erro na função get-installations:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno." }) 
    };
  }
};