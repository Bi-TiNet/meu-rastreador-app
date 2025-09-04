// netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

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
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    // Pega a role do usuário a partir dos metadados
    const userRole = user.app_metadata?.role;

    // Inicia a query base
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por),
        profiles:tecnico_id (full_name)
      `);

    // *** LÓGICA DE FILTRO ADICIONADA ***
    // Se o usuário for um técnico, filtra as instalações pelo seu ID
    if (userRole === 'tecnico') {
      query = query.eq('tecnico_id', user.id);
    }
    
    // Para administradores ou outros (se houver), a query continua sem o filtro extra,
    // trazendo todos os resultados (respeitando as RLS, se houver).

    // Adiciona a ordenação no final
    query = query.order('created_at', { ascending: false });
    
    // Executa a query construída
    let { data, error } = await query;

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