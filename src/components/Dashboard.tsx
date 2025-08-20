// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import {
  Button, Table, Modal, FormControl, 
  FormLabel, InputGroup, Spinner, Alert, Card, Form
} from 'react-bootstrap';

// ... (interfaces Installation e ScheduleModalProps)

function ScheduleModal({ isOpen, onClose, installation, onSchedule }: ScheduleModalProps) {
  // ... (código do modal sem alterações)
}

export function Dashboard() {
  // ... (código dos hooks useState e das funções fetch, schedule, copy)

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card>
      <Card.Header as="h5">
        <i className="bi bi-clipboard-data me-2"></i>
        Painel de Agendamentos
      </Card.Header>
      <Card.Body>
        {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
        <Table striped bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Agendamento</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {installations.map((inst: Installation) => (
              <tr key={inst.id}>
                <td>{inst.nome_completo}</td>
                <td>{`${inst.modelo} (${inst.placa})`}</td>
                <td>
                  {inst.status === 'Agendado' ? `${inst.data_instalacao} às ${inst.horario}` : <Badge bg="warning" text="dark">{inst.status}</Badge>}
                </td>
                <td className="text-center">
                  <Button size="sm" variant="outline-secondary" onClick={() => handleCopy(inst)} className="me-2">
                    <i className="bi bi-clipboard me-1"></i> Copiar
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setSelected(inst)}>
                    <i className="bi bi-calendar-plus me-1"></i> Agendar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
      {selected && (
        <ScheduleModal isOpen={!!selected} onClose={() => setSelected(null)} installation={selected} onSchedule={handleSchedule} />
      )}
    </Card>
  );
}