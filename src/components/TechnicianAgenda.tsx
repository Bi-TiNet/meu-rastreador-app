// src/components/TechnicianAgenda.tsx
import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import moment from 'moment';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

// --- INTERFACES ---
interface Observacao {
    id: number;
    texto: string;
    destaque: boolean;
    created_at: string;
    criado_por: string;
}

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
  observacoes: Observacao[];
  profiles?: {
    full_name: string;
  };
}

// --- MODAL DE DETALHES (COM CORREÇÃO DE BOTÕES) ---
function EventDetailsModal({ event, show, onClose, onUpdate }: { event: Installation | null, show: boolean, onClose: () => void, onUpdate: () => Promise<void> }) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [dateTime, setDateTime] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const rootEl = document.documentElement;
    const bodyEl = document.body;

    if (show) {
      rootEl.classList.add('modal-open');
      bodyEl.classList.add('modal-open');
    } else {
      rootEl.classList.remove('modal-open');
      bodyEl.classList.remove('modal-open');
    }
    
    return () => {
      rootEl.classList.remove('modal-open');
      bodyEl.classList.remove('modal-open');
    };
  }, [show]);

  useEffect(() => {
    if (event) {
      const initialDateTime = event.data_instalacao && event.horario ? moment(`${event.data_instalacao}T${event.horario}`).format('YYYY-MM-DDTHH:mm') : '';
      setDateTime(initialDateTime);
      setIsRescheduling(false);
      setError('');
      setCopySuccess('');
    }
  }, [event]);

  if (!show || !event) return null;

  const sortedObservacoes = [...(event.observacoes || [])].sort((a,b) => (b.destaque ? 1 : -1) - (a.destaque ? 1 : -1) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
        case 'Instalação': return 'bg-green-900/50 text-green-300';
        case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
        case 'Remoção': return 'bg-red-900/50 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
  };
  
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
    } catch (err: any) { setError(err.message); } finally { setLoadingAction(false); }
  };

  const handleCopy = () => {
    setCopySuccess('');
    const baseString = event.base === 'Atena' ? '*BASE* Atena (X)   Base Autocontrol ( )' : '*BASE* Atena ( )   Base Autocontrol (X)';
    const bloqueioString = event.bloqueio === 'Sim' ? '*Bloqueio* sim (X)   nao ( )' : '*Bloqueio* sim ( )   nao (X)';

    const textToCopy = [
        `*Veículo* ${event.modelo}`, `*Modelo:* ${event.modelo}`, `*Ano Fabricação:* ${event.ano || 'N/A'}`,
        `*Placa:* ${event.placa}`, `*Cor:* ${event.cor || 'N/A'}`, `*Nome:* ${event.nome_completo}`,
        `*Telefone:* ${event.contato}`, `*Endereço:* ${event.endereco}`, `*Usuário:* ${event.usuario || 'N/A'}`,
        `*Senha:* ${event.senha || 'N/A'}`, baseString, bloqueioString
    ].join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess('Dados copiados!');
        setTimeout(() => setCopySuccess(''), 3000);
    });
  };
  
  const handleRescheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const [date, time] = dateTime.split('T');
    handleAction('reschedule_self', { date, time });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-medium text-white">{event.nome_completo}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
                {error && <div className="p-3 mb-4 text-sm rounded-lg bg-red-800/50 text-red-300 border border-red-700">{error}</div>}
                {copySuccess && <div className="p-3 mb-4 text-sm rounded-lg bg-blue-800/50 text-blue-300 border border-blue-700">{copySuccess}</div>}
                {isRescheduling ? (
                    <form onSubmit={handleRescheduleSubmit}>
                        <h4 className="text-white font-semibold mb-4">Reagendar Serviço</h4>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-300">Nova Data e Hora</label>
                            <input type="datetime-local" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
                        </div>
                        <div className="pt-4 flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsRescheduling(false)} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">Cancelar</button>
                            <button type="submit" disabled={loadingAction} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">{loadingAction ? '...' : 'Salvar'}</button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3 text-slate-300">
                        <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${event.status === 'Agendado' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>{event.status}</span></p>
                        <p><strong>Data:</strong> {moment(event.data_instalacao).format('DD/MM/YYYY')} às {event.horario}</p>
                        <p><strong>Serviço:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(event.tipo_servico)}`}>{event.tipo_servico}</span></p>
                        <p><strong>Contato:</strong> {event.contato}</p>
                        <p><strong>Endereço:</strong> {event.endereco}</p>
                        <p><strong>Veículo:</strong> {`${event.modelo} ${event.cor || ''} ${event.ano || ''}`}</p>
                        <p><strong>Placa:</strong> {event.placa}</p>
                        <p><strong>Base/Bloqueio:</strong> {event.base} / {event.bloqueio}</p>
                        <p><strong>Usuário/Senha:</strong> {event.usuario} / {event.senha || 'N/A'}</p>
                        
                        {sortedObservacoes.length > 0 && (
                            <div className="pt-2">
                                <h4 className="text-blue-400 font-semibold border-t border-slate-700 pt-3 flex items-center"><i className="bi bi-chat-left-text-fill mr-2"></i> Observações</h4>
                                <div className="mt-2 space-y-2">
                                    {sortedObservacoes.map(obs => (
                                        <div key={obs.id} className={`p-3 rounded-lg text-sm ${obs.destaque ? 'bg-yellow-900/50 border-l-4 border-yellow-400' : 'bg-slate-700/50'}`}>
                                            {obs.destaque && <p className="font-bold text-yellow-300 mb-1"><i className="bi bi-star-fill mr-2"></i>Destaque</p>}
                                            <p className="text-slate-300">{obs.texto}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
             {/* ================================================================== */}
             {/* INÍCIO DA CORREÇÃO DO RODAPÉ DOS BOTÕES                        */}
             {/* ================================================================== */}
            {!isRescheduling && (
                <div className="p-3 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center gap-2 flex-shrink-0">
                    <button onClick={handleCopy} className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white" title="Copiar Dados">
                        <i className="bi bi-whatsapp text-lg"></i>
                    </button>
                    
                    {event.status === 'Agendado' && (
                        <div className="flex items-center justify-end flex-nowrap gap-2">
                            <button onClick={() => handleAction('return_to_pending')} disabled={loadingAction} className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors whitespace-nowrap">
                                Pendente
                            </button>
                            <button onClick={() => setIsRescheduling(true)} disabled={loadingAction} className="px-3 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium transition-colors whitespace-nowrap">
                                Reagendar
                            </button>
                            <button onClick={() => handleAction('complete')} disabled={loadingAction} className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors whitespace-nowrap">
                                {loadingAction ? '...' : 'Concluir'}
                            </button>
                        </div>
                    )}
                </div>
            )}
            {/* ================================================================== */}
            {/* FIM DA CORREÇÃO DO RODAPÉ                                       */}
            {/* ================================================================== */}
        </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function CalendarDay({ day, hasEvent, isSelected, isToday, isCurrentMonth, onClick }: { day: moment.Moment, hasEvent: boolean, isSelected: boolean, isToday: boolean, isCurrentMonth: boolean, onClick: (date: moment.Moment) => void }) {
    const dayClass = isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-slate-700' : 'hover:bg-slate-700/50';
    const textClass = isCurrentMonth ? 'text-slate-200' : 'text-slate-600';

    return (
        <div 
            onClick={() => onClick(day)} 
            className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-colors ${dayClass}`}
        >
            <div className="relative w-full h-full flex items-center justify-center">
              <span className={textClass}>{day.format('D')}</span>
              {hasEvent && <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>}
            </div>
        </div>
    );
}

