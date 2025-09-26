// Arquivo: netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  // Use a chave de administrador (service_key) para ter acesso total
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY; // Use a chave de serviço aqui

  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }

  // Inicialize o cliente Supabase com a chave de administrador
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }

    // Use o token do usuário apenas para validar a sessão e obter suas informações
    // Note que um novo cliente é criado aqui com a chave pública para essa finalidade específica.
    const { data: { user }, error: userError } = await createClient(supabaseUrl, process.env.SUPABASE_KEY).auth.getUser(token);
    if (userError || !user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    const userRole = user.app_metadata?.role;
    const userEmail = user.email;

    // A query agora é feita pelo cliente com privilégios de administrador
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento, realizado_por),
        observacoes (*),
        profiles:tecnico_id (full_name)
      `);

    // A lógica de filtro baseada no perfil do usuário permanece a mesma
    if (userRole === 'tecnico') {
      query = query.eq('tecnico_id', user.id);
    } else if (userRole === 'seguradora') {
      if (userEmail && userEmail.toLowerCase().includes('atena')) {
        query = query.eq('base', 'Atena');
      } else {
        query = query.eq('created_by', user.id);
      }
    }

    query = query.order('created_at', { ascending: false });
    
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