// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import { Form, Card, ListGroup, Badge, Modal, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';

// ... (interfaces Installation e DetailsModalProps)

function DetailsModal({ installation, onClose }: DetailsModalProps) {
  // ... (código do modal sem alterações)
}

export function InsuranceView() {
  // ... (código dos hooks useState e da função fetch)

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
        <Card.Header as="h5">
          <i className="bi bi-search me-2"></i>
          Consulta de Instalações
        </Card.Header>
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
        <Col md={6}>
          <Card>
            <Card.Header as="h5"><i className="bi bi-calendar-check me-2"></i>Agendadas</Card.Header>
            <ListGroup variant="flush">
              {scheduled.length > 0 ? (
                scheduled.map((inst: Installation) => (
                  <ListGroup.Item key={inst.id} action onClick={() => setSelected(inst)} className="d-flex justify-content-between align-items-center">
                    {inst.nome_completo} ({inst.placa})
                    <Badge bg="success" pill>{inst.data_instalacao}</Badge>
                  </ListGroup.Item>
                ))
              ) : <ListGroup.Item>Nenhuma instalação agendada encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header as="h5"><i className="bi bi-clock-history me-2"></i>Pendentes</Card.Header>
            <ListGroup variant="flush">
              {pending.length > 0 ? (
                pending.map((inst: Installation) => (
                  <ListGroup.Item key={inst.id} action onClick={() => setSelected(inst)} className="d-flex justify-content-between align-items-center">
                    {inst.nome_completo} ({inst.placa})
                    <Badge bg="warning" text="dark" pill>{inst.status}</Badge>
                  </ListGroup.Item>
                ))
              ) : <ListGroup.Item>Nenhuma instalação pendente encontrada.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {selected && (
        <DetailsModal
          installation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}