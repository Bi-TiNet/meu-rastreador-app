// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import './InsuranceView.css';
import './Modal.css'; // Reutilizamos o estilo do modal

// Interface para os dados
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  endereco: string;
  data_instalacao?: string;
  horario?: string;
  status: string;
}

// CORREÇÃO: Definimos os tipos para as propriedades do Modal
interface DetailsModalProps {
  installation: Installation;
  onClose: () => void;
}

// Componente para o Modal de Detalhes
function DetailsModal({ installation, onClose }: DetailsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Detalhes da Instalação</h3>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Contato:</strong> {installation.contato}</p>
        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
        <p><strong>Endereço:</strong> {installation.endereco}</p>
        <p><strong>Status:</strong> {installation.status}</p>
        {installation.status === 'Agendado' && (
          <p><strong>Agendado para:</strong> {installation.data_instalacao} às {installation.horario}</p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="save-button">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchInstallations() {
      try {
        const response = await fetch('/.netlify/functions/get-installations');
        if (!response.ok) throw new Error('Falha ao buscar dados.');
        const data: Installation[] = await response.json();
        setAllInstallations(data);
      } catch (err) {
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    fetchInstallations();
  }, []);

  const filteredInstallations = useMemo(() => 
    allInstallations.filter(inst => 
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
  [allInstallations, searchTerm]);

  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');
  const pending = filteredInstallations.filter(inst => inst.status !== 'Agendado');

  if (loading) return <p className="status-message">A carregar...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="insurance-view-container">
      <header className="insurance-header">
        <h1>Consulta de Instalações</h1>
        <input 
          type="text"
          placeholder="Buscar por nome ou placa..."
          className="search-bar"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </header>
      
      <div className="lists-container">
        <div className="list-section">
          <h2>Agendadas</h2>
          {scheduled.length > 0 ? (
            <ul className="installation-list">
              {scheduled.map(inst => (
                <li key={inst.id} onClick={() => setSelected(inst)}>
                  <span>{inst.nome_completo} ({inst.placa})</span>
                  <span className="status scheduled">{inst.data_instalacao}</span>
                </li>
              ))}
            </ul>
          ) : <p>Nenhuma instalação agendada encontrada.</p>}
        </div>

        <div className="list-section">
          <h2>Pendentes</h2>
          {pending.length > 0 ? (
            <ul className="installation-list">
              {pending.map(inst => (
                <li key={inst.id} onClick={() => setSelected(inst)}>
                  <span>{inst.nome_completo} ({inst.placa})</span>
                  <span className="status pending">{inst.status}</span>
                </li>
              ))}
            </ul>
          ) : <p>Nenhuma instalação pendente encontrada.</p>}
        </div>
      </div>

      {selected && (
        <DetailsModal
          installation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}