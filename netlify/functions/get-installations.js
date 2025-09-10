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

    // Inicia a query base para buscar as instalações e suas relações
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por),
        observacoes (*),
        profiles:tecnico_id (full_name)
      `);

    // --- LÓGICA DE FILTRO DE ACORDO COM O PERFIL DO USUÁRIO ---

    // 1. Se for TÉCNICO, vê apenas os serviços atribuídos a ele.
    if (userRole === 'tecnico') {
      query = query.eq('tecnico_id', user.id);
    } 
    // 2. Se for SEGURADORA, aplica a lógica específica.
    else if (userRole === 'seguradora') {
      // O usuário especial "Atena" vê todos os cadastros da base "Atena"
      if (userEmail && userEmail.toLowerCase().includes('atena')) {
        query = query.eq('base', 'Atena');
      } else {
        // Outras seguradoras veem apenas o que elas mesmas criaram
        query = query.eq('created_by', user.id);
      }
    }
    // 3. Se for ADMIN, nenhum filtro é aplicado, e ele vê tudo.

    // Ordena os resultados pela data de criação
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

