// Arquivo: src/components/TechnicianAgenda.tsx
import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type SlotInfo, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, Row, Col, ListGroup, Alert, Spinner } from 'react-bootstrap';

// Interface para os dados que vêm da API
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

// Interface para os eventos que o calendário entende
interface CalendarEvent extends Event {
  resource: Installation;
}

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

export function TechnicianAgenda() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchScheduledInstallations() {
      try {
        const response = await fetch('/.netlify/functions/get-installations');
        if (!response.ok) throw new Error('Falha ao buscar dados.');
        const allInstallations: Installation[] = await response.json();
        
        const scheduled = allInstallations
          .filter(inst => inst.status === 'Agendado' && inst.data_instalacao && inst.horario)
          .map(inst => {
            const dateStr = inst.data_instalacao as string;
            const timeStr = inst.horario as string;
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hour, minute] = timeStr.split(':').map(Number);
            const startDate = new Date(year, month - 1, day, hour, minute);
            
            return {
              title: `${inst.nome_completo} (${inst.placa})`,
              start: startDate,
              end: new Date(startDate.getTime() + 60 * 60 * 1000), // Duração de 1h
              resource: inst,
            };
          });
        setEvents(scheduled);
      } catch (err: any) {
        setError('Não foi possível carregar a agenda.');
      } finally {
        setLoading(false);
      }
    }
    fetchScheduledInstallations();
  }, []);

  const appointmentsForSelectedDay = useMemo(() => 
    events.filter(event => 
      format(event.start as Date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    ).sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime()),
  [events, selectedDate]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedDate(slotInfo.start);
    setSelectedInstallation(null);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedInstallation(event.resource);
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2 className="text-center mb-4">Agenda do Técnico</h2>
      
      <Row>
        <Col lg={8} className="mb-4 mb-lg-0">
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
                  <ListGroup.Item>
                    <p className="text-muted mb-0 fst-italic">
                      Nenhum agendamento para esta data.
                    </p>
                  </ListGroup.Item>
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
                <div className="text-center text-muted">
                  <i className="bi bi-cursor-fill fs-4"></i>
                  <p className="mt-2">Selecione um agendamento para ver os detalhes.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}