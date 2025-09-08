// src/components/TechnicianAgenda.tsx
import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import moment from 'moment';
import 'moment/locale/pt-br';
import { supabase } from '../supabaseClient';
import { Alert, Spinner, Card, Badge, Button, Modal, Form, FloatingLabel, ListGroup } from 'react-bootstrap';
import type { User } from '@supabase/supabase-js';

moment.locale('pt-br');

// --- INTERFACES ---
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  ano?: string;
  cor?: string;
  endereco: string;
  usuario: string;
  senha?: string;
  base: string;
  bloqueio: string;
  status: 'Agendado' | 'Concluído';
  data_instalacao?: string;
  horario?: string;
  tipo_servico: string;
  observacao?: string;
  // ADICIONADO PARA EXIBIR NOME DO TÉCNICO
  profiles?: {
    full_name: string;
  };
}

// --- COMPONENTES AUXILIARES ---

function CalendarDay({ day, hasEvent, isSelected, isToday, isCurrentMonth, onClick }: { day: moment.Moment, hasEvent: boolean, isSelected: boolean, isToday: boolean, isCurrentMonth: boolean, onClick: (date: moment.Moment) => void }) {
    const dayClass = isSelected ? 'bg-primary text-white' : isToday ? 'bg-light' : '';
    const textClass = isCurrentMonth ? 'text-dark' : 'text-muted';

    return (
        <div 
            onClick={() => onClick(day)} 
            style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
            className={`p-2 rounded-circle ${dayClass}`}
        >
            <span className={textClass}>{day.format('D')}</span>
            {hasEvent && <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '5px', backgroundColor: isSelected ? 'white' : 'blue', borderRadius: '50%' }}></div>}
        </div>
    );
}


function DateNavigator({ currentDate, setCurrentDate, view, setView }: { currentDate: moment.Moment, setCurrentDate: (date: moment.Moment) => void, view: 'day' | 'week' | 'month', setView: (view: 'day' | 'week' | 'month') => void }) {
  const handlePrev = () => setCurrentDate(moment(currentDate).subtract(1, view));
  const handleNext = () => setCurrentDate(moment(currentDate).add(1, view));
  const handleToday = () => setCurrentDate(moment());

  const formatDateTitle = () => {
    if (view === 'day') return currentDate.format('DD [de] MMMM YYYY');
    if (view === 'week') return `${currentDate.startOf('week').format('DD/MM')} a ${currentDate.endOf('week').format('DD/MM/YYYY')}`;
    return currentDate.format('MMMM [de] YYYY');
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body className="p-2">
        <div className="d-flex justify-content-between align-items-center">
          <Button variant="link" onClick={handlePrev} className="text-decoration-none text-secondary"><i className="bi bi-chevron-left h5"></i></Button>
          <span className="fw-bold text-capitalize">{formatDateTitle()}</span>
          <Button variant="link" onClick={handleNext} className="text-decoration-none text-secondary"><i className="bi bi-chevron-right h5"></i></Button>
        </div>
        <div className="d-grid gap-2 d-flex justify-content-center mt-2">
          <Button variant="outline-secondary" size="sm" onClick={handleToday}>Hoje</Button>
          <Button variant={view === 'day' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setView('day')}>Dia</Button>
          <Button variant={view === 'week' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setView('week')}>Semana</Button>
          <Button variant={view === 'month' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setView('month')}>Mês</Button>
        </div>
      </Card.Body>
    </Card>
  );
}

