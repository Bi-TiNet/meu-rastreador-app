// netlify/functions/create-user.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY; 
  
  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error("Acesso não autorizado.");
    
    const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser(token);
    if (!callingUser || callingUser.app_metadata?.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Apenas administradores podem criar usuários." }) };
    }

    const { email, password, role, fullName } = JSON.parse(event.body);

    const { data: newUser, error: creationError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { 
          role: role,
          full_name: fullName 
      },
    });

    if (creationError) {
      throw creationError;
    }
    
    if (newUser && newUser.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: newUser.user.id,
            full_name: fullName,
            email: email,
            role: role
        });

        if (profileError) {
            await supabase.auth.admin.deleteUser(newUser.user.id);
            // ESTA É A MENSAGEM DE ERRO DETALHADA QUE QUEREMOS VER SE O PROBLEMA CONTINUAR
            throw new Error(`Falha ao criar perfil no banco de dados: ${profileError.message}`);
        }
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: `Usuário ${email} criado com sucesso!` }) 
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Erro interno no servidor." }) 
    };
  }
};