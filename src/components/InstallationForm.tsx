// src/components/InstallationForm.tsx
import { useState, type FormEvent } from 'react';
import './InstallationForm.css';

export function InstallationForm() {
  // As declarações de estado para todos os campos, incluindo os que faltavam
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [endereco, setEndereco] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [base, setBase] = useState('Atena');
  const [bloqueio, setBloqueio] = useState('Sim');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Agora as variáveis existem e podem ser usadas para criar o objeto 'data'
    const data = {
      nome,
      contato,
      placa,
      modelo,
      ano,
      cor,
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
      
      // Limpa o formulário após o sucesso
      setNome(''); setContato(''); setPlaca(''); setModelo(''); setAno(''); setCor('');
      setEndereco(''); setUsuario(''); setSenha(''); setBase('Atena'); setBloqueio('Sim');

    } catch (error) {
      console.error('Erro ao enviar o formulário:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  }

  // O JSX/HTML do formulário com todos os campos
  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h2>Cadastrar Nova Instalação</h2>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nome">Nome Completo</label>
          <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="contato">Número de Contato</label>
          <input id="contato" type="text" value={contato} onChange={e => setContato(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="placa">Placa do Veículo</label>
          <input id="placa" type="text" value={placa} onChange={e => setPlaca(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="modelo">Modelo do Veículo</label>
          <input id="modelo" type="text" value={modelo} onChange={e => setModelo(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="ano">Ano de Fabricação</label>
          <input id="ano" type="text" value={ano} onChange={e => setAno(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="cor">Cor do Veículo</label>
          <input id="cor" type="text" value={cor} onChange={e => setCor(e.target.value)} />
        </div>
        <div className="form-group full-width">
          <label htmlFor="endereco">Endereço do Cliente</label>
          <textarea id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)} />
        </div>
      </div>

      <h3>Detalhes de Acesso do Rastreador</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="usuario">Usuário</label>
          <input id="usuario" type="text" value={usuario} onChange={e => setUsuario(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="text" value={senha} onChange={e => setSenha(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="base">Base</label>
          <select id="base" value={base} onChange={e => setBase(e.target.value)}>
            <option value="Atena">Base Atena</option>
            <option value="Autocontrol">Base Autocontrol</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="bloqueio">Bloqueio</label>
          <select id="bloqueio" value={bloqueio} onChange={e => setBloqueio(e.target.value)}>
            <option value="Sim">Sim</option>
            <option value="Nao">Não</option>
          </select>
        </div>
        <button type="submit">Cadastrar Instalação</button>
      </div>
    </form>
  );
}