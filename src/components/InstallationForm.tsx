// 1. Importamos o 'useState' e 'FormEvent' do React.
import { useState, type FormEvent } from 'react';
import './InstallationForm.css';

// 2. Definimos o nosso componente do formulário.
export function InstallationForm() {
  // 3. Para cada campo do formulário, criamos um "estado" para guardar seu valor.
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [endereco, setEndereco] = useState('');

  // 4. Esta é a nova função que será executada quando o formulário for enviado.
  //    Ela é 'async' para que possamos usar 'await' na chamada da API.
  async function handleSubmit(event: FormEvent) {
    // Impede o comportamento padrão do navegador de recarregar a página.
    event.preventDefault();

    // Montamos um objeto com todos os dados do formulário.
    const data = {
      nome,
      contato,
      placa,
      modelo,
      ano,
      cor,
      endereco,
    };

    try {
      // Usamos 'fetch' para enviar os dados para a nossa Netlify Function.
      // O '/.netlify/functions/create-installation' é um caminho especial que o Netlify entende.
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST', // Estamos enviando dados, então usamos o método POST.
        headers: {
          'Content-Type': 'application/json', // Avisamos que estamos enviando dados em formato JSON.
        },
        body: JSON.stringify(data), // Convertemos nosso objeto de dados para texto JSON.
      });

      // Se a resposta do servidor não for de sucesso (ex: erro 404 ou 500), nós geramos um erro.
      if (!response.ok) {
        throw new Error('Falha na resposta da rede.');
      }

      // Se a resposta for boa, nós a lemos e mostramos no console do navegador.
      const result = await response.json();
      console.log('Resposta do servidor:', result);

      // Damos um feedback visual para o usuário.
      alert('Instalação cadastrada com sucesso!');

    } catch (error) {
      // Se qualquer coisa no bloco 'try' der errado, nós capturamos o erro aqui.
      console.error('Erro ao enviar o formulário:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  }

  // 5. Aqui está a aparência do nosso formulário (HTML escrito dentro do React).
  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastrar Nova Instalação</h2>

      <label htmlFor="nome">Nome Completo</label>
      <input
        id="nome"
        type="text"
        value={nome}
        onChange={event => setNome(event.target.value)}
      />

      <label htmlFor="contato">Número de Contato</label>
      <input
        id="contato"
        type="text"
        value={contato}
        onChange={event => setContato(event.target.value)}
      />

      <label htmlFor="placa">Placa do Veículo</label>
      <input
        id="placa"
        type="text"
        value={placa}
        onChange={event => setPlaca(event.target.value)}
      />

      <label htmlFor="modelo">Modelo do Veículo</label>
      <input
        id="modelo"
        type="text"
        value={modelo}
        onChange={event => setModelo(event.target.value)}
      />
      
      <label htmlFor="ano">Ano de Fabricação</label>
      <input
        id="ano"
        type="text"
        value={ano}
        onChange={event => setAno(event.target.value)}
      />
      
      <label htmlFor="cor">Cor do Veículo</label>
      <input
        id="cor"
        type="text"
        value={cor}
        onChange={event => setCor(event.target.value)}
      />
      
      <label htmlFor="endereco">Endereço do Cliente</label>
      <textarea
        id="endereco"
        value={endereco}
        onChange={event => setEndereco(event.target.value)}
      />

      <button type="submit">Cadastrar Instalação</button>
    </form>
  );
}