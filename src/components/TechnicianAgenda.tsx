// src/components/TechnicianAgenda.tsx
import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient';
import { Alert, Spinner } from 'react-bootstrap';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface InstallationEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: any; 
}

export function TechnicianAgenda() {
  const [events, setEvents] = useState<InstallationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchInstallations = useCallback(async () => {
    if (!userRole || !userId) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Utilizador não autenticado.');

      let query = supabase.from('instalacoes').select('*, profiles:tecnico_id(full_name)').eq('status', 'Agendado');

      if (userRole !== 'admin') {
        query = query.eq('tecnico_id', userId);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      const formattedEvents = data.map((inst: any) => {
        const start = moment(`${inst.data_instalacao} ${inst.horario}`, 'YYYY-MM-DD HH:mm').toDate();
        const end = moment(start).add(1, 'hour').toDate();
        
        let eventTitle = `${inst.nome_completo} - ${inst.placa}`;
        if (userRole === 'admin' && inst.profiles) {
          eventTitle += ` (Téc: ${inst.profiles.full_name})`;
        }

        return {
          id: inst.id,
          title: eventTitle,
          start,
          end,
          resource: inst,
        };
      });
      setEvents(formattedEvents);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [userRole, userId]);

  useEffect(() => {
    const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(session?.user) {
            setUserRole(session.user.app_metadata.role || 'tecnico');
            setUserId(session.user.id);
        } else {
            setLoading(false);
        }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchInstallations();
    }
  }, [fetchInstallations, userId]);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div style={{ height: '75vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
        }}
        eventPropGetter={() => ({
          style: {
            backgroundColor: '#0d6efd',
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
          }
        })}
      />
    </div>
  );
}
