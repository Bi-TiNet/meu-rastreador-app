// Arquivo: src/components/TechnicianAgenda.tsx
import { useEffect, useState } from 'react';
import './TechnicianAgenda.css';

interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  endereco: string;
  data_instalacao?: string;
  horario?: string;
}

export function TechnicianAgenda() {
  const [scheduled, setScheduled] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScheduledInstallations() {
      try {
        const response = await fetch('/.netlify/functions/get-installations');
        if (!response.ok) throw new Error('Falha ao buscar dados.');
        const allInstallations: Installation[] = await response.json();
        
        // Filtramos para mostrar apenas os agendamentos com status "Agendado"
        const filtered = allInstallations.filter(inst => inst.status === 'Agendado');
        setScheduled(filtered);

      } catch (err) {
        setError('Não foi possível carregar a agenda.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchScheduledInstallations();
  }, []);

  if (loading) return <p className="status-message">A carregar agenda...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="agenda-container">
      <header className="agenda-header">
        <h1>Agenda de Instalações</h1>
      </header>
      {scheduled.length > 0 ? (
        <div className="cards-grid">
          {scheduled.map(inst => (
            <div className="card" key={inst.id}>
              <div className="card-header">
                <h3>{inst.data_instalacao} às {inst.horario}</h3>
              </div>
              <div className="card-body">
                <p><strong>Cliente:</strong> {inst.nome_completo}</p>
                <p><strong>Contato:</strong> {inst.contato}</p>
                <p><strong>Veículo:</strong> {inst.modelo} ({inst.placa})</p>
                <p><strong>Endereço:</strong> {inst.endereco}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="status-message">Nenhuma instalação agendada.</p>
      )}
    </div>
  );
}