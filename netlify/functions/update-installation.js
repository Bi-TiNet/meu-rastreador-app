// netlify/functions/update-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };

    const data = JSON.parse(event.body);
    const { id, status, date, time, type, completionType, tecnico_id, action, nova_observacao_texto, nova_observacao_destaque } = data;

    if (!id) return { statusCode: 400, body: JSON.stringify({ message: "ID da solicitação é obrigatório." }) };

    let eventoText = '';
    let updatePayload = {};

    // --- LÓGICA DE ADIÇÃO DE OBSERVAÇÃO ---
    // Se um novo texto de observação for enviado, insere na tabela 'observacoes'
    if (nova_observacao_texto && nova_observacao_texto.trim() !== '') {
        await supabase.from('observacoes').insert({
            instalacao_id: id,
            texto: nova_observacao_texto,
            destaque: nova_observacao_destaque || false,
            criado_por: user.email
        });
        // Também registra um evento no histórico para a nova observação
        await supabase.from('historico').insert({
            instalacao_id: id,
            evento: `Nova observação adicionada: "${nova_observacao_texto}"`,
            realizado_por: user.email,
            data_evento: new Date().toISOString()
        });
    }

    // --- LÓGICA DE AÇÕES DO TÉCNICO E ADMIN ---
    if (action === 'return_to_pending') {
      updatePayload = { status: 'A agendar', tecnico_id: null, data_instalacao: null, horario: null };
      eventoText = 'Serviço devolvido para a lista de pendentes pelo técnico.';
    } else if (action === 'reschedule_self') {
      updatePayload = { data_instalacao: date, horario: time };
      eventoText = `Serviço reagendado pelo técnico para ${date} às ${time}.`;
    }
    // Lógica de agendamento/status (usada pelo painel do admin e técnico)
    else if (status && !data.nome_completo) {
        updatePayload = { status };
        if (status === 'Concluído') {
            if (completionType === 'maintenance') eventoText = 'Manutenção Concluída';
            else if (completionType === 'removal') eventoText = 'Remoção Concluída';
            else eventoText = 'Instalação Concluída';
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
    // Lógica de edição geral de dados cadastrais
    else if (data.nome_completo) {
      // Remove campos que não pertencem à tabela 'instalacoes' antes de atualizar
      const { observacoes, historico, nova_observacao_texto, nova_observacao_destaque, profiles, ...restOfData } = data;
      updatePayload = restOfData;
      eventoText = 'Dados cadastrais atualizados';
    }

    // Apenas atualiza a tabela 'instalacoes' se houver dados para atualizar
    if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase.from('instalacoes').update(updatePayload).eq('id', id);
        if (updateError) throw updateError;
    }

    // Insere no histórico o evento principal (se houver)
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