function DateNavigator({ currentDate, onDateChange, view, setView }: { currentDate: moment.Moment, onDateChange: (date: moment.Moment) => void, view: 'day' | 'week' | 'month', setView: (view: 'day' | 'week' | 'month') => void }) {
  const handlePrev = () => onDateChange(moment(currentDate).subtract(1, view));
  const handleNext = () => onDateChange(moment(currentDate).add(1, view));
  const handleToday = () => onDateChange(moment());

  const formatDateTitle = () => {
    if (view === 'day') return currentDate.format('DD [de] MMMM [de] YYYY');
    if (view === 'week') return `Semana de ${currentDate.startOf('week').format('DD/MM')}`;
    return currentDate.format('MMMM [de] YYYY');
  };
  
  const viewButtonClass = (buttonView: string) => 
    `px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${view === buttonView ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 space-y-3">
      <div className="flex justify-between items-center">
        <button onClick={handlePrev} className="p-2 rounded-full hover:bg-slate-700"><i className="bi bi-chevron-left text-xl text-slate-400"></i></button>
        <h3 className="font-semibold text-white text-lg text-center capitalize">{formatDateTitle()}</h3>
        <button onClick={handleNext} className="p-2 rounded-full hover:bg-slate-700"><i className="bi bi-chevron-right text-xl text-slate-400"></i></button>
      </div>
      <div className="flex justify-center items-center gap-2">
        <button onClick={handleToday} className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors border border-slate-600 text-slate-300 hover:bg-slate-700">Hoje</button>
        <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-lg">
           <button onClick={() => setView('day')} className={viewButtonClass('day')}>Dia</button>
           <button onClick={() => setView('week')} className={viewButtonClass('week')}>Semana</button>
           <button onClick={() => setView('month')} className={viewButtonClass('month')}>Mês</button>
        </div>
      </div>
    </div>
  );
}

const WeekView = ({ navDate, selectedDate, onDateSelect, daysWithEvents }: { navDate: moment.Moment, selectedDate: moment.Moment, onDateSelect: (date: moment.Moment) => void, daysWithEvents: Set<string> }) => {
    const weekDays = Array.from({ length: 7 }, (_, i) => moment(navDate).startOf('week').add(i, 'days'));
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 flex justify-around">
            {weekDays.map(day => (
                <div key={day.format('YYYY-MM-DD')} className="text-center space-y-1">
                    <small className="text-slate-400 font-bold uppercase text-xs">{day.format('ddd')}</small>
                    <CalendarDay day={day} hasEvent={daysWithEvents.has(day.format('YYYY-MM-DD'))} isSelected={day.isSame(selectedDate, 'day')} isToday={day.isSame(moment(), 'day')} isCurrentMonth={true} onClick={onDateSelect} />
                </div>
            ))}
        </div>
    );
};

const MonthView = ({ navDate, selectedDate, onDateSelect, daysWithEvents }: { navDate: moment.Moment, selectedDate: moment.Moment, onDateSelect: (date: moment.Moment) => void, daysWithEvents: Set<string> }) => {
    const monthDays = [];
    const start = moment(navDate).startOf('month').startOf('week');
    const end = moment(navDate).endOf('month').endOf('week');
    let day = start.clone();
    while (day.isSameOrBefore(end)) {
        monthDays.push(day.clone());
        day.add(1, 'day');
    }
    const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {weekDayLabels.map(label => <div key={label} className="font-bold text-slate-500 text-xs">{label}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {monthDays.map(d => <CalendarDay key={d.format('YYYY-MM-DD')} day={d} hasEvent={daysWithEvents.has(d.format('YYYY-MM-DD'))} isSelected={d.isSame(selectedDate, 'day')} isToday={d.isSame(moment(), 'day')} isCurrentMonth={d.isSame(navDate, 'month')} onClick={onDateSelect} />)}
            </div>
        </div>
    );
};

const EventList = ({ events, onEventClick, userRole }: { events: Installation[], onEventClick: (event: Installation) => void, userRole: string | null }) => {
  const scheduled = useMemo(() => events.filter(e => e.status === 'Agendado').sort((a,b) => (a.horario || '').localeCompare(b.horario || '')), [events]);
  const completed = useMemo(() => events.filter(e => e.status === 'Concluído').sort((a,b) => (a.horario || '').localeCompare(b.horario || '')), [events]);

  if (events.length === 0) {
    return <div className="text-center text-slate-500 py-10">Nenhuma ordem de serviço para este dia.</div>;
  }
  
  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
        case 'Instalação': return 'bg-green-900/50 text-green-300';
        case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
        case 'Remoção': return 'bg-red-900/50 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
  };

  const renderEventCard = (event: Installation, isCompleted: boolean) => {
    const hasHighlight = event.observacoes?.some(o => o.destaque);
    return (
        <div key={event.id} onClick={() => onEventClick(event)} className={`p-4 rounded-lg shadow-md cursor-pointer transition-colors ${isCompleted ? 'bg-slate-800/60' : 'bg-slate-800 hover:bg-slate-700/50'}`}>
            <div className="flex justify-between items-start">
                <div className="flex-grow space-y-2">
                    <h4 className={`font-bold flex items-center ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {event.nome_completo}
                        {hasHighlight && <span className="ml-2 text-yellow-400" title="Possui observação em destaque">⚠️</span>}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(event.tipo_servico)}`}>{event.tipo_servico}</span>
                    {userRole === 'admin' && event.profiles && (
                        <p className={`text-sm ${isCompleted ? 'text-slate-600 line-through' : 'text-slate-400'}`}><i className="bi bi-person-fill mr-2"></i>{event.profiles.full_name}</p>
                    )}
                    <p className={`text-sm ${isCompleted ? 'text-slate-600 line-through' : 'text-slate-400'}`}><i className="bi bi-geo-alt mr-2"></i>{event.endereco}</p>
                </div>
                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${isCompleted ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 text-white'}`}>{event.horario}</span>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {scheduled.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-2 pl-1">AGENDADAS</h3>
          <div className="space-y-3">{scheduled.map(event => renderEventCard(event, false))}</div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-2 pl-1">FINALIZADAS</h3>
          <div className="space-y-3">{completed.map(event => renderEventCard(event, true))}</div>
        </div>
      )}
    </div>
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
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado.");
      setUser(currentUser);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada.");
      
      const response = await fetch('/.netlify/functions/get-installations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Falha ao buscar dados da agenda.');
      }
      
      const data: Installation[] = await response.json();
      setAllEvents(data.filter(event => ['Agendado', 'Concluído'].includes(event.status)) || []);

    } catch (err: any) {
      setError(err.message || 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstallations(); }, [fetchInstallations]);

  const daysWithEvents = useMemo(() => new Set(allEvents.map(event => moment(event.data_instalacao).format('YYYY-MM-DD'))), [allEvents]);
  const filteredEvents = useMemo(() => allEvents.filter(event => moment(event.data_instalacao).isSame(selectedDate, 'day')), [allEvents, selectedDate]);

  const handleUpdate = async () => {
    if (user) {
        setSelectedEvent(null);
        await fetchInstallations();
    }
  }

  const handleDateNavigation = (newDate: moment.Moment) => {
    setNavDate(newDate);
    setSelectedDate(newDate);
  };

  if (loading) return <div className="text-center p-5"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>;
  if (error) return <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white"><i className="bi bi-calendar-week mr-3"></i>Minha Agenda</h1>
      </div>

      <DateNavigator currentDate={navDate} onDateChange={handleDateNavigation} view={view} setView={setView} />
      {view === 'week' && <WeekView navDate={navDate} selectedDate={selectedDate} onDateSelect={setSelectedDate} daysWithEvents={daysWithEvents} />}
      {view === 'month' && <MonthView navDate={navDate} selectedDate={selectedDate} onDateSelect={setSelectedDate} daysWithEvents={daysWithEvents} />}
      
      <EventList events={filteredEvents} onEventClick={setSelectedEvent} userRole={user?.app_metadata?.role} />
      
      <EventDetailsModal event={selectedEvent} show={!!selectedEvent} onClose={() => setSelectedEvent(null)} onUpdate={handleUpdate} />
    </div>
  );
}