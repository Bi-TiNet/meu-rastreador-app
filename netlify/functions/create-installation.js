// netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) return { statusCode: 401, headers, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ message: "Token inválido." }) };

    // Separa o array de 'observacoes' do resto dos dados da instalação
    const { observacoes, ...installationData } = JSON.parse(event.body);
    
    installationData.status = 'A agendar';
    installationData.created_by = user.id;

    // 1. Insere a instalação principal e retorna o registro criado
    const { data: newInstallation, error: installationError } = await supabase
      .from('instalacoes')
      .insert(installationData)
      .select()
      .single();

    if (installationError) throw installationError;

    // 2. Se houver observações e a instalação foi criada com sucesso, formata e insere as observações
    if (newInstallation && observacoes && observacoes.length > 0) {
      const observacoesParaInserir = observacoes.map(obs => ({
        instalacao_id: newInstallation.id,
        texto: obs.texto,
        destaque: obs.destaque,
        criado_por: user.email
      }));

      const { error: observationError } = await supabase
        .from('observacoes')
        .insert(observacoesParaInserir);

      if (observationError) {
        // Log do erro para depuração, mas não impede a resposta de sucesso,
        // pois a instalação principal já foi criada.
        console.error("Erro ao inserir observações:", observationError);
      }
    }

    return { 
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Solicitação cadastrada com sucesso!', data: newInstallation }) 
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

