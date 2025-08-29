// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import {
  Button, Table, Modal, Spinner, Alert, Card, Form, Badge, InputGroup, Dropdown, ButtonGroup, Accordion
} from 'react-bootstrap';
import { supabase } from '../supabaseClient';

// ... (Interfaces e Modals não mudam) ...
interface History {
  id: number;
  evento: string;
  data_evento: string;
}

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
  historico: History[];
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  installation: Installation;
  onSchedule: (id: number, date: string, time: string) => void;
  scheduleType: 'installation' | 'maintenance' | 'removal';
}

function ScheduleModal({ isOpen, onClose, installation, onSchedule, scheduleType }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };

  const getTitle = () => {
      switch(scheduleType) {
          case 'maintenance': return 'Agendar Manutenção';
          case 'removal': return 'Agendar Remoção';
          default: return 'Agendar Instalação';
      }
  }

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{getTitle()}</Modal.Title>
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

// --- FUNÇÃO AUXILIAR COM A COR CORRIGIDA ---
const getScheduledTaskInfo = (inst: Installation) => {
    if (inst.status !== 'Agendado') {
      return { text: 'N/A', variant: 'secondary' };
    }
    const lastEvent = inst.historico?.slice().sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime())[0];
    
    if (lastEvent?.evento.includes('Manutenção')) return { text: 'Manutenção', variant: 'warning' };
    if (lastEvent?.evento.includes('Remoção')) return { text: 'Remoção', variant: 'danger' };
    // Cor alterada de 'info' para 'primary'
    return { text: 'Instalação', variant: 'primary' };
};

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{installation: Installation, type: 'installation' | 'maintenance' | 'removal'} | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInstallations = async () => { /* ... (sem alterações) ... */ 
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/get-installations', {
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
        },
      });
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

  // --- ARRAYS FILTRADOS POR STATUS, COMO NA TELA DE CONSULTA ---
  const pending = filteredInstallations.filter(inst => inst.status === 'A agendar');
  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');
  const completed = filteredInstallations.filter(inst => inst.status === 'Concluído');

  const handleUpdate = async (id: number, status: string, options: { date?: string; time?: string; type?: 'maintenance' | 'removal'; completionType?: 'maintenance' | 'removal' | 'installation' } = {}) => { /* ... (sem alterações) ... */ 
    try {
      const { date, time, type, completionType } = options;
      const finalStatus = (type === 'maintenance' || type === 'removal') ? 'Agendado' : status;

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
  
  const getCompletionType = (inst: Installation) => { /* ... (sem alterações) ... */ 
    const lastEvent = inst.historico?.slice().sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime())[0];
    if (lastEvent?.evento === 'Manutenção Agendada') return 'maintenance';
    if (lastEvent?.evento === 'Remoção Agendada') return 'removal';
    return 'installation';
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

  // --- NOVA FUNÇÃO PARA RENDERIZAR AS TABELAS DENTRO DO ACORDEÃO ---
  const renderInstallationsTable = (installationsList: Installation[]) => {
    if (installationsList.length === 0) {
        return <p className="text-muted p-3 mb-0 fst-italic">Nenhum registro encontrado.</p>;
    }

    return (
        <Table striped bordered hover responsive className="mb-0">
            <thead className="table-light">
                <tr>
                    <th>Cliente</th>
                    <th>Veículo</th>
                    <th>Agendamento</th>
                    <th className="text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                {installationsList.map((inst) => {
                    const taskInfo = getScheduledTaskInfo(inst);
                    return (
                        <tr key={inst.id}>
                            <td>{inst.nome_completo}</td>
                            <td>{`${inst.modelo} (${inst.placa})`}</td>
                            <td>
                                {inst.status === 'Agendado' ? (
                                    <>
                                        {`${new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às ${inst.horario}`}
                                        <Badge bg={taskInfo.variant} className="ms-2">{taskInfo.text}</Badge>
                                    </>
                                ) : 'N/A'}
                            </td>
                            <td className="text-center">
                                <ButtonGroup>
                                    {inst.status === 'A agendar' && <Button size="sm" variant="primary" onClick={() => setSelected({ installation: inst, type: 'installation' })}>Agendar</Button>}
                                    {inst.status === 'Agendado' && <Button size="sm" variant="success" onClick={() => handleUpdate(inst.id, 'Concluído', { completionType: getCompletionType(inst) })}>Concluir</Button>}
                                    {inst.status === 'Concluído' &&
                                        <>
                                            <Button size="sm" variant="warning" onClick={() => setSelected({ installation: inst, type: 'maintenance' })}>Manutenção</Button>
                                            <Button size="sm" variant="danger" onClick={() => setSelected({ installation: inst, type: 'removal' })}>Remoção</Button>
                                        </>
                                    }
                                    <Dropdown as={ButtonGroup}>
                                        <Dropdown.Toggle split variant={inst.status === 'Concluído' ? 'secondary' : inst.status === 'Agendado' ? 'success' : 'primary'} size="sm" id={`dropdown-${inst.id}`} />
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setHistoryTarget(inst)}>Histórico</Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleCopy(inst)}>Copiar Dados</Dropdown.Item>
                                            {inst.status === 'Agendado' && <Dropdown.Divider />}
                                            {inst.status === 'Agendado' && <Dropdown.Item onClick={() => setSelected({ installation: inst, type: 'installation' })}>Reagendar</Dropdown.Item>}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </ButtonGroup>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </Table>
    );
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <Card className="mb-4">
        <Card.Header as="h5"><i className="bi bi-search me-2"></i>Painel de Agendamentos</Card.Header>
        <Card.Body>
          <InputGroup>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control 
              placeholder="Buscar por cliente, placa ou modelo..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mb-4">{message.text}</Alert>}

      {/* --- ESTRUTURA PRINCIPAL ATUALIZADA PARA O LAYOUT DE ACORDEÃO --- */}
      <Accordion>
        <Accordion.Item eventKey="0" className="mb-3">
          <Accordion.Header><i className="bi bi-clock-history me-2"></i>Pendentes ({pending.length})</Accordion.Header>
          <Accordion.Body className="p-0">
            {renderInstallationsTable(pending)}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1" className="mb-3">
          <Accordion.Header><i className="bi bi-calendar-check me-2"></i>Agendadas ({scheduled.length})</Accordion.Header>
          <Accordion.Body className="p-0">
            {renderInstallationsTable(scheduled)}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2">
          <Accordion.Header><i className="bi bi-check-circle-fill me-2"></i>Concluídas ({completed.length})</Accordion.Header>
          <Accordion.Body className="p-0">
            {renderInstallationsTable(completed)}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
      
      {selected && (
        <ScheduleModal 
            isOpen={!!selected} 
            onClose={() => setSelected(null)} 
            installation={selected.installation}
            onSchedule={(id, date, time) => handleUpdate(id, 'Agendado', { date, time, type: selected.type !== 'installation' ? selected.type : undefined })}
            scheduleType={selected.type}
        />
      )}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </>
  );
}