// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import './Dashboard.css';
import './Modal.css';

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

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      // MUDANÇA IMPORTANTE: Apontando para a nova API do Google Apps Script
      const response = await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL);
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

  const handleSchedule = async (rowIndex: number, dateTime: string) => {
    if (!dateTime) return;
    try {
      // MUDANÇA IMPORTANTE: Apontando para a nova API do Google Apps Script
      await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, dateTime }),
      });
      alert('Agendado com sucesso!');
      setSelectedInstallation(null);
      fetchInstallations();
    } catch (error) {
      alert('Erro ao agendar.');
      console.error(error);
    }
  };

  const handleCopy = (inst: Installation) => {
    const brand = (inst['MODELO DO VEÍCULO'] as string)?.split(' ')[0] || '';
    const formattedText = `Veiculo ${brand}
Modelo: ${inst['MODELO DO VEÍCULO']}
Ano Fabricação: ${inst['ANO DE FABRICAÇÃO'] || ''}
Placa: ${inst['PLACA DO VEÍCULO']}
Cor: ${inst['COR DO VEÍCULO'] || ''}
Nome: ${inst['NOME COMPLETO']}
Telefone: ${inst['Nº DE CONTATO']}
usuario: ${inst['USUÁRIO']}
senha: ${inst['SENHA'] || ''}
BASE Atena ( ${inst['BASE'] === 'Atena' ? 'X' : ' '} )   Base Autocontrol ( ${inst['BASE'] === 'Autocontrol' ? 'X' : ' '} )
Bloqueio sim ( ${inst['BLOQUEIO'] === 'Sim' ? 'X' : ' '} )  nao ( ${inst['BLOQUEIO'] === 'Nao' ? 'X' : ' '} )`;
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