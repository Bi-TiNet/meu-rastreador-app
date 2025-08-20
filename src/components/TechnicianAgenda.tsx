// Arquivo: src/components/TechnicianAgenda.tsx
import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type SlotInfo, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, Row, Col, ListGroup, Alert, Spinner } from 'react-bootstrap';

// ... (interfaces e configuração do localizer)

export function TechnicianAgenda() {
  // ... (código dos hooks useState e das funções fetch, handlers)

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2 className="text-center mb-4">Agenda do Técnico</h2>
      
      <Row>
        <Col lg={8} className="mb-4 mb-lg-0">
          <div className="rbc-calendar">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              culture="pt-BR"
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              messages={{
                today: 'Hoje',
                previous: 'Anterior',
                next: 'Próximo',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
              }}
            />
          </div>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header as="h5">
              <i className="bi bi-list-task me-2"></i>
              Agendamentos para {format(selectedDate, 'dd/MM/yyyy')}
            </Card.Header>
            <ListGroup variant="flush" style={{maxHeight: '250px', overflowY: 'auto'}}>
              {appointmentsForSelectedDay.length > 0 ? (
                  appointmentsForSelectedDay.map((event: CalendarEvent) => (
                    <ListGroup.Item 
                      key={event.resource.id} 
                      action
                      onClick={() => setSelectedInstallation(event.resource)}
                      active={selectedInstallation?.id === event.resource.id}
                    >
                      <strong>{format(event.start as Date, 'HH:mm')}</strong> - {event.resource.nome_completo}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>Nenhum agendamento para esta data.</ListGroup.Item>
                )}
            </ListGroup>
          </Card>

          <Card>
            <Card.Header as="h5">
              <i className="bi bi-info-circle me-2"></i>
              Detalhes da Instalação
            </Card.Header>
            <Card.Body>
              {selectedInstallation ? (
                <div>
                  <p><strong>Horário:</strong> {selectedInstallation.horario}</p>
                  <p><strong>Cliente:</strong> {selectedInstallation.nome_completo}</p>
                  <p><strong>Contato:</strong> {selectedInstallation.contato}</p>
                  <p><strong>Veículo:</strong> {selectedInstallation.modelo} ({selectedInstallation.placa})</p>
                  <p className="mb-0"><strong>Endereço:</strong> {selectedInstallation.endereco}</p>
                </div>
              ) : (
                <p className="text-muted">Selecione um agendamento para ver os detalhes.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}