// src/components/TechnicianAgenda.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
// CORREÇÃO (TS1484): 'Event' é um tipo, importado com 'import type' e renomeado
import type { Event as CalendarEventInterface } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient.ts'; // Corrigido caminho
// CORREÇÃO (TS1484): 'Session' é um tipo, importado com 'import type'
import type { Session } from '@supabase/supabase-js';
import { Modal, Button, Badge, Container, Row, Col, Alert, Spinner, Form, FloatingLabel } from 'react-bootstrap';

// Configura o moment para português do Brasil
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// --- Interfaces Atualizadas ---
interface Instalacao {
  id: string;
  status: string;
  data_agendamento: string | null;
  tecnico_id: string | null;
  cliente: { nome: string; telefone: string; endereco: string; };
  veiculo: { marca: string; modelo: string; placa: string; cor: string; ano: string; };
  observacoes: { observacao: string; data: string }[];
  base: string;
  // Adicionado para mostrar o nome do técnico
  profiles?: {
    full_name: string;
  };
  // Adicionado para a função de cópia
  ano?: string;
  cor?: string;
  usuario?: string;
  senha?: string;
  bloqueio?: string;
  tipo_servico: string;
  created_at: string; // Adicionado para consistência
}

// CORREÇÃO: Interface usa o tipo renomeado
interface CalendarEvent extends CalendarEventInterface {
  resource: Instalacao; // Armazena a instalação completa
}

interface TechnicianAgendaProps {
  session: Session;
}

