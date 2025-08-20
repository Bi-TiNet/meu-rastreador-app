const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log("Function 'create-installation' invoked.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Configuração do servidor incompleta. Variáveis de ambiente do Supabase não encontradas." }),
    };
  }
  
  console.log("Supabase environment variables found.");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Parsing event body...");
    const data = JSON.parse(event.body);
    console.log("Body parsed successfully.");

    if (data.id) {
      console.log(`Updating installation with ID: ${data.id}`);
      const { id, date, time } = data;
      const { data: updateData, error } = await supabase
        .from('instalacoes')
        .update({ data_instalacao: date, horario: time, status: 'Agendado' })
        .eq('id', id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      console.log("Update successful:", updateData);
      return { statusCode: 200, body: JSON.stringify({ message: 'Agendamento atualizado!' }) };
    
    } else {
      console.log("Creating new installation...");
      // CORREÇÃO AQUI: Trocado data.nome por data.nome para corresponder ao que o formulário envia.
      const { data: insertData, error } = await supabase.from('instalacoes').insert({
        nome_completo: data.nome, // <-- A CORREÇÃO FOI FEITA AQUI
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
      }).select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      console.log("Insert successful:", insertData);
      return { statusCode: 200, body: JSON.stringify({ message: 'Instalação cadastrada!' }) };
    }
  } catch (error) {
    console.error("Caught an error in the function:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno no servidor." }) 
    };
  }
};