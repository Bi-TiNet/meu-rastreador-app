// Arquivo: src/components/InstallationForm.tsx
import { useState, type FormEvent } from 'react';
import './InstallationForm.css'; // Importa o nosso novo estilo

export function InstallationForm() {
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
    // A lógica de envio continua a mesma
    event.preventDefault();
    // ... (o seu código de envio para o Supabase)
  }

  return (
    // Usamos a classe principal "form-container"
    <form className="form-container" onSubmit={handleSubmit}>
      <h2>Cadastrar Nova Instalação</h2>
      
      {/* Primeira grelha para dados do cliente/veículo */}
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

      {/* Segunda grelha para dados de acesso */}
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