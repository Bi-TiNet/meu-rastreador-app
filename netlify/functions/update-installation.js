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
    const data = JSON.parse(event.body);
    const { id, status, date, time, type, completionType } = data;

    if (!id || !status) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID da instalação e status são obrigatórios." }) };
    }

    let eventoText = '';
    let updateData = { status };

    if (status === 'Concluído') {
      // --- LÓGICA ATUALIZADA AQUI ---
      if (completionType === 'maintenance') {
        eventoText = 'Manutenção Concluída';
      } else if (completionType === 'removal') {
        eventoText = 'Remoção Concluída';
      } else {
        eventoText = 'Instalação Concluída';
      }
    } 
    else if (type === 'maintenance') {
      updateData.data_instalacao = date;
      updateData.horario = time;
      eventoText = 'Manutenção Agendada';
    } 
    // --- NOVA LÓGICA PARA REMOÇÃO ---
    else if (type === 'removal') {
        updateData.data_instalacao = date;
        updateData.horario = time;
        eventoText = 'Remoção Agendada';
    }
    // --- FIM DA NOVA LÓGICA ---
    else if (status === 'Agendado') {
        updateData.data_instalacao = date;
        updateData.horario = time;
        eventoText = 'Instalação Agendada';
    }

    const { error: updateError } = await supabase
      .from('instalacoes')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    if (eventoText) {
        const historicoEntry = {
          instalacao_id: id,
          evento: eventoText,
          detalhes: date && time ? { agendado_para: `${date}T${time}` } : null
        };
        
        if (eventoText.includes('Agendada')) {
          historicoEntry.data_evento = `${date}T${time}:00-03:00`; 
        }

        const { error: historyError } = await supabase.from('historico').insert(historicoEntry);
        if (historyError) throw historyError;
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Status atualizado para ${status}!` }) };
    
  } catch (error) {
    console.error("Erro na função update-installation:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno." }) 
    };
  }
};