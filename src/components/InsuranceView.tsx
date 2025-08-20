// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import { Form, Card, ListGroup, Badge, Modal, Button, Alert, Spinner } from 'react-bootstrap';

// Interface para os dados
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  endereco: string;
  data_instalacao?: string;
  horario?: string;
  status: string;
}

// CORREÇÃO: Definimos os tipos para as propriedades do Modal
interface DetailsModalProps {
  installation: Installation;
  onClose: () => void;
}

// Componente para o Modal de Detalhes
function DetailsModal({ installation, onClose }: DetailsModalProps) {
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
        <p><strong>Status:</strong> {installation.status}</p>
        {installation.status === 'Agendado' && (
          <p><strong>Agendado para:</strong> {installation.data_instalacao} às {installation.horario}</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}

export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchInstallations() {
      try {
        const response = await fetch('/.netlify/functions/get-installations');
        if (!response.ok) throw new Error('Falha ao buscar dados.');
        const data: Installation[] = await response.json();
        setAllInstallations(data);
      } catch (err) {
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
  const pending = filteredInstallations.filter(inst => inst.status !== 'Agendado');

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <Card className="mb-4">
        <Card.Header as="h4">Consulta de Instalações</Card.Header>
        <Card.Body>
          <Form.Control 
            type="text"
            placeholder="Buscar por nome ou placa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Card.Body>
      </Card>
      
      <div className="row">
        <div className="col-md-6">
          <Card>
            <Card.Header as="h5">Agendadas</Card.Header>
            <ListGroup variant="flush">
              {scheduled.length > 0 ? (
                scheduled.map((inst: Installation) => (
                  <ListGroup.Item key={inst.id} action onClick={() => setSelected(inst)}>
                    <div className="d-flex justify-content-between align-items-center">
                      {inst.nome_completo} ({inst.placa})
                      <Badge bg="success">{inst.data_instalacao}</Badge>
                    </div>
                  </ListGroup.Item>
                ))
              ) : <ListGroup.Item>Nenhuma instalação agendada encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </div>

        <div className="col-md-6">
          <Card>
            <Card.Header as="h5">Pendentes</Card.Header>
            <ListGroup variant="flush">
              {pending.length > 0 ? (
                pending.map((inst: Installation) => (
                  <ListGroup.Item key={inst.id} action onClick={() => setSelected(inst)}>
                    <div className="d-flex justify-content-between align-items-center">
                      {inst.nome_completo} ({inst.placa})
                      <Badge bg="warning" text="dark">{inst.status}</Badge>
                    </div>
                  </ListGroup.Item>
                ))
              ) : <ListGroup.Item>Nenhuma instalação pendente encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </div>
      </div>

      {selected && (
        <DetailsModal
          installation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}