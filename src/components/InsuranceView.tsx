// src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  Form, Card, Badge, Modal, Button, Alert, Spinner, InputGroup, Table, Accordion, Row, Col, FloatingLabel, ListGroup,
} from 'react-bootstrap';
import { supabase } from '../supabaseClient';

// Interfaces (não precisam de alterações)
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

// HistoryModal (não precisa de alterações)
function HistoryModal({ isOpen, installation, onClose }: { isOpen: boolean; installation: Installation; onClose: () => void; }) {
  const sortedHistory = useMemo(() => installation.historico ? [...installation.historico].sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()) : [], [installation.historico]);
  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg">
      <Modal.Header closeButton><Modal.Title>Histórico de {installation.nome_completo}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Table striped bordered hover size="sm">
          <thead><tr><th>Data</th><th>Evento</th><th>Realizado por</th></tr></thead>
          <tbody>
            {sortedHistory.length > 0 ? sortedHistory.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                <td>{h.evento}</td>
                <td>{h.realizado_por || 'N/A'}</td>
              </tr>
            )) : <tr><td colSpan={3} className="text-center">Nenhum histórico encontrado.</td></tr>}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
}

// EditModal (não precisa de alterações)
function EditModal({ installation, onClose, onSave, }: { installation: Installation; onClose: () => void; onSave: (updatedData: Installation) => void; }) {
  const [formData, setFormData] = useState<Installation>(installation);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setFormData(installation); }, [installation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: id === 'placa' ? value.toUpperCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try { await onSave(formData); } finally { setIsLoading(false); }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton><Modal.Title>Editar Solicitação</Modal.Title></Modal.Header>
        <Modal.Body>
           <h6 className="text-primary">DADOS DO CLIENTE E VEÍCULO</h6><hr className="mt-2" />
          <Row className="g-3 mb-4">
            <Col md={6}><FloatingLabel label="Nome Completo"><Form.Control id="nome_completo" value={formData.nome_completo} onChange={handleChange} required /></FloatingLabel></Col>
            <Col md={6}><FloatingLabel label="Contato"><Form.Control id="contato" value={formData.contato} onChange={handleChange} required /></FloatingLabel></Col>
            <Col md={4}><FloatingLabel label="Placa"><Form.Control id="placa" value={formData.placa} onChange={handleChange} required /></FloatingLabel></Col>
            <Col md={4}><FloatingLabel label="Modelo"><Form.Control id="modelo" value={formData.modelo} onChange={handleChange} /></FloatingLabel></Col>
            <Col md={2}><FloatingLabel label="Ano"><Form.Control id="ano" value={formData.ano || ''} onChange={handleChange} /></FloatingLabel></Col>
            <Col md={2}><FloatingLabel label="Cor"><Form.Control id="cor" value={formData.cor || ''} onChange={handleChange} /></FloatingLabel></Col>
            <Col md={12}><FloatingLabel label="Endereço"><Form.Control as="textarea" style={{ height: '80px' }} id="endereco" value={formData.endereco} onChange={handleChange} /></FloatingLabel></Col>
          </Row>
          <h6 className="text-primary">DETALHES DO SERVIÇO E ACESSO</h6><hr className="mt-2" />
          <Row className="g-3">
            <Col md={6}><FloatingLabel label="Tipo de Serviço"><Form.Select id="tipo_servico" value={formData.tipo_servico} onChange={handleChange}><option>Instalação</option><option>Manutenção</option><option>Remoção</option></Form.Select></FloatingLabel></Col>
            <Col md={6}><FloatingLabel label="Base"><Form.Select id="base" value={formData.base} onChange={handleChange}><option>Atena</option><option>Autocontrol</option></Form.Select></FloatingLabel></Col>
            <Col md={6}><FloatingLabel label="Usuário"><Form.Control id="usuario" value={formData.usuario} onChange={handleChange} /></FloatingLabel></Col>
            <Col md={6}><FloatingLabel label="Senha"><Form.Control type="text" id="senha" value={formData.senha || ''} onChange={handleChange} /></FloatingLabel></Col>
            <Col md={6}><FloatingLabel label="Bloqueio"><Form.Select id="bloqueio" value={formData.bloqueio} onChange={handleChange}><option>Sim</option><option>Nao</option></Form.Select></FloatingLabel></Col>
            <Col md={12}><FloatingLabel label="Observação"><Form.Control as="textarea" style={{ height: '100px' }} id="observacao" value={formData.observacao || ''} onChange={handleChange} /></FloatingLabel></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isLoading}>{isLoading ? <Spinner as="span" size="sm" /> : 'Salvar Alterações'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// VERSÃO CORRIGIDA E MELHORADA DO MODAL DE DETALHES
function DetailsModal({ installation, onClose, onViewHistory, onEdit }: { installation: Installation; onClose: () => void; onViewHistory: (installation: Installation) => void; onEdit: (installation: Installation) => void; }) {
  const handleCopy = async () => {
    const text = `Veículo ${installation.modelo}\nModelo: ${installation.modelo}\nAno Fabricação: ${installation.ano || 'N/A'}\nPlaca: ${installation.placa}\nCor: ${installation.cor || 'N/A'}\nNome: ${installation.nome_completo}\nTelefone: ${installation.contato}\nusuario: ${installation.usuario || 'N/A'}\nsenha: ${installation.senha || 'N/A'}\nBASE Atena (${installation.base === 'Atena' ? 'X' : ' '})   Base Autocontrol (${installation.base === 'Autocontrol' ? 'X' : ' '})\nBloqueio sim (${installation.bloqueio === 'Sim' ? 'X' : ' '})   nao (${installation.bloqueio === 'Nao' ? 'X' : ' '})`.trim();
    try {
      await navigator.clipboard.writeText(text);
      alert('Dados copiados no formato para WhatsApp!');
    } catch { alert('Falha ao copiar os dados.'); }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
            <i className="bi bi-file-text-fill me-2"></i>Detalhes da Solicitação
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6} className="mb-3 mb-md-0">
            <h5 className="text-primary">Cliente e Veículo</h5>
            <ListGroup variant="flush">
              <ListGroup.Item><strong>Cliente:</strong> {installation.nome_completo}</ListGroup.Item>
              <ListGroup.Item><strong>Contato:</strong> {installation.contato}</ListGroup.Item>
              <ListGroup.Item><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</ListGroup.Item>
              <ListGroup.Item><strong>Ano/Cor:</strong> {installation.ano || 'N/A'} / {installation.cor || 'N/A'}</ListGroup.Item>
              <ListGroup.Item><strong>Endereço:</strong> {installation.endereco}</ListGroup.Item>
            </ListGroup>
          </Col>

          <Col md={6}>
            <h5 className="text-primary">Serviço e Acesso</h5>
            <ListGroup variant="flush">
                <ListGroup.Item>
                    <strong>Status:</strong>{' '}
                    <Badge bg={installation.status === 'Agendado' ? 'info' : installation.status === 'Concluído' ? 'success' : 'warning'} text={installation.status === 'A agendar' ? 'dark' : 'white'}>
                        {installation.status}
                    </Badge>
                </ListGroup.Item>
                {installation.status === 'Agendado' && installation.data_instalacao && (
                    <ListGroup.Item><strong>Agendado para:</strong> {new Date(installation.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às {installation.horario}</ListGroup.Item>
                )}
              <ListGroup.Item><strong>Serviço:</strong> <Badge bg={installation.tipo_servico === 'Instalação' ? 'primary' : installation.tipo_servico === 'Manutenção' ? 'warning' : 'danger'}>{installation.tipo_servico}</Badge></ListGroup.Item>
              <ListGroup.Item><strong>Base:</strong> <Badge bg={installation.base === 'Atena' ? 'secondary' : 'primary'}>{installation.base}</Badge></ListGroup.Item>
              <ListGroup.Item><strong>Usuário/Senha:</strong> {installation.usuario || 'N/A'} / {installation.senha || 'N/A'}</ListGroup.Item>
              <ListGroup.Item><strong>Bloqueio:</strong> {installation.bloqueio}</ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        {installation.observacao && (
            <>
                <hr />
                <h5 className="text-primary mt-3">Observação</h5>
                <p className="text-muted fst-italic bg-light p-2 rounded" style={{ whiteSpace: 'pre-wrap' }}>{installation.observacao}</p>
            </>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between flex-wrap">
        <div className="mb-2 mb-md-0">
          <Button variant="info" onClick={() => onEdit(installation)} className="me-2"><i className="bi bi-pencil-square me-1"></i> Editar</Button>
          <Button variant="secondary" onClick={() => onViewHistory(installation)} className="me-2"><i className="bi bi-clock-history me-1"></i> Histórico</Button>
          <Button variant="outline-primary" onClick={handleCopy}><i className="bi bi-clipboard me-1"></i> Copiar</Button>
        </div>
        <Button variant="primary" onClick={onClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}

// Componente Principal
export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Installation | null>(null);
  const [editingTarget, setEditingTarget] = useState<Installation | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');
      const response = await fetch('/.netlify/functions/get-installations', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setAllInstallations(data);
    } catch { setError('Não foi possível carregar os dados.'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchInstallations(); }, []);

  const handleEditClick = (installation: Installation) => {
    setSelected(null);
    setEditingTarget(installation);
  };

  const handleSaveEdit = async (updatedData: Installation) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');
      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar as alterações.');
      }
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      setEditingTarget(null);
      await fetchInstallations();
    } catch (error: any) { setMessage({ type: 'danger', text: error.message }); }
  };

  const filteredInstallations = useMemo(() =>
      allInstallations.filter((inst) =>
          inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.placa.toLowerCase().includes(searchTerm.toLowerCase())
      ), [allInstallations, searchTerm]
  );

  const scheduled = filteredInstallations.filter((inst) => inst.status === 'Agendado');
  const completed = filteredInstallations.filter((inst) => inst.status === 'Concluído');
  const pending = filteredInstallations.filter((inst) => inst.status === 'A agendar');

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const renderInstallationsTable = (installations: Installation[]) => {
    if (installations.length === 0) {
      return <p className="text-muted p-3 text-center fst-italic">Nenhum registo encontrado.</p>;
    }
    return (
      <Table responsive striped hover className="align-middle">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Veículo</th>
            <th>Serviço</th>
            <th className="text-center">Status</th>
            <th className="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {installations.map(inst => (
            <tr key={inst.id}>
              <td>
                <div className="fw-bold">{inst.nome_completo}</div>
                <div className="small text-muted">{inst.contato}</div>
              </td>
              <td>
                <div>{inst.modelo}</div>
                <div className="small text-muted">{inst.placa}</div>
              </td>
              <td>
                <Badge bg={inst.tipo_servico === 'Instalação' ? 'primary' : inst.tipo_servico === 'Manutenção' ? 'warning' : 'danger'} className="me-1">
                  {inst.tipo_servico}
                </Badge>
                <Badge bg={inst.base === 'Atena' ? 'secondary' : 'primary'}>{inst.base}</Badge>
              </td>
              <td className="text-center">
                <Badge 
                  bg={inst.status === 'Agendado' ? 'info' : inst.status === 'Concluído' ? 'success' : 'warning'}
                  text={inst.status === 'A agendar' ? 'dark' : 'white'}
                >
                  {inst.status === 'Agendado' && inst.data_instalacao 
                    ? new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR') 
                    : inst.status}
                </Badge>
              </td>
              <td className="text-center">
                <Button variant="outline-primary" size="sm" onClick={() => setSelected(inst)}>
                  <i className="bi bi-eye-fill"></i> Detalhes
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header as="h5"><i className="bi bi-search me-2"></i>Consulta de Solicitações</Card.Header>
        <Card.Body>
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <InputGroup>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control type="text" placeholder="Buscar por nome ou placa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </InputGroup>
        </Card.Body>
      </Card>

      <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
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

      {selected && <DetailsModal installation={selected} onClose={() => setSelected(null)} onViewHistory={(inst) => setHistoryTarget(inst)} onEdit={handleEditClick} />}
      {editingTarget && <EditModal installation={editingTarget} onClose={() => setEditingTarget(null)} onSave={handleSaveEdit} />}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </div>
  );
}