function WeekView({ navDate, selectedDate, onDateSelect, daysWithEvents }: { navDate: moment.Moment, selectedDate: moment.Moment, onDateSelect: (date: moment.Moment) => void, daysWithEvents: Set<string> }) {
    const weekDays = [];
    const startOfWeek = moment(navDate).startOf('week');

    for (let i = 0; i < 7; i++) {
        weekDays.push(moment(startOfWeek).add(i, 'days'));
    }

    return (
        <Card className="mb-3">
            <Card.Body className="d-flex justify-content-around p-2">
                {weekDays.map(day => (
                    <div key={day.format('YYYY-MM-DD')} className="text-center">
                        <small className="text-muted">{day.format('ddd')}</small>
                        <CalendarDay 
                            day={day} 
                            hasEvent={daysWithEvents.has(day.format('YYYY-MM-DD'))}
                            isSelected={day.isSame(selectedDate, 'day')}
                            isToday={day.isSame(moment(), 'day')}
                            isCurrentMonth={true}
                            onClick={onDateSelect}
                        />
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
}

function MonthView({ navDate, selectedDate, onDateSelect, daysWithEvents }: { navDate: moment.Moment, selectedDate: moment.Moment, onDateSelect: (date: moment.Moment) => void, daysWithEvents: Set<string> }) {
    const monthDays = [];
    const startOfMonth = moment(navDate).startOf('month').startOf('week');
    const endOfMonth = moment(navDate).endOf('month').endOf('week');
    
    let day = startOfMonth;
    while(day <= endOfMonth) {
        monthDays.push(day);
        day = day.clone().add(1, 'day');
    }
    
    const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <Card className="mb-3">
            <Card.Body className="p-2">
                <div className="d-flex justify-content-around">
                    {weekDayLabels.map(label => <div key={label} className="fw-bold text-muted" style={{width: '14.28%', textAlign: 'center'}}><small>{label}</small></div>)}
                </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {monthDays.map(d => (
                         <CalendarDay 
                            key={d.format('YYYY-MM-DD')}
                            day={d} 
                            hasEvent={daysWithEvents.has(d.format('YYYY-MM-DD'))}
                            isSelected={d.isSame(selectedDate, 'day')}
                            isToday={d.isSame(moment(), 'day')}
                            isCurrentMonth={d.isSame(navDate, 'month')}
                            onClick={onDateSelect}
                        />
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
}


function EventList({ events, onEventClick, userRole }: { events: Installation[], onEventClick: (event: Installation) => void, userRole: string | null }) {
  const scheduled = useMemo(() => events.filter(e => e.status === 'Agendado').sort((a,b) => (a.horario || '').localeCompare(b.horario || '')), [events]);
  const completed = useMemo(() => events.filter(e => e.status === 'Concluído').sort((a,b) => (a.horario || '').localeCompare(b.horario || '')), [events]);

  if (events.length === 0) {
    return <Card body className="text-center text-muted mt-4 border-0 bg-transparent">Nenhuma ordem de serviço para este dia.</Card>;
  }

  return (
    <>
      {scheduled.length > 0 && (
        <div className="mb-4">
          <h6 className="text-uppercase small text-muted fw-bold ps-1">AGENDADAS</h6>
          {scheduled.map(event => (
            <Card key={event.id} className="mb-2 shadow-sm" onClick={() => onEventClick(event)} style={{ cursor: 'pointer' }}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <Card.Title className="h6 mb-1">{event.nome_completo}</Card.Title>
                    <Card.Text className="text-muted small mb-1">{event.tipo_servico}</Card.Text>
                    {userRole === 'admin' && event.profiles && (
                        <Card.Text className="text-muted small mb-1"><i className="bi bi-person-fill me-2"></i>{event.profiles.full_name}</Card.Text>
                    )}
                    <Card.Text className="text-muted small mb-1"><i className="bi bi-telephone me-2"></i>{event.contato}</Card.Text>
                    <Card.Text className="text-muted small"><i className="bi bi-geo-alt me-2"></i>{event.endereco}</Card.Text>
                  </div>
                  <Badge bg="primary" pill className="align-self-start fs-6">{event.horario}</Badge>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h6 className="text-uppercase small text-muted fw-bold ps-1">FINALIZADAS</h6>
           {completed.map(event => (
            <Card key={event.id} className="mb-2 shadow-sm bg-light" onClick={() => onEventClick(event)} style={{ cursor: 'pointer' }}>
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <Card.Title className="h6 mb-1 text-muted">{event.nome_completo}</Card.Title>
                     <Card.Text className="text-muted small mb-1 text-decoration-line-through">{event.tipo_servico}</Card.Text>
                    {userRole === 'admin' && event.profiles && (
                        <Card.Text className="text-muted small mb-1 text-decoration-line-through"><i className="bi bi-person-fill me-2"></i>{event.profiles.full_name}</Card.Text>
                    )}
                    <Card.Text className="text-muted small mb-1 text-decoration-line-through"><i className="bi bi-telephone me-2"></i>{event.contato}</Card.Text>
                    <Card.Text className="text-muted small text-decoration-line-through"><i className="bi bi-geo-alt me-2"></i>{event.endereco}</Card.Text>
                  </div>
                   <Badge bg="secondary" pill className="align-self-start fs-6">{event.horario}</Badge>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function EventDetailsModal({ event, show, onClose, onUpdate }: { event: Installation | null, show: boolean, onClose: () => void, onUpdate: () => Promise<void> }) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [dateTime, setDateTime] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [copySuccessMessage, setCopySuccessMessage] = useState('');

  useEffect(() => {
    if (event) {
      const initialDateTime = event.data_instalacao && event.horario
        ? moment(`${event.data_instalacao}T${event.horario}`).format('YYYY-MM-DDTHH:mm')
        : '';
      setDateTime(initialDateTime);
      setIsRescheduling(false); 
      setError('');
      setCopySuccessMessage('');
    }
  }, [event]);

  if (!event) return null;
  
  const handleAction = async (action: 'complete' | 'return_to_pending' | 'reschedule_self', payload?: any) => {
    setLoadingAction(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão inválida.");
      
      let body: any = { id: event.id };
      if(action === 'complete') body = {...body, status: 'Concluído', completionType: event.tipo_servico.toLowerCase() };
      if(action === 'return_to_pending') body = {...body, action: 'return_to_pending'};
      if(action === 'reschedule_self') body = {...body, action: 'reschedule_self', ...payload};

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao executar ação.');
      }
      await onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCopy = () => {
    setCopySuccessMessage('');
    const text = `Cliente: ${event.nome_completo}\nContato: ${event.contato}\nVeículo: ${event.modelo} ${event.cor} ${event.ano} (${event.placa})\nEndereço: ${event.endereco}\nTipo de Serviço: ${event.tipo_servico}\nBase: ${event.base}\nBloqueio: ${event.bloqueio}\nUsuário: ${event.usuario}\nSenha: ${event.senha || 'N/A'}\nObservação: ${event.observacao || 'Nenhuma'}`;
    navigator.clipboard.writeText(text).then(() => {
        setCopySuccessMessage('Dados copiados com sucesso!');
        setTimeout(() => setCopySuccessMessage(''), 3000);
    }, () => {
        setError('Falha ao copiar dados.');
        setTimeout(() => setError(''), 3000);
    });
  };
  
  const handleRescheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const [date, time] = dateTime.split('T');
    handleAction('reschedule_self', { date, time });
  }

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{event.nome_completo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {copySuccessMessage && <Alert variant="info">{copySuccessMessage}</Alert>}
        {isRescheduling ? (
          <Form onSubmit={handleRescheduleSubmit}>
            <h5>Reagendar Serviço</h5>
            <FloatingLabel label="Nova Data e Hora" className="mb-3">
              <Form.Control type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required />
            </FloatingLabel>
            <div className="d-flex justify-content-end">
                <Button variant="secondary" onClick={() => setIsRescheduling(false)} className="me-2">Cancelar</Button>
                <Button variant="primary" type="submit" disabled={loadingAction}>
                  {loadingAction ? <Spinner as="span" size="sm" /> : 'Salvar'}
                </Button>
            </div>
          </Form>
        ) : (
          <ListGroup variant="flush">
            <ListGroup.Item><strong>Status: </strong><Badge bg={event.status === 'Agendado' ? 'primary' : 'success'}>{event.status}</Badge></ListGroup.Item>
            <ListGroup.Item><strong>Data: </strong>{moment(event.data_instalacao).format('DD/MM/YYYY')} às {event.horario}</ListGroup.Item>
            <ListGroup.Item><strong>Contato: </strong>{event.contato}</ListGroup.Item>
            <ListGroup.Item><strong>Endereço: </strong>{event.endereco}</ListGroup.Item>
            <ListGroup.Item><strong>Veículo: </strong>{`${event.modelo} ${event.cor || ''} ${event.ano || ''}`}</ListGroup.Item>
            <ListGroup.Item><strong>Placa: </strong>{event.placa}</ListGroup.Item>
            <ListGroup.Item><strong>Tipo de Serviço: </strong>{event.tipo_servico}</ListGroup.Item>
            <ListGroup.Item><strong>Base: </strong>{event.base}</ListGroup.Item>
            <ListGroup.Item><strong>Bloqueio: </strong>{event.bloqueio}</ListGroup.Item>
            <ListGroup.Item><strong>Usuário: </strong>{event.usuario}</ListGroup.Item>
            <ListGroup.Item><strong>Senha: </strong>{event.senha || 'Não definida'}</ListGroup.Item>
            {event.observacao && <ListGroup.Item><strong>Observação: </strong>{event.observacao}</ListGroup.Item>}
          </ListGroup>
        )}
      </Modal.Body>
      {!isRescheduling && (
        <Modal.Footer className="justify-content-between">
            <div>
              <Button variant="outline-secondary" size="sm" onClick={handleCopy} disabled={loadingAction}><i className="bi bi-clipboard"></i> Copiar Tudo</Button>
            </div>
            <div>
              {event.status === 'Agendado' && (
                <>
                  <Button variant="danger" size="sm" className="me-2" onClick={() => handleAction('return_to_pending')} disabled={loadingAction}>Pendente</Button>
                  <Button variant="warning" size="sm" className="me-2" onClick={() => setIsRescheduling(true)} disabled={loadingAction}>Reagendar</Button>
                  <Button variant="success" size="sm" onClick={() => handleAction('complete')} disabled={loadingAction}>
                    {loadingAction ? <Spinner as="span" size="sm" /> : 'Concluir'}
                  </Button>
                </>
              )}
            </div>
        </Modal.Footer>
      )}
    </Modal>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function TechnicianAgenda() {
  const [allEvents, setAllEvents] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [navDate, setNavDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedEvent, setSelectedEvent] = useState<Installation | null>(null);

  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("Usuário não autenticado.");
      }
      setUser(currentUser);
      const userRole = currentUser.app_metadata?.role;

      let query = supabase
        .from('instalacoes')
        .select('*, profiles:tecnico_id (full_name)')
        .in('status', ['Agendado', 'Concluído']);

      if (userRole === 'tecnico') {
        query = query.eq('tecnico_id', currentUser.id);
      }
      // Se for admin, não adiciona filtro de técnico, buscando todas as OS.
      
      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setAllEvents(data as Installation[] || []);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleSetView = (newView: 'day' | 'week' | 'month') => {
    setNavDate(moment(selectedDate));
    setView(newView);
  }
  
  const handleSetNavDate = (date: moment.Moment) => {
      setNavDate(date);
      if(view === 'day'){
          setSelectedDate(date);
      }
  }
  
  const handleDateSelect = (date: moment.Moment) => {
      setSelectedDate(date);
      if(view !== 'day'){
        // opcional: mudar para a visualização de dia ao selecionar uma data
        // setView('day');
      }
  }

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  const daysWithEvents = useMemo(() => {
    return new Set(allEvents.map(event => moment(event.data_instalacao).format('YYYY-MM-DD')));
  }, [allEvents]);
  
  const filteredEvents = useMemo(() => {
      return allEvents.filter(event => moment(event.data_instalacao).isSame(selectedDate, 'day'));
  }, [allEvents, selectedDate]);

  const handleUpdate = async () => {
    if(user) {
        setSelectedEvent(null);
        await fetchInstallations();
    }
  }

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h4 className="fw-bold mb-3">Minha Agenda</h4>
      <DateNavigator currentDate={navDate} setCurrentDate={handleSetNavDate} view={view} setView={handleSetView} />

      {view === 'week' && <WeekView navDate={navDate} selectedDate={selectedDate} onDateSelect={handleDateSelect} daysWithEvents={daysWithEvents} />}
      {view === 'month' && <MonthView navDate={navDate} selectedDate={selectedDate} onDateSelect={handleDateSelect} daysWithEvents={daysWithEvents} />}
      
      <EventList events={filteredEvents} onEventClick={setSelectedEvent} userRole={user?.app_metadata?.role} />
      
      <EventDetailsModal event={selectedEvent} show={!!selectedEvent} onClose={() => setSelectedEvent(null)} onUpdate={handleUpdate} />
    </div>
  );
}