// Arquivo: netlify/functions/create-installation.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const data = JSON.parse(event.body);

  // Se a requisição contiver um ID, é uma atualização (agendamento)
  if (data.id) {
    const { id, date, time } = data;
    const { error } = await supabase
      .from('instalacoes')
      .update({ data_instalacao: date, horario: time, status: 'Agendado' })
      .eq('id', id);

    if (error) return { statusCode: 500, body: error.message };
    return { statusCode: 200, body: JSON.stringify({ message: 'Agendamento atualizado!' }) };

  } else {
    // Se não, é um novo cadastro
    const { error } = await supabase.from('instalacoes').insert({
      nome_completo: data.nome,
      contato: data.contato,
      placa: data.placa,
      modelo: data.modelo,
      ano: data.ano,
      cor: data.cor,
      endereco: data.endereco,
      usuario: data.usuario,
      senha: data.senha,
      base: data.base,
      bloqueio: data.bloqueio,
      status: 'A agendar'
    });

    if (error) return { statusCode: 500, body: error.message };
    return { statusCode: 200, body: JSON.stringify({ message: 'Instalação cadastrada!' }) };
  }
};