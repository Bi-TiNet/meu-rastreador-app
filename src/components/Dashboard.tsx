// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import './Dashboard.css';

interface Installation {
  'NOME COMPLETO': string;
  'Nº DE CONTATO': string;
  'PLACA DO VEÍCULO': string;
  'MODELO DO VEÍCULO': string;
  'STATUS': string;
  // ... outros campos ...
  [key: string]: string; // Permite outras chaves
  rowIndex: number; // Adicionamos o índice da linha para identificação
}

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados
  const fetchInstallations = async () => {
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
    // ... (código de cópia continua o mesmo)
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
        {/* ... thead ... */}
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Veículo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {installations.map((inst, index) => (
            <tr key={index}>
              <td>{inst['NOME COMPLETO']}</td>
              <td>{inst['MODELO DO VEÍCULO']} ({inst['PLACA DO VEÍCULO']})</td>
              <td>
                {inst['STATUS'] === 'Agendado' 
                  ? `${inst['DATA DA INSTALAÇÃO']} - ${inst['HORÁRIO']}`
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