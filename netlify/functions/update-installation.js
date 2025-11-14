// netlify/functions/update-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  // CORREÇÃO: Usar a chave de serviço (admin) para operações no banco de dados
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseAdminKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }

  // Cliente com privilégios de administrador para modificar o banco
  const supabase = createClient(supabaseUrl, supabaseAdminKey);
  
  // Cliente com a chave pública apenas para validar o usuário
  const supabaseUserClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    
    // Valida o token do usuário para garantir que ele está autenticado
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser(token);
    if (userError || !user) return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };

    const data = JSON.parse(event.body);
    const { id, status, date, time, type, completionType, tecnico_id, action, nova_observacao_texto, nova_observacao_destaque } = data;

    if (!id) return { statusCode: 400, body: JSON.stringify({ message: "ID da solicitação é obrigatório." }) };

    let eventoText = '';
    let updatePayload = {};

    // --- LÓGICA DE ADIÇÃO DE OBSERVAÇÃO ---
    if (nova_observacao_texto && nova_observacao_texto.trim() !== '') {
        await supabase.from('observacoes').insert({
            instalacao_id: id,
            texto: nova_observacao_texto,
            destaque: nova_observacao_destaque || false,
            criado_por: user.email
        });
        await supabase.from('historico').insert({
            instalacao_id: id,
            evento: `Nova observação adicionada: "${nova_observacao_texto}"`,
            realizado_por: user.email,
            data_evento: new Date().toISOString()
        });
    }

    // --- LÓGICA DE AÇÕES DO TÉCNICO E ADMIN ---
    if (action === 'return_to_pending') {
      // *** MUDANÇA EXECUTADA AQUI ***
      updatePayload = { status: 'Reagendar', tecnico_id: null, data_instalacao: null, horario: null };
      eventoText = 'Serviço devolvido para reagendamento pelo técnico.';
    } else if (action === 'reschedule_self') {
      updatePayload = { data_instalacao: date, horario: time };
      eventoText = `Serviço reagendado pelo técnico para ${date} às ${time}.`;
    }
    else if (status && !data.nome_completo) {
        updatePayload = { status };
        if (status === 'Concluído') {
            
            // --- INÍCIO DA CORREÇÃO ---
            // O frontend envia 'instalação', 'manutenção' ou 'remoção' em minúsculas.
            // A verificação anterior estava procurando por 'maintenance' e 'removal' (inglês).
            if (completionType === 'manutenção') {
                eventoText = 'Manutenção Concluída';
            } else if (completionType === 'remoção') {
                eventoText = 'Remoção Concluída';
            } else {
                eventoText = 'Instalação Concluída';
            }
            // --- FIM DA CORREÇÃO ---

            updatePayload.tecnico_id = null;
        } else if (status === 'Agendado') {
            updatePayload.data_instalacao = date;
            updatePayload.horario = time;
            updatePayload.tecnico_id = tecnico_id;
            if (type) {
              updatePayload.tipo_servico = type.charAt(0).toUpperCase() + type.slice(1);
            }
            if (type === 'maintenance') eventoText = 'Manutenção Agendada';
            else if (type === 'removal') eventoText = 'Remoção Agendada';
            else eventoText = 'Instalação Agendada';
        }
    } 
    else if (data.nome_completo) {
      const { observacoes, historico, nova_observacao_texto, nova_observacao_destaque, profiles, ...restOfData } = data;
      updatePayload = restOfData;
      eventoText = 'Dados cadastrais atualizados';
    }

    if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase.from('instalacoes').update(updatePayload).eq('id', id);
        if (updateError) throw updateError;
    }

    if (eventoText) {
      await supabase.from('historico').insert({
        instalacao_id: id,
        evento: eventoText,
        realizado_por: user.email,
        data_evento: new Date().toISOString()
      });
    }
    
    return { statusCode: 200, body: JSON.stringify({ message: "Operação realizada com sucesso!" }) };
    
  } catch (error) {
    console.error("Erro na função update-installation:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message || "Ocorreu um erro interno." }) };
  }
};