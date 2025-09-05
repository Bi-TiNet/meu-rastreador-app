// netlify/functions/create-user.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY; 
  
  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  // Inicializa o cliente com a chave de ADMIN para ter permissões elevadas
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  try {
    // 1. Verifica se o usuário que está fazendo a chamada é um admin
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) throw new Error("Acesso não autorizado.");
    
    const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser(token);
    if (!callingUser || callingUser.app_metadata?.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Apenas administradores podem criar usuários." }) };
    }

    // 2. Extrai os dados para o novo usuário do corpo da requisição
    const { email, password, role, fullName } = JSON.parse(event.body);

    // 3. Cria o novo usuário no sistema de autenticação do Supabase
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
      // Se a criação do usuário na autenticação falhar, lança o erro
      throw creationError;
    }
    
    // 4. Insere os dados do novo usuário na tabela 'profiles'
    if (newUser && newUser.user) {
        // *** CORREÇÃO APLICADA AQUI ***
        // Verificamos explicitamente se houve erro ao inserir o perfil
        const { error: profileError } = await supabase.from('profiles').insert({
            id: newUser.user.id,
            full_name: fullName,
            email: email,
            role: role
        });

        // Se a inserção do perfil falhar
        if (profileError) {
            // Tentamos deletar o usuário de autenticação criado para não deixar lixo no banco
            await supabase.auth.admin.deleteUser(newUser.user.id);
            // Lançamos um erro mais descritivo
            throw new Error(`Falha ao criar perfil no banco de dados: ${profileError.message}`);
        }
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: `Usuário ${email} criado com sucesso!` }) 
    };

  } catch (error) {
    // O bloco catch agora receberá erros mais detalhados
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Erro interno no servidor." }) 
    };
  }
};