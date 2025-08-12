// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import './Dashboard.css';
import './Modal.css';

// Define a "forma" (interface) dos dados de uma instalação
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  ano?: string;
  cor?: string;
  endereco: string;
  usuario: string;
  senha?: string;
  base: string;
  bloqueio: string;
  status: string;
  data_instalacao?: string;
  horario?: string;
}

// Define os tipos das propriedades (props) para o nosso Modal
interface ScheduleModalProps {
  installation: Installation;
  onClose: () => void;
  onSchedule: (id: number, date: string, time: string) => void;
}

// Componente para o Modal de Agendamento
function ScheduleModal({ installation, onClose, onSchedule }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Agendar Instalação</h3>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Veículo:</strong> {installation.modelo}</p>
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

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/get-installations');
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setInstallations(data);
    } catch (err) {
      setError('Não foi possível carregar as instalações.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  const handleSchedule = async (id: number, date: string, time: string) => {
    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date, time }),
      });
      if (!response.ok) {
        throw new Error('Falha ao agendar.');
      }
      alert('Agendado com sucesso!');
      setSelectedInstallation(null);
      fetchInstallations();
    } catch (error) {
      alert(`Erro ao agendar.`);
      console.error(error);
    }
  };

  const handleCopy = (inst: Installation) => {
    const formattedText = `Veiculo ${inst.modelo?.split(' ')[0] || ''}
Modelo: ${inst.modelo}
Ano Fabricação: ${inst.ano || ''}
Placa: ${inst.placa}
Cor: ${inst.cor || ''}
Nome: ${inst.nome_completo}
Telefone: ${inst.contato}
usuario: ${inst.usuario}
senha: ${inst.senha || ''}
BASE Atena ( ${inst.base === 'Atena' ? 'X' : ' '} )   Base Autocontrol ( ${inst.base === 'Autocontrol' ? 'X' : ' '} )
Bloqueio sim ( ${inst.bloqueio === 'Sim' ? 'X' : ' '} )  nao ( ${inst.bloqueio === 'Nao' ? 'X' : ' '} )`;
    navigator.clipboard.writeText(formattedText)
      .then(() => alert('Informações copiadas!'))
      .catch(() => alert('Erro ao copiar.'));
  };

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
              <tr key={inst.id}>
                <td>{inst.nome_completo}</td>
                <td>{`${inst.modelo} (${inst.placa})`}</td>
                <td>
                  {inst.status === 'Agendado' 
                    ? `${inst.data_instalacao} às ${inst.horario}`
                    : inst.status
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