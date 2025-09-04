// netlify/functions/reset-password.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error("Acesso não autorizado.");
    
    // Verifica se quem está chamando a função é um administrador
    const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser(token);
    if (!callingUser || callingUser.app_metadata?.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }

    const { email } = JSON.parse(event.body);
    if (!email) {
        return { statusCode: 400, body: JSON.stringify({ message: "O email é obrigatório." }) };
    }

    // Usa a função de admin para enviar o link de recuperação de senha
    const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
    });
    
    if (error) throw error;

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: `Link de recuperação enviado para ${email}.` }) 
    };

  } catch (error) {
    console.error("Erro ao enviar email de recuperação:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Erro interno no servidor." }) 
    };
  }
};