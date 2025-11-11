import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient.ts'; // Caminho corrigido
import { Session } from '@supabase/supabase-js';
import { Modal, Button, Badge, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';

// Configura o moment para português do Brasil
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Tipos
interface Instalacao {
  id: string;
  status: string;
  data_agendamento: string | null;
  tecnico_id: string | null;
  cliente: { nome: string; telefone: string; endereco: string; };
  veiculo: { marca: string; modelo: string; placa: string; cor: string; ano: string; };
  observacoes: { observacao: string; data: string }[];
  base: string;
}

interface CalendarEvent extends Event {
  resource: Instalacao; // Armazena a instalação completa
}

interface TechnicianAgendaProps {
  session: Session;
}

const TechnicianAgenda: React.FC<TechnicianAgendaProps> = ({ session }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalShow, setModalShow] = useState(false);

  const { messages } = useMemo(() => ({
    messages: {
      allDay: 'Dia todo',
      previous: '<',
      next: '>',
      today: 'Hoje',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia',
      agenda: 'Agenda',
      date: 'Data',
      time: 'Hora',
      event: 'Evento',
      noEventsInRange: 'Nenhum evento neste período.',
      showMore: (total: number) => `+${total} mais`,
    }
  }), []);

  const fetchTechnicianAgenda = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/get-installations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar agenda');
      }
      const data: Instalacao[] = await response.json();

      // Filtra apenas agendados (o get-installations já faz isso pelo role, mas garantimos)
      const technicianEvents = data
        .filter(inst => inst.status === 'Agendado' && inst.data_agendamento)
        .map(inst => {
          const startDate = new Date(inst.data_agendamento!);
          // Define um tempo de término (ex: 1 hora depois)
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
          
          return {
            title: `${inst.cliente.nome} (${inst.veiculo.placa})`,
            start: startDate,
            end: endDate,
            resource: inst,
          };
        });

      setEvents(technicianEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianAgenda();

    // Listener do Supabase
    const channel = supabase.channel('instalacoes-tecnico')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'instalacoes', 
        filter: `tecnico_id=eq.${session.user.id}` 
      }, 
      (payload) => {
        console.log('Mudança de técnico detectada:', payload);
        fetchTechnicianAgenda(); // Recarrega
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalShow(true);
  };

  const handleCloseModal = () => {
    setModalShow(false);
    setSelectedEvent(null);
  };

  // Função central para atualizar status
  const handleUpdateStatus = async (status: 'Concluído' | 'Reagendar' | 'Agendado') => {
    if (!selectedEvent) return;

    setLoading(true);
    setError(null);
    handleCloseModal();

    try {
      let updateData: any = { status };

      if (status === 'Reagendar') {
        updateData.tecnico_id = null;
        updateData.data_agendamento = null;
      }
      // Se for 'Concluído', apenas muda o status
      // Se for 'Agendado' (reagendamento no mesmo dia), não muda nada além do status (se necessário)

      const response = await fetch(`/.netlify/functions/update-installation?id=${selectedEvent.resource.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status da instalação');
      }

      await fetchTechnicianAgenda(); // Recarrega a agenda

    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Ação: Concluir
  const handleComplete = () => {
    handleUpdateStatus('Concluído');
  };

  // Ação: Devolver para Pendente (agora "Reagendar")
  const handleReschedule = () => {
    // ESTA É A MUDANÇA PRINCIPAL NESTE ARQUIVO
    handleUpdateStatus('Reagendar');
  };

  // Ação: Reagendar para o técnico (ainda não implementado, mas o botão existe)
  // const handleRescheduleSelf = () => {
  //   // Aqui iria a lógica para abrir um seletor de data/hora
  //   alert('Funcionalidade de reagendar para si mesmo ainda não implementada.');
  // };

  const eventStyleGetter = (event: CalendarEvent) => {
    // Pode ser usado para colorir eventos
    let style = {
      backgroundColor: '#3174ad', // Azul padrão
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return {
      style: style
    };
  };

  return (
    <Container fluid className="mt-3" style={{ height: '80vh' }}>
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        messages={messages}
        eventPropGetter={eventStyleGetter}
        defaultView="week"
      />

      {/* Modal de Detalhes do Evento */}
      {selectedEvent && (
        <Modal show={modalShow} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5><i className="bi bi-person-fill"></i> Cliente</h5>
            <p>{selectedEvent.resource.cliente.nome}</p>
            
            <h5><i className="bi bi-geo-alt-fill"></i> Endereço</h5>
            <p>{selectedEvent.resource.cliente.endereco}</p>

            <h5><i className="bi bi-telephone-fill"></i> Telefone</h5>
            <p>{selectedEvent.resource.cliente.telefone}</p>

            <h5><i className="bi bi-car-front-fill"></i> Veículo</h5>
            <p>{selectedEvent.resource.veiculo.marca} {selectedEvent.resource.veiculo.modelo} ({selectedEvent.resource.veiculo.placa})</p>
            <p>Cor: {selectedEvent.resource.veiculo.cor} | Ano: {selectedEvent.resource.veiculo.ano}</p>
            
            <h5><i className="bi bi-building"></i> Base</h5>
            <p>{selectedEvent.resource.base || 'N/A'}</p>

            <h5><i className="bi bi-card-text"></i> Observações</h5>
            {selectedEvent.resource.observacoes && selectedEvent.resource.observacoes.length > 0 ? (
              <ul className="list-unstyled">
                {selectedEvent.resource.observacoes.slice().reverse().map((obs, index) => (
                  <li key={index} className="mb-2">
                    <small className="text-muted">{new Date(obs.data).toLocaleString('pt-BR')}</small>
                    <p className="mb-0">{obs.observacao}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma observação.</p>
            )}
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <Row className="w-100 g-2">
              <Col xs={12} md={4}>
                <Button variant="success" onClick={handleComplete} className="w-100">
                  <i className="bi bi-check-circle"></i> Concluir
                </Button>
              </Col>
              {/* <Col xs={12} md={4}>
                <Button variant="warning" onClick={handleRescheduleSelf} className="w-100 text-dark">
                  <i className="bi bi-calendar-plus"></i> Reagendar
                </Button>
              </Col> */}
              <Col xs={12} md={{span: 4, offset: 4}}>
                <Button variant="danger" onClick={handleReschedule} className="w-100">
                  <i className="bi bi-arrow-return-left"></i> Devolver
                </Button>
              </Col>
            </Row>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default TechnicianAgenda;