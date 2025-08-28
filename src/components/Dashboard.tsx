// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import {
  Button, Table, Modal, Spinner, Alert, Card, Form, Badge, InputGroup, Dropdown, ButtonGroup
} from 'react-bootstrap';

// ... (Interfaces History, Installation, ScheduleModalProps, HistoryModalProps e os componentes de Modal não mudam) ...
// Interface para o histórico
interface History {
  id: number;
  evento: string;
  data_evento: string;
}

// Interface para os dados de uma instalação
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
  historico: History[]; // Adicionado campo de histórico
}

// Componente para o Modal de Agendamento/Manutenção
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  installation: Installation;
  onSchedule: (id: number, date: string, time: string) => void;
  isMaintenance: boolean;
}

function ScheduleModal({ isOpen, onClose, installation, onSchedule, isMaintenance }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };

  const title = isMaintenance ? 'Agendar Manutenção' : 'Agendar Instalação';

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Data e Hora</Form.Label>
            <Form.Control type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
          </Form.Group>
          <Modal.Footer className="mt-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Agendamento</Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

// NOVO Componente para o Modal de Histórico
interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    installation: Installation;
}

function HistoryModal({ isOpen, onClose, installation }: HistoryModalProps) {
    const sortedHistory = installation.historico ? [...installation.historico].sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()) : [];

    return (
        <Modal show={isOpen} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Histórico de {installation.nome_completo}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table striped bordered size="sm">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Evento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map(h => (
                                <tr key={h.id}>
                                    <td>{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                                    <td>{h.evento}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={2} className="text-center">Nenhum histórico encontrado.</td></tr>
                        )}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
}

// Componente principal do Dashboard
export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{installation: Installation, isMaintenance: boolean} | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInstallations = async () => {
    // setLoading(true); // Opcional: remover para um refresh mais suave
    try {
      const response = await fetch('/.netlify/functions/get-installations');
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setInstallations(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar as instalações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);
  
  const filteredInstallations = useMemo(() =>
    installations.filter(inst =>
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [installations, searchTerm]);

  // Função de Update ATUALIZADA
  const handleUpdate = async (id: number, status: string, options: { date?: string; time?: string; type?: 'maintenance'; completionType?: 'maintenance' | 'installation' } = {}) => {
    try {
      const { date, time, type, completionType } = options;
      const finalStatus = type === 'maintenance' ? 'Agendado' : status;

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: finalStatus, date, time, type, completionType }),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha na operação.');
      }
      setMessage({type: 'success', text: `Operação realizada com sucesso!`});
      setSelected(null);
      await fetchInstallations();
    } catch (error: any) {
        setMessage({type: 'danger', text: error.message || 'Erro ao processar a solicitação.'});
    }
  };
  
  // NOVA função para determinar o tipo de conclusão
  const getCompletionType = (inst: Installation) => {
    const lastEvent = inst.historico?.slice().sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime())[0];
    return lastEvent?.evento === 'Manutenção Agendada' ? 'maintenance' : 'installation';
  }

  const getStatusBadge = (status: string) => { /* ... (sem alterações) ... */ 
    switch(status) {
        case 'Agendado':
            return <Badge bg="primary">{status}</Badge>;
        case 'Concluído':
            return <Badge bg="success">{status}</Badge>;
        case 'A agendar':
        default:
            return <Badge bg="warning" text="dark">{status}</Badge>;
    }
  }

  const handleCopy = (inst: Installation) => { /* ... (sem alterações) ... */ 
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
      .then(() => setMessage({type: 'info', text: 'Informações copiadas!'}))
      .catch(() => setMessage({type: 'danger', text: 'Erro ao copiar.'}));
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card>
      <Card.Header as="h5">
        <i className="bi bi-clipboard-data me-2"></i>
        Painel de Agendamentos
      </Card.Header>
      <Card.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
          <Form.Control placeholder="Buscar por cliente, placa ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
        
        {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}

        <Table striped bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Agendamento</th>
              <th>Status</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstallations.map((inst: Installation) => (
              <tr key={inst.id}>
                <td>{inst.nome_completo}</td>
                <td>{`${inst.modelo} (${inst.placa})`}</td>
                <td>
                  {(inst.status === 'Agendado' && inst.data_instalacao) ? `${new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às ${inst.horario}`: 'N/A'}
                </td>
                <td>{getStatusBadge(inst.status)}</td>
                <td className="text-center">
                  {/* --- LAYOUT DOS BOTÕES ATUALIZADO --- */}
                  <ButtonGroup>
                    {inst.status === 'A agendar' && <Button size="sm" variant="primary" onClick={() => setSelected({installation: inst, isMaintenance: false})}>Agendar</Button>}
                    {inst.status === 'Agendado' && <Button size="sm" variant="success" onClick={() => handleUpdate(inst.id, 'Concluído', { completionType: getCompletionType(inst) })}>Concluir</Button>}
                    {inst.status === 'Concluído' && <Button size="sm" variant="warning" onClick={() => setSelected({installation: inst, isMaintenance: true})}>Agendar Manutenção</Button>}
                    
                    <Dropdown as={ButtonGroup}>
                      <Dropdown.Toggle split variant={inst.status === 'Concluído' ? 'warning' : inst.status === 'Agendado' ? 'success' : 'primary'} size="sm" id="dropdown-split-basic" />
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setHistoryTarget(inst)}>Histórico</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleCopy(inst)}>Copiar Dados</Dropdown.Item>
                        {inst.status !== 'A agendar' && <Dropdown.Divider />}
                        {inst.status === 'Agendado' && <Dropdown.Item onClick={() => setSelected({installation: inst, isMaintenance: false})}>Reagendar</Dropdown.Item>}
                      </Dropdown.Menu>
                    </Dropdown>
                  </ButtonGroup>
                  {/* --- FIM DO LAYOUT ATUALIZADO --- */}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {filteredInstallations.length === 0 && <div className="text-center text-muted mt-3">Nenhum resultado encontrado.</div>}
      </Card.Body>

      {selected && (
        <ScheduleModal 
            isOpen={!!selected} 
            onClose={() => setSelected(null)} 
            installation={selected.installation}
            onSchedule={(id, date, time) => handleUpdate(id, 'Agendado', { date, time, type: selected.isMaintenance ? 'maintenance' : undefined })}
            isMaintenance={selected.isMaintenance}
        />
      )}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </Card>
  );
}