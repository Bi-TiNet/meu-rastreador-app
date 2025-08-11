// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import './Dashboard.css';

// Define a "forma" dos dados de uma instalação
interface Installation {
  'NOME COMPLETO': string;
  'Nº DE CONTATO': string;
  'PLACA DO VEÍCULO': string;
  'MODELO DO VEÍCULO': string;
  'ENDEREÇO CLIENTE': string;
  'USUÁRIO': string;
  'SENHA'?: string;
  'BASE': 'Atena' | 'Autocontrol';
  'BLOQUEIO': 'Sim' | 'Nao';
  'STATUS': string;
  'ANO DE FABRICAÇÃO'?: string;
  'COR DO VEÍCULO'?: string;
  'DATA DA INSTALAÇÃO'?: string;
  'HORÁRIO'?: string;
  rowIndex: number;
  // CORREÇÃO: Permite que qualquer outra chave seja string ou número
  [key: string]: string | number | undefined;
}

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados
  const fetchInstallations = async () => {
    setLoading(true); // Mostra o carregando ao atualizar
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

  // Função para agendar data e hora
  const handleSchedule = async (rowIndex: number, dateTime: string) => {
    if (!dateTime) return;

    try {
      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, dateTime }),
      });

      if (!response.ok) throw new Error('Falha ao agendar.');
      
      alert('Agendado com sucesso!');
      // Atualiza a lista para refletir a mudança
      fetchInstallations(); 
    } catch (error) {
      alert('Erro ao agendar. Tente novamente.');
      console.error(error);
    }
  };

  // Função para copiar os dados formatados
  const handleCopy = (inst: Installation) => {
    const brand = inst['MODELO DO VEÍCULO']?.split(' ')[0] || '';
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
      .then(() => alert('Informações copiadas para a área de transferência!'))
      .catch(() => alert('Erro ao copiar informações.'));
  };

  if (loading) return <p>Carregando agendamentos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="dashboard">
      <h2>Painel de Agendamentos</h2>
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
              <td>{inst['MODELO DO VEÍCULO']} ({inst['PLACA DO VEÍCULO']})</td>
              <td>
                {inst['STATUS'] === 'Agendado' 
                  ? `${inst['DATA DA INSTALAÇÃO']} às ${inst['HORÁRIO']}`
                  : inst['STATUS']
                }
              </td>
              <td className="actions-cell">
                <button onClick={() => handleCopy(inst)}>
                  Copiar 📋
                </button>
                <label className="schedule-button" title="Agendar data e hora">
                  🗓️
                  <input 
                    type="datetime-local"
                    onChange={(e) => handleSchedule(inst.rowIndex, e.target.value)}
                  />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}