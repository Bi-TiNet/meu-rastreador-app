// Arquivo: src/components/InsuranceView.tsx
import { useEffect, useState, useMemo } from 'react';
import { Form, Card, ListGroup, Badge, Modal, Button, Alert, Spinner } from 'react-bootstrap';

// ... (interface Installation)

// ... (interface DetailsModalProps)

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
    // ... (useState hooks)
  
  // ... (useEffect e filteredInstallations)

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
                scheduled.map(inst => (
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
                pending.map(inst => (
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