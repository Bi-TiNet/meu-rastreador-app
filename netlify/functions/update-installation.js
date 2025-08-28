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
    // Agora recebemos também o 'completionType'
    const { id, status, date, time, type, completionType } = data;

    if (!id || !status) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID da instalação e status são obrigatórios." }) };
    }

    let eventoText = '';
    let updateData = { status };

    // --- LÓGICA ATUALIZADA AQUI ---
    if (status === 'Concluído') {
      // Se o tipo de conclusão for 'maintenance', o texto do evento muda.
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
    // --- FIM DA LÓGICA ATUALIZADA ---

    const { error: updateError } = await supabase
      .from('instalacoes')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    if (eventoText) { // Apenas insere no histórico se houver um evento
        const { error: historyError } = await supabase.from('historico').insert({
          instalacao_id: id,
          evento: eventoText,
          detalhes: date && time ? { agendado_para: `${date}T${time}` } : null
        });
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