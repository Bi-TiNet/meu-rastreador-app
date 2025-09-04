// netlify/functions/create-user.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  // IMPORTANTE: Use a chave de ADMIN (service_role) para criar usuários
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY; 
  
  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  try {
    // 1. Verifique se quem está chamando é um admin
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error("Acesso não autorizado.");
    
    // Use a chave pública para verificar o token do usuário chamador
    const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser(token);
    if (!callingUser || callingUser.app_metadata?.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Apenas administradores podem criar usuários." }) };
    }

    // 2. Crie o novo usuário
    const { email, password, role, fullName } = JSON.parse(event.body);

    const { data: newUser, error: creationError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Já cria o usuário como confirmado
      user_metadata: { 
          role: role,
          full_name: fullName 
      },
    });

    if (creationError) throw creationError;
    
    // 3. (Opcional, mas recomendado) Crie uma entrada na tabela 'profiles'
    // se você tiver uma para armazenar dados públicos dos usuários.
    if(newUser && newUser.user) {
        await supabase.from('profiles').insert({
            id: newUser.user.id,
            full_name: fullName,
            email: email,
            role: role
        });
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