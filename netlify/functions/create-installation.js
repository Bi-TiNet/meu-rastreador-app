// ATENÇÃO: Este é um arquivo .js, não .ts

// Este é o formato padrão para funções Netlify em JavaScript
exports.handler = async function(event, context) {
  // Apenas para checar se a função está sendo chamada
  console.log("--- FUNÇÃO JAVASCRIPT EXECUTADA ---");

  // Se a função foi encontrada e executada, ela retorna um sucesso (200)
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "SUCESSO! A função JavaScript foi encontrada e executada!" }),
  };
};