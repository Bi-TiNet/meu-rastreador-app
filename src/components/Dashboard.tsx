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
  'SENHA'?: string; // Senha é opcional
  'BASE': 'Atena' | 'Autocontrol';
  'BLOQUEIO': 'Sim' | 'Nao';
  'STATUS': string;
  // Adicione aqui outros campos se houver, como Ano e Cor
  'ANO DE FABRICAÇÃO'?: string;
  'COR DO VEÍCULO'?: string;
}

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect vai rodar uma vez quando o componente carregar
  useEffect(() => {
    async function fetchInstallations() {
      try {
        const response = await fetch('/.netlify/functions/get-installations');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados.');
        }
        const data: Installation[] = await response.json();
        setInstallations(data);
      } catch (err) {
        setError('Não foi possível carregar as instalações.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInstallations();
  }, []);

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
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {installations.map((inst, index) => (
            <tr key={index}>
              <td>{inst['NOME COMPLETO']}</td>
              <td>{inst['MODELO DO VEÍCULO']} ({inst['PLACA DO VEÍCULO']})</td>
              <td>{inst['STATUS']}</td>
              <td>
                <button onClick={() => handleCopy(inst)}>
                  Copiar para Fornecedor
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}