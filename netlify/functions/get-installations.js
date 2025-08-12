<<<<<<< Updated upstream
// Arquivo: netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Conecta ao Supabase usando as variáveis de ambiente do Netlify
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Busca todos os dados da tabela 'instalacoes'
    const { data, error } = await supabase
      .from('instalacoes')
      .select('*')
      .order('created_at', { ascending: false }); // Ordena pelos mais recentes

    if (error) {
      throw error;
    }

    // Retorna os dados para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Supabase:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
=======
// Arquivo: netlify/functions/get-installations.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Conecta ao Supabase usando as variáveis de ambiente do Netlify
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Busca todos os dados da tabela 'instalacoes'
    const { data, error } = await supabase
      .from('instalacoes')
      .select('*')
      .order('created_at', { ascending: false }); // Ordena pelos mais recentes

    if (error) {
      throw error;
    }

    // Retorna os dados para o front-end
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Erro ao buscar dados do Supabase:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
>>>>>>> Stashed changes
};