// src/components/Dashboard.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  Button, Table, Modal, Spinner, Alert, Card, Form, Badge, InputGroup, Dropdown, ButtonGroup, Accordion, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface History {
  id: number;
  evento: string;
  data_evento: string;
  realizado_por: string;
}

interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  endereco: string;
  base: string;
  bloqueio: string;
  status: string;
  data_instalacao?: string;
  horario?: string;
  historico: History[];
  tipo_servico: string;
  observacao?: string;
  usuario: string;
  senha?: string;
  ano?: string;
  cor?: string;
  tecnico_id?: string;
  profiles?: {
    id: string;
    full_name: string;
  };
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  installation: Installation;
  onSchedule: (id: number, date: string, time: string, tecnico_id: string) => void;
  scheduleType: 'installation' | 'maintenance' | 'removal';
}

function ScheduleModal({ isOpen, onClose, installation, onSchedule, scheduleType }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [technicians, setTechnicians] = useState<User[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'tecnico');
      if (!error && data) {
        setTechnicians(data.map((t: any) => ({ id: t.id, user_metadata: { full_name: t.full_name }, ...t } as User)));
      }
    };
    if (isOpen) {
      fetchTechnicians();
      // Pré-define data e hora se for reagendamento
      if (installation.data_instalacao && installation.horario) {
        setDateTime(`${installation.data_instalacao}T${installation.horario}`);
      }
      // Pré-define técnico se for reagendamento
      if (installation.tecnico_id) {
        setSelectedTechnician(installation.tecnico_id);
      }
    }
  }, [isOpen, installation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime || !selectedTechnician) {
      alert("Por favor, selecione data, hora e técnico.");
      return;
    }
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time, selectedTechnician);
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
      <Modal.Header closeButton><Modal.Title>{getTitle()}</Modal.Title></Modal.Header>
      <Modal.Body>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Data e Hora</Form.Label>
            <Form.Control type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
          </Form.Group>
          <Form.Group>
            <Form.Label>Técnico Responsável</Form.Label>
            <Form.Select value={selectedTechnician} onChange={e => setSelectedTechnician(e.target.value)} required>
                <option value="">Selecione um técnico...</option>
                {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.user_metadata?.full_name || tech.email}</option>
                ))}
            </Form.Select>
          </Form.Group>
          <Modal.Footer className="mt-3 border-0 px-0 pb-0">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Agendamento</Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

