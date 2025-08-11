// Arquivo: src/components/TechnicianAgenda.tsx
import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './TechnicianAgenda.css';

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
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: Installation; // Guarda todos os dados originais da instalação
}

// Configuração para o calendário entender o formato de data em português
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
            const [year, month, day] = inst.data_instalacao.split('-').map(Number);
            const [hour, minute] = inst.horario.split(':').map(Number);
            const startDate = new Date(year, month - 1, day, hour, minute);
            
            return {
              title: `${inst.nome_completo} (${inst.placa})`,
              start: startDate,
              end: new Date(startDate.getTime() + 60 * 60 * 1000), // Duração de 1h
              resource: inst,
            };
          });
        setEvents(scheduled);
      } catch (err) {
        setError('Não foi possível carregar a agenda.');
      } finally {
        setLoading(false);
      }
    }
    fetchScheduledInstallations();
  }, []);

  // Filtra os agendamentos para o dia selecionado no calendário
  const appointmentsForSelectedDay = useMemo(() => 
    events.filter(event => 
      event.start.getFullYear() === selectedDate.getFullYear() &&
      event.start.getMonth() === selectedDate.getMonth() &&
      event.start.getDate() === selectedDate.getDate()
    ), 
  [events, selectedDate]);

  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setSelectedInstallation(null); // Limpa a seleção de detalhes
  };

  const handleSelectEvent = (event) => {
    setSelectedInstallation(event.resource);
  };

  if (loading) return <p className="status-message">A carregar agenda...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="agenda-container-pro">
      <header className="agenda-header-pro">
        <h1>Agenda do Técnico</h1>
      </header>
      
      <div className="calendar-view">
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
        />
      </div>

      <div className="details-view">
        <div className="appointments-list">
          <h3>Agendamentos para {format(selectedDate, 'dd/MM/yyyy')}</h3>
          {appointmentsForSelectedDay.length > 0 ? (
            <ul>
              {appointmentsForSelectedDay.map(event => (
                <li 
                  key={event.resource.id} 
                  onClick={() => setSelectedInstallation(event.resource)}
                  className={selectedInstallation?.id === event.resource.id ? 'selected' : ''}
                >
                  {format(event.start, 'HH:mm')} - {event.resource.nome_completo} ({event.resource.placa})
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum agendamento para esta data.</p>
          )}
        </div>
        
        <div className="installation-details">
          <h3>Detalhes da Instalação</h3>
          {selectedInstallation ? (
            <div className="details-content">
              <p><strong>Cliente:</strong> {selectedInstallation.nome_completo}</p>
              <p><strong>Contato:</strong> {selectedInstallation.contato}</p>
              <p><strong>Veículo:</strong> {selectedInstallation.modelo} ({selectedInstallation.placa})</p>
              <p><strong>Endereço:</strong> {selectedInstallation.endereco}</p>
              <p><strong>Horário:</strong> {selectedInstallation.horario}</p>
            </div>
          ) : (
            <p>Selecione um agendamento para ver os detalhes.</p>
          )}
        </div>
      </div>
    </div>
  );
}