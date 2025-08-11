import { useState, type FormEvent } from 'react';
import './InstallationForm.css';

export function InstallationForm() {
  // 3. Para cada campo do formulário, criamos um "estado" para guardar seu valor.
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [endereco, setEndereco] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Montamos um objeto com todos os dados do formulário.
    const data = {
      nome,
      contato,
      placa,
      modelo,
      endereco,
      usuario,
      senha,
      base,
      bloqueio,
    };

    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta da rede.');
      }

      await response.json();
      alert('Instalação cadastrada com sucesso!');

    } catch (error) {
      console.error('Erro ao enviar o formulário:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastrar Nova Instalação</h2>

      <label htmlFor="nome">Nome Completo</label>
      <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} />

      <label htmlFor="contato">Número de Contato</label>
      <input id="contato" type="text" value={contato} onChange={e => setContato(e.target.value)} />

      <label htmlFor="placa">Placa do Veículo</label>
      <input id="placa" type="text" value={placa} onChange={e => setPlaca(e.target.value)} />

      <label htmlFor="modelo">Modelo do Veículo</label>
      <input id="modelo" type="text" value={modelo} onChange={e => setModelo(e.target.value)} />
      
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