// *** NOVO MODAL PARA MOTIVO DA DEVOLUÇÃO (Estilo React-Bootstrap) ***
function ReturnReasonModal({ isOpen, onClose, onSubmit, reason, setReason }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: () => void;
  reason: string;
  setReason: (reason: string) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Motivo da Devolução</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FloatingLabel
            controlId="return_reason"
            label="Descreva por que o serviço não foi executado."
            className="mb-3"
          >
            <Form.Control
              as="textarea"
              placeholder="Motivo..."
              style={{ height: '100px' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </FloatingLabel>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" type="submit">
            Confirmar Devolução
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}


// --- COMPONENTE PRINCIPAL ---
// CORREÇÃO (TS2614): 'export function' para corresponder à importação em App.tsx
export function TechnicianAgenda({ session }: TechnicianAgendaProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalShow, setModalShow] = useState(false);

  // --- Novos estados para o modal de devolução ---
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

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
    setError(null); // Limpa erros antigos
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
      
      const technicianEvents = data
        .filter(inst => (inst.status === 'Agendado' || inst.status === 'Concluído') && inst.data_agendamento)
        .map(inst => {
          const startDate = new Date(inst.data_agendamento!);
          // Adiciona o offset do timezone local para corrigir a exibição
          const timezoneOffset = startDate.getTimezoneOffset() * 60000;
          const correctedStartDate = new Date(startDate.getTime() + timezoneOffset);
          
          const endDate = new Date(correctedStartDate.getTime() + 60 * 60 * 1000); 
          
          return {
            title: `${inst.cliente.nome} (${inst.veiculo.placa})`,
            start: correctedStartDate,
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

  const fetchWithCallback = useCallback(fetchTechnicianAgenda, [session]);

  useEffect(() => {
    fetchWithCallback();

    // Listener do Supabase
    const channel = supabase.channel('instalacoes-tecnico')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'instalacoes', 
        filter: `tecnico_id=eq.${session.user.id}` 
      }, 
      () => { // Payload removido para corrigir erro TS6133 (não utilizado)
        console.log('Mudança de técnico detectada:');
        fetchWithCallback(); // Recarrega
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchWithCallback]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setCopySuccess(null); // Limpa a mensagem de cópia
    setError(null); // Limpa erros
    setModalShow(true);
  };

  const handleCloseModal = () => {
    setModalShow(false);
    setSelectedEvent(null);
  };

  // *** FUNÇÃO DE ATUALIZAÇÃO CORRIGIDA ***
  const handleUpdateStatus = async (
    action: 'complete' | 'return_to_pending', 
    observacao?: string
  ) => {
    if (!selectedEvent) return;

    setLoading(true);
    setError(null);
    
    // Fecha ambos os modais
    handleCloseModal();
    setShowReturnModal(false);

    try {
      let body: any = { id: selectedEvent.resource.id };

      if (action === 'complete') {
        body.status = 'Concluído';
        body.completionType = selectedEvent.resource.tipo_servico.toLowerCase();
      } else if (action === 'return_to_pending') {
        body.action = 'return_to_pending';
        // Adiciona a observação (motivo) se ela existir
        if (observacao) {
          body.nova_observacao_texto = observacao;
          body.nova_observacao_destaque = true;
        }
      }

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body) // Envia o ID e a ação no corpo
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao atualizar status da instalação');
      }

      await fetchTechnicianAgenda(); // Recarrega a agenda

    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setReturnReason(''); // Limpa o motivo
    }
  };

  // Ação: Concluir
  const handleComplete = () => {
    handleUpdateStatus('complete');
  };

  // Ação: Abrir modal de devolução
  const handleReschedule = () => {
    setModalShow(false); // Fecha o modal de detalhes
    setShowReturnModal(true); // Abre o modal de motivo
  };
  
  // Ação: Enviar motivo da devolução
  const handleReturnSubmit = () => {
    handleUpdateStatus('return_to_pending', returnReason);
  };

  // *** FUNÇÃO PARA COPIAR DADOS ***
  const handleCopy = async () => {
    if (!selectedEvent) return;
    const { resource: inst } = selectedEvent;
    
    const baseString = inst.base === 'Atena' 
        ? '*BASE* Atena (X)   Base Autocontrol ( )' 
        : '*BASE* Atena ( )   Base Autocontrol (X)';
    const bloqueioString = inst.bloqueio === 'Sim' 
        ? '*Bloqueio* sim (X)   nao ( )' 
        : '*Bloqueio* sim ( )   nao (X)';

    const textToCopy = [
      `*Veículo:* ${inst.veiculo.modelo}`,
      `*Ano Fabricação:* ${inst.ano || 'N/A'}`,
      `*Placa:* ${inst.veiculo.placa}`,
      `*Cor:* ${inst.veiculo.cor || 'N/A'}`,
      `*Nome:* ${inst.cliente.nome}`,
      `*Telefone:* ${inst.cliente.telefone}`,
      `*Endereço:* ${inst.cliente.endereco}`,
      `*Usuário:* ${inst.usuario || 'N/A'}`,
      `*Senha:* ${inst.senha || 'N/A'}`,
      baseString,
      bloqueioString
    ].join('\n');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = "fixed"; // Evita rolagem
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopySuccess('Dados copiados com sucesso!');
    } catch (err) {
      setCopySuccess('Falha ao copiar.');
    }
  };


  const eventStyleGetter = (event: CalendarEvent) => {
    // Colore o evento se ele estiver concluído
    const style = {
      backgroundColor: event.resource.status === 'Concluído' ? '#198754' : '#3174ad', // Verde para concluído
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    return { style };
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
        onSelectEvent={handleSelectEvent} // <-- Isso abre o modal
        messages={messages}
        eventPropGetter={eventStyleGetter}
        defaultView="week"
      />

      {/* Modal de Detalhes do Evento (ATUALIZADO) */}
      {selectedEvent && (
        <Modal show={modalShow} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {copySuccess && <Alert variant={copySuccess.includes('Falha') ? 'danger' : 'success'}>{copySuccess}</Alert>}

            <h5><i className="bi bi-person-fill"></i> Cliente</h5>
            <p>{selectedEvent.resource.cliente.nome}</p>
            
            <h5><i className="bi bi-geo-alt-fill"></i> Endereço</h5>
            <p>{selectedEvent.resource.cliente.endereco}</p>

            <h5><i className="bi bi-telephone-fill"></i> Telefone</h5>
            <p>{selectedEvent.resource.cliente.telefone}</p>

            <h5><i className="bi bi-car-front-fill"></i> Veículo</h5>
            <p>{selectedEvent.resource.veiculo.marca} {selectedEvent.resource.veiculo.modelo} ({selectedEvent.resource.veiculo.placa})</p>
            <p>Cor: {selectedEvent.resource.veiculo.cor} | Ano: {selectedEvent.resource.ano}</p>
            
            {/* *** NOME DO TÉCNICO (INSTALADOR) ADICIONADO *** */}
            {session.user.app_metadata?.role === 'admin' && (
              <>
                <h5><i className="bi bi-person-badge"></i> Instalador</h5>
                <p>{selectedEvent.resource.profiles?.full_name || 'Não atribuído'}</p>
              </>
            )}
            
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
            {/* *** BOTÃO DE COPIAR ADICIONADO *** */}
            <Button variant="success" onClick={handleCopy} className="text-white">
              <i className="bi bi-whatsapp"></i> Copiar
            </Button>
            <Row className="g-2">
              {/* Botões de Ação */}
              {selectedEvent.resource.status === 'Agendado' && (
                <>
                  <Col xs="auto">
                    <Button variant="danger" onClick={handleReschedule}>
                      <i className="bi bi-arrow-return-left"></i> Devolver
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button variant="primary" onClick={handleComplete}>
                      <i className="bi bi-check-circle"></i> Concluir
                    </Button>
                  </Col>
                </>
              )}
              {selectedEvent.resource.status === 'Concluído' && (
                 <Col xs="auto">
                    <Badge bg="success" className="p-2">Serviço Concluído</Badge>
                 </Col>
              )}
            </Row>
          </Modal.Footer>
        </Modal>
      )}
      
      {/* *** RENDERIZAÇÃO DO MODAL DE MOTIVO *** */}
      <ReturnReasonModal 
        isOpen={showReturnModal}
        onClose={() => { setShowReturnModal(false); setReturnReason(''); }}
        reason={returnReason}
        setReason={setReturnReason}
        onSubmit={handleReturnSubmit}
      />

    </Container>
  );
};

// ... e mantido o export default que eu tinha colocado na última correção
// que o App.tsx (dfa04706...) espera.
// *** CORREÇÃO: Vamos manter o export NOMEADO como o App.tsx (765b98f) espera. ***
// Removendo o export default.