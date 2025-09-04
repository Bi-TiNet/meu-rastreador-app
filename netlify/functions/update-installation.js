// Arquivo: netlify/functions/update-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Token inválido." }) };
    }

    const data = JSON.parse(event.body);
    const { id, status, date, time, type, completionType } = data;

    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: "ID da solicitação é obrigatório." }) };
    }
    
    // VERIFICA SE É UMA ATUALIZAÇÃO DE STATUS (Agendar/Concluir)
    // A presença de 'status' e a ausência de 'nome_completo' indica uma atualização de status.
    if (status && !data.nome_completo) {
        let eventoText = '';
        let updateData = { status };

        if (status === 'Concluído') {
            if (completionType === 'maintenance') eventoText = 'Manutenção Concluída';
            else if (completionType === 'removal') eventoText = 'Remoção Concluída';
            else eventoText = 'Instalação Concluída';
        } else if (type === 'maintenance') {
            updateData.data_instalacao = date;
            updateData.horario = time;
            eventoText = 'Manutenção Agendada';
        } else if (type === 'removal') {
            updateData.data_instalacao = date;
            updateData.horario = time;
            eventoText = 'Remoção Agendada';
        } else if (status === 'Agendado') {
            updateData.data_instalacao = date;
            updateData.horario = time;
            eventoText = 'Instalação Agendada';
        }

        const { error: updateError } = await supabase.from('instalacoes').update(updateData).eq('id', id);
        if (updateError) throw updateError;

        if (eventoText) {
            const historicoEntry = {
                instalacao_id: id,
                evento: eventoText,
                realizado_por: user.email,
                detalhes: date && time ? { agendado_para: `${date}T${time}` } : null,
                data_evento: (eventoText.includes('Agendada')) ? `${date}T${time}:00-03:00` : new Date().toISOString()
            };
            const { error: historyError } = await supabase.from('historico').insert(historicoEntry);
            if (historyError) throw historyError;
        }

        return { statusCode: 200, body: JSON.stringify({ message: `Status atualizado para ${status}!` }) };

    // SE NÃO FOR ATUALIZAÇÃO DE STATUS, É UMA ATUALIZAÇÃO GERAL DE DADOS
    } else {
        // Extrai apenas os campos que podem ser editados para evitar problemas de segurança
        const {
            nome_completo, contato, placa, modelo, ano, cor, endereco,
            usuario, senha, base, bloqueio, tipo_servico, observacao
        } = data;
        
        const updatePayload = {
            nome_completo, contato, placa, modelo, ano, cor, endereco,
            usuario, senha, base, bloqueio, tipo_servico, observacao
        };

        const { error: updateError } = await supabase
            .from('instalacoes')
            .update(updatePayload)
            .eq('id', id);

        if (updateError) throw updateError;

        // Cria um registro no histórico para a edição
        const { error: historyError } = await supabase.from('historico').insert({
            instalacao_id: id,
            evento: 'Dados cadastrais atualizados',
            realizado_por: user.email
        });
        if (historyError) throw historyError; // Não interrompe a operação se o log falhar

        return { statusCode: 200, body: JSON.stringify({ message: "Dados atualizados com sucesso!" }) };
    }
    
  } catch (error) {
    console.error("Erro na função update-installation:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno." }) 
    };
  }
};