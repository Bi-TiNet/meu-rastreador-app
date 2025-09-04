// netlify/functions/update-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Configuração do servidor incompleta." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Acesso não autorizado." }) };
    }
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Token inválido." }) };
    }

    const data = JSON.parse(event.body);
    const { id, status, date, time, type, completionType } = data;

    if (!id) {
        return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "ID da solicitação é obrigatório." }) };
    }
    
    // Este bloco é para atualizações de STATUS (Agendar, Concluir, etc.)
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
                data_evento: (eventoText.includes('Agendada')) ? `${date}T${time}:00-03:00` : new Date().toISOString()
            };
            await supabase.from('historico').insert(historicoEntry);
        }

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: `Status atualizado para ${status}!` }) };

    // Este bloco é para EDIÇÃO GERAL dos dados do formulário
    } else {
        const {
            nome_completo, contato, placa, modelo, ano, cor, endereco,
            usuario, senha, base, bloqueio, tipo_servico, observacao
        } = data;
        
        const updatePayload = {
            nome_completo, contato, placa, modelo, ano, cor, endereco,
            usuario, senha, base, bloqueio, tipo_servico, observacao,
            // ### CORREÇÃO APLICADA AQUI ###
            // Ao editar, o status volta para "A agendar" e limpamos a data/hora antigas
            // para que o serviço possa ser agendado novamente no painel.
            status: 'A agendar',
            data_instalacao: null,
            horario: null
        };

        const { error: updateError } = await supabase
            .from('instalacoes')
            .update(updatePayload)
            .eq('id', id);

        if (updateError) throw updateError;

        await supabase.from('historico').insert({
            instalacao_id: id,
            evento: 'Dados cadastrais atualizados',
            realizado_por: user.email,
            data_evento: new Date().toISOString()
        });

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Dados atualizados com sucesso!" }) };
    }
    
  } catch (error) {
    return { 
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno." }) 
    };
  }
};