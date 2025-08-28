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
    // Pega o token do cabeçalho da requisição
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    
    // Pega os dados do usuário a partir do token
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    // Inicia a construção da query
    let query = supabase
      .from('instalacoes')
      .select(`
        *,
        historico (id, evento, data_evento)
      `);

    // --- LÓGICA DE FILTRO POR ROLE ---
    // Se o usuário não for 'admin', adiciona o filtro para ver apenas 'Base Atena'
    if (user.app_metadata?.role !== 'admin') {
      query = query.eq('base', 'Atena');
    }
    
    // Adiciona a ordenação no final
    query = query.order('created_at', { ascending: false });

    // Executa a query construída
    const { data, error } = await query;
    // --- FIM DA LÓGICA DE FILTRO ---

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