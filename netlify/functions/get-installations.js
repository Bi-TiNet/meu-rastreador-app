const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log("Function 'get-installations' invoked.");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Configuração do servidor incompleta." }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Fetching installations from Supabase...");
    const { data, error } = await supabase
      .from('instalacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      throw error;
    }

    console.log(`Successfully fetched ${data ? data.length : 0} installations.`);
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Caught an error in the function:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: error.message || "Ocorreu um erro interno no servidor." }) 
    };
  }
};