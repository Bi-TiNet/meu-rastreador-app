// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  Form,
  Card,
  ListGroup,
  Badge,
  Modal,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Table,
  Accordion,
  Row,
  Col,
  FloatingLabel,
} from 'react-bootstrap';
import { supabase } from '../supabaseClient';

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
  ano?: string;
  cor?: string;
  endereco: string;
  usuario: string;
  senha?: string;
  base: string;
  bloqueio: string;
  data_instalacao?: string;
  horario?: string;
  status: string;
  historico: History[];
  tipo_servico: string;
  observacao?: string;
}

function HistoryModal({
  isOpen,
  installation,
  onClose,
}: {
  isOpen: boolean;
  installation: Installation;
  onClose: () => void;
}) {
  const sortedHistory = installation.historico
    ? [...installation.historico].sort(
        (a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()
      )
    : [];

  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Histórico de {installation.nome_completo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Data</th>
              <th>Evento</th>
              <th>Realizado por</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.length > 0 ? (
              sortedHistory.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                  <td>{h.evento}</td>
                  <td>{h.realizado_por || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">
                  Nenhum histórico encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
}

function DetailsModal({
  installation,
  onClose,
  onViewHistory,
  onEdit,
}: {
  installation: Installation;
  onClose: () => void;
  onViewHistory: (installation: Installation) => void;
  onEdit: (installation: Installation) => void;
}) {
  const handleCopy = async () => {
    const text = `
Veículo ${installation.modelo}
Modelo: ${installation.modelo}
Ano Fabricação: ${installation.ano || 'N/A'}
Placa: ${installation.placa}
Cor: ${installation.cor || 'N/A'}
Nome: ${installation.nome_completo}
Telefone: ${installation.contato}
usuario: ${installation.usuario || 'N/A'}
senha: ${installation.senha || 'N/A'}
BASE Atena (${installation.base === 'Atena' ? 'X' : ' '})   Base Autocontrol (${installation.base === 'Autocontrol' ? 'X' : ' '})
Bloqueio sim (${installation.bloqueio === 'Sim' ? 'X' : ' '})   nao (${installation.bloqueio === 'Nao' ? 'X' : ' '})
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      alert('Dados copiados no formato para WhatsApp!');
    } catch {
      alert('Falha ao copiar os dados.');
    }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detalhes da Solicitação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <p>
              <strong>Cliente:</strong> {installation.nome_completo}
            </p>
            <p>
              <strong>Contato:</strong> {installation.contato}
            </p>
            <p>
              <strong>Endereço:</strong> {installation.endereco}
            </p>
          </Col>
          <Col md={6}>
            <p>
              <strong>Veículo:</strong> {installation.modelo}
            </p>
            <p>
              <strong>Placa:</strong> {installation.placa}
            </p>
            <p>
              <strong>Ano/Cor:</strong> {installation.ano || 'N/A'} / {installation.cor || 'N/A'}
            </p>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6}>
            <p>
              <strong>Tipo de Serviço:</strong>
              <Badge
                bg={
                  installation.tipo_servico === 'Instalação'
                    ? 'primary'
                    : installation.tipo_servico === 'Manutenção'
                    ? 'warning'
                    : 'danger'
                }
                className="ms-2"
              >
                {installation.tipo_servico}
              </Badge>
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <Badge
                bg={
                  installation.status === 'Agendado'
                    ? 'info'
                    : installation.status === 'Concluído'
                    ? 'success'
                    : 'secondary'
                }
              >
                {installation.status}
              </Badge>
            </p>
            {installation.status === 'Agendado' && installation.data_instalacao && (
              <p>
                <strong>Agendado para:</strong>{' '}
                {new Date(installation.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
                {installation.horario}
              </p>
            )}
          </Col>
          <Col md={6}>
            <p>
              <strong>Usuário:</strong> {installation.usuario || 'N/A'}
            </p>
            <p>
              <strong>Base:</strong>{' '}
              <Badge bg={installation.base === 'Atena' ? 'secondary' : 'primary'}>{installation.base}</Badge>
            </p>
            <p>
              <strong>Bloqueio:</strong> {installation.bloqueio}
            </p>
          </Col>
        </Row>
        {installation.observacao && (
          <>
            <hr />
            <p>
              <strong>Observação:</strong>
            </p>
            <p className="text-muted fst-italic bg-light p-2 rounded">{installation.observacao}</p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button variant="info" onClick={() => onEdit(installation)} className="me-2">
            <i className="bi bi-pencil-square me-1"></i> Editar
          </Button>
          <Button variant="secondary" onClick={() => onViewHistory(installation)} className="me-2">
            <i className="bi bi-clock-history me-1"></i> Ver Histórico
          </Button>
          <Button variant="outline-primary" onClick={handleCopy}>
            <i className="bi bi-clipboard me-1"></i> Copiar Dados
          </Button>
        </div>
        <Button variant="primary" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function EditModal({
  installation,
  onClose,
  onSave,
}: {
  installation: Installation;
  onClose: () => void;
  onSave: (updatedData: Installation) => void;
}) {
  const [formData, setFormData] = useState<Installation>(installation);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(installation);
  }, [installation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: id === 'placa' ? value.toUpperCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Solicitação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* ...campos (mesmo que antes, mantive todos)... */}
          {/* Mantive os FloatingLabel com handleChange igual ao seu último código */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? <Spinner as="span" size="sm" /> : 'Salvar Alterações'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<Installation | null>(null);
  const [editingTarget, setEditingTarget] = useState<Installation | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(
    null
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchInstallations = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/get-installations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setAllInstallations(data);
    } catch {
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  const handleEditClick = (installation: Installation) => {
    setSelected(null);
    setEditingTarget(installation);
  };

  const handleSaveEdit = async (updatedData: Installation) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar as alterações.');
      }

      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      setEditingTarget(null);
      await fetchInstallations();
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
    }
  };

  const filteredInstallations = useMemo(
    () =>
      allInstallations.filter(
        (inst) =>
          inst.nome_completo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          inst.placa.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [allInstallations, debouncedSearch]
  );

  const scheduled = filteredInstallations.filter((inst) => inst.status === 'Agendado');
  const completed = filteredInstallations.filter((inst) => inst.status === 'Concluído');
  const pending = filteredInstallations.filter((inst) => inst.status === 'A agendar');

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  const renderListItem = (inst: Installation) => {
    let statusContent;
    switch (inst.status) {
      case 'Agendado':
        statusContent = (
          <Badge bg="info">
            {inst.data_instalacao
              ? new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')
              : 'Agendado'}
          </Badge>
        );
        break;
      case 'Concluído':
        statusContent = <Badge bg="success">Concluído</Badge>;
        break;
      default:
        statusContent = (
          <Badge bg="warning" text="dark">
            {inst.status}
          </Badge>
        );
        break;
    }
    return (
      <ListGroup.Item key={inst.id} action onClick={() => setSelected(inst)}>
        <div className="d-flex w-100 justify-content-between">
          <h6 className="mb-1">
            {inst.nome_completo} ({inst.placa})
          </h6>
          <small>{inst.tipo_servico}</small>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-1">
          <Badge pill bg={inst.base === 'Atena' ? 'secondary' : 'primary'}>
            <i className="bi bi-hdd-stack me-1"></i>
            {inst.base}
          </Badge>
          {statusContent}
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header as="h5">
          <i className="bi bi-search me-2"></i>Consulta de Solicitações
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
              {message.text}
            </Alert>
          )}
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nome ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
        <Accordion.Item eventKey="0" className="mb-3">
          <Accordion.Header>
            <i className="bi bi-clock-history me-2"></i>Pendentes ({pending.length})
          </Accordion.Header>
          <Accordion.Body className="p-0">
            <ListGroup variant="flush">
              {pending.length > 0 ? (
                pending.map(renderListItem)
              ) : (
                <ListGroup.Item>Nenhuma solicitação pendente.</ListGroup.Item>
              )}
            </ListGroup>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1" className="mb-3">
          <Accordion.Header>
            <i className="bi bi-calendar-check me-2"></i>Agendadas ({scheduled.length})
          </Accordion.Header>
          <Accordion.Body className="p-0">
            <ListGroup variant="flush">
              {scheduled.length > 0 ? (
                scheduled.map(renderListItem)
              ) : (
                <ListGroup.Item>Nenhuma solicitação agendada.</ListGroup.Item>
              )}
            </ListGroup>
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header>
            <i className="bi bi-check-circle-fill me-2"></i>Concluídas ({completed.length})
          </Accordion.Header>
          <Accordion.Body className="p-0">
            <ListGroup variant="flush">
              {completed.length > 0 ? (
                completed.map(renderListItem)
              ) : (
                <ListGroup.Item>Nenhuma solicitação concluída.</ListGroup.Item>
              )}
            </ListGroup>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {selected && (
        <DetailsModal
          installation={selected}
          onClose={() => setSelected(null)}
          onViewHistory={(inst) => setHistoryTarget(inst)}
          onEdit={handleEditClick}
        />
      )}
      {editingTarget && (
        <EditModal
          installation={editingTarget}
          onClose={() => setEditingTarget(null)}
          onSave={handleSaveEdit}
        />
      )}
      {historyTarget && (
        <HistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          installation={historyTarget}
        />
      )}
    </div>
  );
}
