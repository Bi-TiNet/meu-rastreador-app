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

    const userRole = user.app_metadata?.role;
    const userEmail = user.email;

    // Inicia a query base para buscar as instalações
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por),
        profiles:tecnico_id (full_name)
      `);

    // *** LÓGICA DE FILTRO ATUALIZADA ***

    // 1. Se o usuário for um TÉCNICO, ele vê apenas os serviços dele.
    if (userRole === 'tecnico') {
      query = query.eq('tecnico_id', user.id);
    } 
    // 2. Se o usuário for uma SEGURADORA, aplicamos a nova lógica.
    else if (userRole === 'seguradora') {
      // Verifica se é o usuário especial "Atena" (pelo e-mail)
      if (userEmail && userEmail.toLowerCase().includes('atena')) {
        // Se for Atena, vê todos os cadastros da base "Atena"
        query = query.eq('base', 'Atena');
      } else {
        // Outras seguradoras veem apenas o que eles mesmos criaram
        query = query.eq('created_by', user.id);
      }
    }
    // 3. Se for ADMIN, nenhum filtro é aplicado, e ele vê tudo.

    // Adiciona a ordenação no final da query
    query = query.order('created_at', { ascending: false });
    
    // Executa a query
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