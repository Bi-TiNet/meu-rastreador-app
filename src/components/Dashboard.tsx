// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import './Dashboard.css';
import './Modal.css';

// ... (Interface Installation - sem alterações)
interface Installation {
  'NOME COMPLETO': string;
  'Nº DE CONTATO': string;
  'PLACA DO VEÍCULO': string;
  'MODELO DO VEÍCULO': string;
  'STATUS': string;
  'DATA DA INSTALAÇÃO'?: string;
  'HORÁRIO'?: string;
  rowIndex: number;
  [key: string]: string | number | undefined;
}

// ... (Componente ScheduleModal - sem alterações)
interface ScheduleModalProps {
  installation: Installation;
  onClose: () => void;
  onSchedule: (rowIndex: number, dateTime: string) => void;
}

function ScheduleModal({ installation, onClose, onSchedule }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSchedule(installation.rowIndex, dateTime);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Agendar Instalação</h3>
        <p><strong>Cliente:</strong> {installation['NOME COMPLETO']}</p>
        <p><strong>Veículo:</strong> {installation['MODELO DO VEÍCULO']}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="schedule-datetime">Data e Hora</label>
            <input id="schedule-datetime" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">Cancelar</button>
            <button type="submit" className="save-button">Salvar Agendamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente principal do Dashboard
export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  const fetchInstallations = async () => { /* ... (código igual) ... */ };
  useEffect(() => { /* ... (código igual) ... */ }, []);
  const handleCopy = (inst: Installation) => { /* ... (código igual) ... */ };

  // **** A CORREÇÃO ESTÁ AQUI ****
  const handleSchedule = async (rowIndex: number, dateTime: string) => {
    if (!dateTime) return;
    try {
      // Agora chamamos a mesma função 'create-installation', mas enviamos o rowIndex.
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, dateTime }), // Enviamos o índice e a data/hora
      });
      if (!response.ok) throw new Error('Falha ao agendar.');
      alert('Agendado com sucesso!');
      setSelectedInstallation(null);
      fetchInstallations();
    } catch (error) {
      alert('Erro ao agendar.');
      console.error(error);
    }
  };
  
  // ... (Restante do código do Dashboard - sem alterações) ...
  if (loading) return <p>Carregando agendamentos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="dashboard">
      <h2>Painel de Agendamentos</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Agendamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {installations.map((inst) => (
              <tr key={inst.rowIndex}>
                <td>{inst['NOME COMPLETO']}</td>
                <td>{`${inst['MODELO DO VEÍCULO']} (${inst['PLACA DO VEÍCULO']})`}</td>
                <td>
                  {inst['STATUS'] === 'Agendado' 
                    ? `${inst['DATA DA INSTALAÇÃO']} às ${inst['HORÁRIO']}`
                    : inst['STATUS']
                  }
                </td>
                <td className="actions-cell">
                  <button className="copy-button" onClick={() => handleCopy(inst)}>Copiar</button>
                  <button className="schedule-button-action" onClick={() => setSelectedInstallation(inst)}>Agendar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInstallation && (
        <ScheduleModal
          installation={selectedInstallation}
          onClose={() => setSelectedInstallation(null)}
          onSchedule={handleSchedule}
        />
      )}
    </div>
  );
}