function HistoryModal({ isOpen, onClose, installation }: { isOpen: boolean, onClose: () => void, installation: Installation }) {
    const sortedHistory = useMemo(() => installation.historico ? [...installation.historico].sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()) : [], [installation.historico]);

    return (
        <Modal show={isOpen} onHide={onClose} centered size="lg">
            <Modal.Header closeButton><Modal.Title>Histórico de {installation.nome_completo}</Modal.Title></Modal.Header>
            <Modal.Body>
                <Table striped bordered hover size="sm">
                    <thead><tr><th>Data</th><th>Evento</th><th>Realizado por</th></tr></thead>
                    <tbody>
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map(h => (
                                <tr key={h.id}>
                                    <td>{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                                    <td>{h.evento}</td>
                                    <td>{h.realizado_por || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (<tr><td colSpan={3} className="text-center">Nenhum histórico encontrado.</td></tr>)}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
}

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{installation: Installation, type: 'installation' | 'maintenance' | 'removal'} | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/get-installations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
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
  
  useEffect(() => { fetchInstallations(); }, []);
  
  const handleUpdate = async (id: number, status: string, options: { date?: string; time?: string; tecnico_id?: string; type?: 'installation' | 'maintenance' | 'removal'; completionType?: 'installation' | 'maintenance' | 'removal' } = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const { date, time, type, completionType, tecnico_id } = options;
      const finalStatus = (type || status === 'Agendado') ? 'Agendado' : status;

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, status: finalStatus, date, time, type, completionType, tecnico_id }),
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

  const filteredInstallations = useMemo(() =>
    installations.filter(inst =>
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [installations, searchTerm]);

  const pending = filteredInstallations.filter(inst => inst.status === 'A agendar');
  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');
  const completed = filteredInstallations.filter(inst => inst.status === 'Concluído');

  const renderTable = (installationsList: Installation[], listType: 'pending' | 'scheduled' | 'completed') => {
    if (installationsList.length === 0) {
        return <p className="text-muted p-3 mb-0 fst-italic">Nenhum registro encontrado.</p>;
    }

    const headers = {
      pending: ['Cliente', 'Veículo', 'Tipo de Serviço', 'Ações'],
      scheduled: ['Cliente', 'Veículo', 'Agendamento', 'Técnico', 'Ações'],
      completed: ['Cliente', 'Veículo', 'Tipo de Serviço', 'Ações']
    };

    return (
        <Table striped bordered hover responsive className="mb-0 align-middle">
            <thead className="table-light">
                <tr>{headers[listType].map(h => <th key={h} className={h === 'Ações' ? 'text-center' : ''}>{h}</th>)}</tr>
            </thead>
            <tbody>
                {installationsList.map((inst) => (
                    <tr key={inst.id}>
                        <td>
                          {inst.nome_completo}
                          {inst.observacao && (
                            <OverlayTrigger placement="top" overlay={<Tooltip>{inst.observacao}</Tooltip>}>
                              <i className="bi bi-info-circle-fill text-warning ms-2"></i>
                            </OverlayTrigger>
                          )}
                        </td>
                        <td>{`${inst.modelo} (${inst.placa})`}</td>
                        {listType === 'scheduled' && <td>{inst.data_instalacao && inst.horario ? `${new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às ${inst.horario}`: 'N/A'}</td>}
                        {listType === 'scheduled' && <td>{inst.profiles?.full_name || 'Não definido'}</td>}
                        
                        {(listType === 'pending' || listType === 'completed') && 
                          <td>
                           <Badge bg={inst.tipo_servico === 'Instalação' ? 'primary' : inst.tipo_servico === 'Manutenção' ? 'warning' : 'danger'}>
                               {inst.tipo_servico}
                           </Badge>
                          </td>
                        }
                        <td className="text-center">
                            {listType === 'pending' &&
                                <Button size="sm" variant={inst.tipo_servico === 'Instalação' ? 'primary' : inst.tipo_servico === 'Manutenção' ? 'warning' : 'danger'} onClick={() => setSelected({ installation: inst, type: inst.tipo_servico.toLowerCase() as any })}>
                                    Agendar {inst.tipo_servico}
                                </Button>
                            }
                            {listType === 'scheduled' &&
                                <ButtonGroup>
                                    <Button size="sm" variant="success" onClick={() => handleUpdate(inst.id, 'Concluído', { completionType: inst.tipo_servico.toLowerCase() as any })}>Concluir</Button>
                                    <Dropdown as={ButtonGroup}>
                                        <Dropdown.Toggle split variant="secondary" size="sm" />
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setSelected({ installation: inst, type: inst.tipo_servico.toLowerCase() as any })}>Reagendar</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </ButtonGroup>
                            }
                             {listType === 'completed' &&
                                <>
                                    <Button size="sm" variant="warning" className="me-1" onClick={() => setSelected({ installation: inst, type: 'maintenance' })}>Manutenção</Button>
                                    <Button size="sm" variant="danger" onClick={() => setSelected({ installation: inst, type: 'removal' })}>Remoção</Button>
                                </>
                            }
                            <Button variant="link" size="sm" onClick={() => setHistoryTarget(inst)} className="ms-1"><i className="bi bi-clock-history"></i></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
  };
  
  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <Card className="mb-4">
        <Card.Header as="h5"><i className="bi bi-clipboard-data me-2"></i>Painel de Agendamentos</Card.Header>
        <Card.Body>
          <InputGroup>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control placeholder="Buscar por cliente, placa ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </InputGroup>
        </Card.Body>
      </Card>

      {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mb-4">{message.text}</Alert>}

      <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
        <Accordion.Item eventKey="0" className="mb-3">
          <Accordion.Header><i className="bi bi-clock-history me-2"></i>Pendentes ({pending.length})</Accordion.Header>
          <Accordion.Body className="p-0">{renderTable(pending, 'pending')}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1" className="mb-3">
          <Accordion.Header><i className="bi bi-calendar-check me-2"></i>Agendadas ({scheduled.length})</Accordion.Header>
          <Accordion.Body className="p-0">{renderTable(scheduled, 'scheduled')}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header><i className="bi bi-check-circle-fill me-2"></i>Concluídas ({completed.length})</Accordion.Header>
          <Accordion.Body className="p-0">{renderTable(completed, 'completed')}</Accordion.Body>
        </Accordion.Item>
      </Accordion>
      
      {selected && (
        <ScheduleModal 
            isOpen={!!selected} 
            onClose={() => setSelected(null)} 
            installation={selected.installation}
            onSchedule={(id, date, time, tecnico_id) => handleUpdate(id, 'Agendado', { date, time, tecnico_id, type: selected.type })}
            scheduleType={selected.type}
        />
      )}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </>
  );
}