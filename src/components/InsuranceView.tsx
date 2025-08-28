// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import { Form, Card, ListGroup, Badge, Modal, Button, Alert, Spinner, InputGroup, Row, Col, Table } from 'react-bootstrap';
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
  endereco: string;
  base: string;
  data_instalacao?: string;
  horario?: string;
  status: string;
  historico: History[];
}

interface DetailsModalProps {
  installation: Installation;
  onClose: () => void;
  onViewHistory: (installation: Installation) => void;
}

function HistoryModal({ isOpen, installation, onClose }: { isOpen: boolean, installation: Installation, onClose: () => void }) {
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

function DetailsModal({ installation, onClose, onViewHistory }: DetailsModalProps) {
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalhes da Instalação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Contato:</strong> {installation.contato}</p>
        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
        <p><strong>Endereço:</strong> {installation.endereco}</p>
        <p><strong>Base:</strong> <Badge bg={installation.base === 'Atena' ? 'secondary' : 'primary'}>{installation.base}</Badge></p>
        <p><strong>Status:</strong> <Badge bg={installation.status === 'Agendado' ? 'primary' : installation.status === 'Concluído' ? 'success' : 'warning'} text={installation.status === 'A agendar' ? 'dark' : 'white'}>{installation.status}</Badge></p>
        {installation.status === 'Agendado' && installation.data_instalacao && (
          <p><strong>Agendado para:</strong> {new Date(installation.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às {installation.horario}</p>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={() => onViewHistory(installation)}>
          <i className="bi bi-clock-history me-1"></i> Ver Histórico
        </Button>
        <Button variant="primary" onClick={onClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}

export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Installation | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchInstallations() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado.');

        const response = await fetch('/.netlify/functions/get-installations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) throw new Error('Falha ao buscar dados.');
        const data: Installation[] = await response.json();
        setAllInstallations(data);
      } catch (err: any)
      {
        setError('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    fetchInstallations();
  }, []);

  const filteredInstallations = useMemo(() => 
    allInstallations.filter(inst => 
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
  [allInstallations, searchTerm]);

  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');
  const completed = filteredInstallations.filter(inst => inst.status === 'Concluído');
  const pending = filteredInstallations.filter(inst => inst.status === 'A agendar');

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  // --- FUNÇÃO DE RENDERIZAÇÃO ATUALIZADA COM O NOVO LAYOUT ---
  const renderListItem = (inst: Installation, statusBadge: React.ReactNode) => (
    <ListGroup.Item 
      key={inst.id} 
      action 
      onClick={() => setSelected(inst)}
    >
      <div className="fw-bold">{inst.nome_completo} ({inst.placa})</div>
      <div className="mt-1">
        <Badge pill bg={inst.base === 'Atena' ? 'secondary' : 'primary'}>
          <i className="bi bi-hdd-stack me-1"></i>
          {inst.base}
        </Badge>
        <span className="ms-2">{statusBadge}</span>
      </div>
    </ListGroup.Item>
  );
  // --- FIM DA ALTERAÇÃO ---

  return (
    <div>
      <Card className="mb-4">
        <Card.Header as="h5"><i className="bi bi-search me-2"></i>Consulta de Instalações</Card.Header>
        <Card.Body>
          <InputGroup>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control 
              type="text"
              placeholder="Buscar por nome ou placa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>
      
      <Row>
        <Col md={4} className="mb-3 mb-md-0">
          <Card>
            <Card.Header as="h5"><i className="bi bi-calendar-check me-2"></i>Agendadas</Card.Header>
            <ListGroup variant="flush">
              {scheduled.length > 0 ? (
                scheduled.map((inst) => renderListItem(inst, <Badge bg="primary">{inst.data_instalacao ? new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR') : 'Agendado'}</Badge>))
              ) : <ListGroup.Item>Nenhuma instalação agendada encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>

        <Col md={4} className="mb-3 mb-md-0">
          <Card>
            <Card.Header as="h5"><i className="bi bi-check-circle-fill me-2"></i>Concluídas</Card.Header>
            <ListGroup variant="flush">
              {completed.length > 0 ? (
                completed.map((inst) => renderListItem(inst, <Badge bg="success">Concluído</Badge>))
              ) : <ListGroup.Item>Nenhuma instalação concluída encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header as="h5"><i className="bi bi-clock-history me-2"></i>Pendentes</Card.Header>
            <ListGroup variant="flush">
              {pending.length > 0 ? (
                pending.map((inst) => renderListItem(inst, <Badge bg="warning" text="dark">{inst.status}</Badge>))
              ) : <ListGroup.Item>Nenhuma instalação pendente encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {selected && <DetailsModal installation={selected} onClose={() => setSelected(null)} onViewHistory={setHistoryTarget} />}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} installation={historyTarget} onClose={() => setHistoryTarget(null)} />}
    </div>
  );
}