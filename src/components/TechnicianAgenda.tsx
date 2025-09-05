// src/components/TechnicianAgenda.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient';
import { Alert, Spinner, Card, ListGroup, Badge } from 'react-bootstrap';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

interface InstallationEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: any; 
}

function MobileAgendaView({ events }: { events: InstallationEvent[] }) {
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: InstallationEvent[] } = {};
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    sortedEvents.forEach(event => {
      const dateKey = moment(event.start).format('DD/MM/YYYY');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [events]);

  const todayKey = moment().format('DD/MM/YYYY');

  if (events.length === 0) {
    return (
        <Card className="text-center">
            <Card.Body>
                <i className="bi bi-calendar-check display-4 text-muted"></i>
                <h5 className="mt-3">Nenhum serviço agendado</h5>
                <p className="text-muted">Você não tem tarefas na sua agenda.</p>
            </Card.Body>
        </Card>
    )
  }

  return (
    <ListGroup>
      {Object.keys(groupedEvents).map(dateKey => (
        <div key={dateKey} className="mb-3">
          <Badge bg={dateKey === todayKey ? "primary" : "secondary"} className="mb-2 w-100 py-2">
            {moment(dateKey, 'DD/MM/YYYY').format('dddd, DD [de] MMMM')}
          </Badge>
          {groupedEvents[dateKey].map(event => (
            <Card key={event.id} className="mb-2">
              <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Title className="h6 mb-1">{event.resource.nome_completo}</Card.Title>
                    <Card.Subtitle className="mb-1 text-muted small">{event.resource.placa} - {event.resource.modelo}</Card.Subtitle>
                    <Badge pill bg="info" text="dark" className="me-1">{event.resource.tipo_servico}</Badge>
                  </div>
                  <Badge bg="success">{moment(event.start).format('HH:mm')}</Badge>
                </div>
                <hr className="my-2" />
                <div className="small text-muted">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  {event.resource.endereco}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ))}
    </ListGroup>
  );
}

export function TechnicianAgenda() {
  const [events, setEvents] = useState<InstallationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [width] = useWindowSize();
  const isMobile = width < 768; 

  const { defaultView, views } = useMemo(() => ({
    defaultView: isMobile ? Views.AGENDA : Views.WEEK,
    views: isMobile ? [Views.AGENDA, Views.DAY] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA],
  }), [isMobile]);

  const fetchInstallations = useCallback(async (userId: string, userRole: string) => {
    setLoading(true);
    let query = supabase.from('instalacoes').select('*, profiles:tecnico_id(full_name)').eq('status', 'Agendado');
    if (userRole !== 'admin') {
      query = query.eq('tecnico_id', userId);
    }
    const { data, error: queryError } = await query;
    if (queryError) throw queryError;
    const formattedEvents = data.map((inst: any) => ({
      id: inst.id,
      title: `${inst.nome_completo} - ${inst.placa}`,
      start: moment(`${inst.data_instalacao} ${inst.horario}`, 'YYYY-MM-DD HH:mm').toDate(),
      end: moment(`${inst.data_instalacao} ${inst.horario}`, 'YYYY-MM-DD HH:mm').add(1, 'hour').toDate(),
      resource: inst,
    }));
    setEvents(formattedEvents);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getSession();
        if (user) {
            setUser(user);
            fetchInstallations(user.id, user.app_metadata.role);
        } else {
            setLoading(false);
        }
    };
    getUser();
  }, [fetchInstallations]);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    isMobile ? <MobileAgendaView events={events} /> : (
      <Card>
        <Card.Header as="h5">
          <i className="bi bi-calendar-week me-2"></i>
          {user?.app_metadata.role === 'tecnico' ? 'Minha Agenda' : 'Agenda de Técnicos'}
        </Card.Header>
        <Card.Body>
          <div style={{ height: '75vh' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView={defaultView}
              views={views}
              messages={{ next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda", date: "Data", time: "Hora", event: "Evento" }}
              eventPropGetter={() => ({ style: { backgroundColor: '#0d6efd', borderRadius: '5px', color: 'white', border: '0px' }})}
              formats={{ agendaHeaderFormat: ({ start, end }) => `${localizer.format(start, 'DD/MM/YYYY')} - ${localizer.format(end, 'DD/MM/YYYY')}` }}
            />
          </div>
        </Card.Body>
      </Card>
    )
  );
}