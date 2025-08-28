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
      eventoText = completionType === 'maintenance' ? 'Manutenção Concluída' : 'Instalação Concluída';
    } 
    else if (type === 'maintenance') {
      updateData.data_instalacao = date;
      updateData.horario = time;
      eventoText = 'Manutenção Agendada';
    } 
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
        
        // --- CORREÇÃO DO FUSO HORÁRIO APLICADA AQUI ---
        // Se for um agendamento, anexa a informação de fuso horário (-03:00)
        // para que o Supabase entenda que é o horário do Brasil.
        if (eventoText.includes('Agendada')) {
          historicoEntry.data_evento = `${date}T${time}:00-03:00`; 
        }
        // --- FIM DA CORREÇÃO ---

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