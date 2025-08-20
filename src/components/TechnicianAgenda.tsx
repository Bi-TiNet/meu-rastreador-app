// Arquivo: src/components/TechnicianAgenda.tsx
import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, Row, Col, ListGroup, Alert, Spinner } from 'react-bootstrap';


// ... (interfaces)

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

export function TechnicianAgenda() {
    // ... (useState hooks)
  
  // ... (useEffect, appointmentsForSelectedDay, handleSelectSlot, handleSelectEvent)

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2 className="text-center mb-4">Agenda do Técnico</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            culture="pt-BR"
            views={[Views.MONTH]}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            messages={{
              today: 'Hoje',
              previous: 'Anterior',
              next: 'Próximo',
              month: 'Mês',
            }}
          />
        </Card.Body>
      </Card>

      <Row>
        <Col md={5}>
          <Card>
            <Card.Header as="h5">Agendamentos para {format(selectedDate, 'dd/MM/yyyy')}</Card.Header>
            <ListGroup variant="flush">
              {appointmentsForSelectedDay.length > 0 ? (
                  appointmentsForSelectedDay.map(event => (
                    <ListGroup.Item 
                      key={event.resource.id} 
                      action
                      onClick={() => setSelectedInstallation(event.resource)}
                      active={selectedInstallation?.id === event.resource.id}
                    >
                      {format(event.start, 'HH:mm')} - {event.resource.nome_completo}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>Nenhum agendamento para esta data.</ListGroup.Item>
                )}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={7}>
          <Card>
            <Card.Header as="h5">Detalhes da Instalação</Card.Header>
            <Card.Body>
              {selectedInstallation ? (
                <div>
                  <p><strong>Horário:</strong> {selectedInstallation.horario}</p>
                  <p><strong>Cliente:</strong> {selectedInstallation.nome_completo}</p>
                  <p><strong>Contato:</strong> {selectedInstallation.contato}</p>
                  <p><strong>Veículo:</strong> {selectedInstallation.modelo} ({selectedInstallation.placa})</p>
                  <p><strong>Endereço:</strong> {selectedInstallation.endereco}</p>
                </div>
              ) : (
                <p>Selecione um agendamento para ver os detalhes.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}