// src/components/TechnicianAgenda.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
// import type { User } from '@supabase/supabase-js'; // Removido na correção anterior

// --- Interfaces ---
interface History {
  id: number;
  evento: string;
  data_evento: string;
  realizado_por: string;
}

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
  endereco: string;
  base: string;
  bloqueio: string;
  status: string;
  data_instalacao?: string;
  horario?: string;
  historico: History[];
  tipo_servico: string;
  observacoes: Observacao[]; 
  usuario: string;
  senha?: string;
  ano?: string;
  cor?: string;
  tecnico_id?: string;
  profiles?: {
    id: string;
    full_name: string;
  };
}


// --- Modais ---

// *** NOVO MODAL PARA MOTIVO DA DEVOLUÇÃO ***
function ReturnReasonModal({ isOpen, onClose, onSubmit, reason, setReason }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: () => void;
  reason: string;
  setReason: (reason: string) => void;
}) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Motivo da Devolução</h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6">
            <label htmlFor="return_reason" className="block mb-2 text-sm font-medium text-slate-300">
              Por favor, descreva por que este serviço precisa ser reagendado pela central.
            </label>
            <textarea 
              id="return_reason" 
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white h-24" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <div className="pt-4 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Confirmar Devolução</button>
            </div>
        </div>
      </form>
    </div>
  );
}

function RescheduleModal({ isOpen, onClose, installation, onReschedule }: { isOpen: boolean; onClose: () => void; installation: Installation; onReschedule: (id: number, date: string, time: string) => void; }) {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDateTime(installation.data_instalacao && installation.horario ? `${installation.data_instalacao}T${installation.horario}` : '');
    }
  }, [isOpen, installation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;
    const [date, time] = dateTime.split('T');
    onReschedule(installation.id, date, time);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Reagendar Serviço (Técnico)</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6">
            <p className="text-slate-400 mb-2"><strong>Cliente:</strong> {installation.nome_completo}</p>
            <p className="text-slate-400 mb-4"><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Nova Data e Hora</label>
                    <input type="datetime-local" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
                </div>
                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">Reagendar</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ isOpen, onClose, installation }: { isOpen: boolean, onClose: () => void, installation: Installation }) {
    const sortedHistory = useMemo(() => installation.historico ? [...installation.historico].sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()) : [], [installation.historico]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Histórico de {installation.nome_completo}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Evento</th>
                                <th scope="col" className="px-6 py-3">Realizado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map(h => (
                                    <tr key={h.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                        <td className="px-6 py-4">{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4">{h.evento}</td>
                                        <td className="px-6 py-4">{h.realizado_por || 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-slate-500">Nenhum histórico encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// *** INÍCIO DO CÓDIGO ADICIONADO (COPIADO DE DASHBOARD.TSX) ***
function DetailsModal({ installation, onClose, onViewHistory, setMessage }: { 
  installation: Installation; 
  onClose: () => void; 
  onViewHistory: (installation: Installation) => void; 
  setMessage: (message: { type: 'success' | 'danger'; text: string } | null) => void; 
}) {
  
  const handleCopy = async () => {
    const baseString = installation.base === 'Atena' 
        ? '*BASE* Atena (X)   Base Autocontrol ( )' 
        : '*BASE* Atena ( )   Base Autocontrol (X)';
    const bloqueioString = installation.bloqueio === 'Sim' 
        ? '*Bloqueio* sim (X)   nao ( )' 
        : '*Bloqueio* sim ( )   nao (X)';

    const textToCopy = [
      `*Veículo:* ${installation.modelo}`,
      `*Ano Fabricação:* ${installation.ano || 'N/A'}`,
      `*Placa:* ${installation.placa}`,
      `*Cor:* ${installation.cor || 'N/A'}`,
      `*Nome:* ${installation.nome_completo}`,
      `*Telefone:* ${installation.contato}`,
      `*Endereço:* ${installation.endereco}`,
      `*Usuário:* ${installation.usuario || 'N/A'}`,
      `*Senha:* ${installation.senha || 'N/A'}`,
      baseString,
      bloqueioString
    ].join('\n');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setMessage({ type: 'success', text: 'Dados copiados para a área de transferência!' });
    } catch {
      setMessage({ type: 'danger', text: 'Falha ao copiar os dados.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };
  
  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
        case 'Instalação': return 'bg-green-900/50 text-green-300';
        case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
        case 'Remoção': return 'bg-red-900/50 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
     switch (status) {
        case 'Agendado': return 'bg-blue-900/50 text-blue-300';
        case 'Concluído': return 'bg-green-900/50 text-green-300';
        case 'Reagendar': return 'bg-red-900/50 text-red-300';
        case 'A agendar': 
        default:
            return 'bg-yellow-900/50 text-yellow-300';
    }
  }

  if (!installation) return null;
  const sortedObservacoes = [...(installation.observacoes || [])].sort((a,b) => (b.destaque ? 1 : -1) - (a.destaque ? 1 : -1) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center"><h3 className="text-lg font-medium text-white"><i className="bi bi-file-text-fill mr-2"></i>Detalhes da Solicitação</h3><button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button></div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-blue-400 font-semibold border-b border-slate-700 pb-2">Cliente e Veículo</h4>
                        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
                        <p><strong>Contato:</strong> {installation.contato}</p>
                        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
                        <p><strong>Ano/Cor:</strong> {installation.ano || 'N/A'} / {installation.cor || 'N/A'}</p>
                        <p><strong>Endereço:</strong> {installation.endereco}</p>
                    </div>
                     <div className="space-y-4">
                        <h4 className="text-blue-400 font-semibold border-b border-slate-700 pb-2">Serviço e Acesso</h4>
                        <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(installation.status)}`}>{installation.status}</span></p>
                        {installation.status === 'Agendado' && installation.data_instalacao && (
                            <p><strong>Agendado para:</strong> {new Date(installation.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às {installation.horario}</p>
                        )}
                        <p><strong>Serviço:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(installation.tipo_servico)}`}>{installation.tipo_servico}</span></p>
                        <p><strong>Base:</strong> {installation.base}</p>
                        <p><strong>Usuário/Senha:</strong> {installation.usuario || 'N/A'} / {installation.senha || 'N/A'}</p>
                        <p><strong>Bloqueio:</strong> {installation.bloqueio}</p>
                    </div>
                </div>
                {sortedObservacoes.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-blue-400 font-semibold border-b border-slate-700 pb-2 flex items-center"><i className="bi bi-chat-left-text-fill mr-2"></i> Observações</h4>
                        <div className="mt-2 space-y-3">
                            {sortedObservacoes.map(obs => (
                                <div key={obs.id} className={`p-3 rounded-lg ${obs.destaque ? 'bg-yellow-900/50 border-l-4 border-yellow-400' : 'bg-slate-700/50'}`}>
                                    {obs.destaque && <p className="text-sm font-bold text-yellow-300 mb-1"><i className="bi bi-star-fill mr-2"></i>Destaque para o Técnico</p>}
                                    <p className="text-slate-300">{obs.texto}</p>
                                    <p className="text-xs text-slate-500 text-right mt-2">Adicionado por {obs.criado_por || 'N/A'} em {new Date(obs.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center space-x-2">
                    <button onClick={() => onViewHistory(installation)} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors text-sm">Histórico</button>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleCopy} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-sm"><i className="bi bi-whatsapp mr-2"></i>Copiar p/ WhatsApp</button>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm">Fechar</button>
                </div>
            </div>
        </div>
    </div>
  );
}
// *** FIM DO CÓDIGO ADICIONADO ***

function AccordionItem({ title, children, isOpen, onToggle }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
    return (
        <div className="border border-slate-700 rounded-lg overflow-hidden mb-3">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 bg-slate-800 hover:bg-slate-700/50 transition-colors duration-300"
            >
                <span className="font-medium text-white">{title}</span>
                <i className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}></i>
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[10000px]' : 'max-h-0'} overflow-hidden`}>
                <div className="bg-slate-900">
                    {children}
                </div>
            </div>
        </div>
    )
}

// --- COMPONENTE PRINCIPAL ---
export function TechnicianAgenda() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Installation | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState<string[]>(['scheduled']);
  
  // *** NOVOS ESTADOS PARA MODAL DE MOTIVO ***
  const [returnTarget, setReturnTarget] = useState<Installation | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // *** ESTADO ADICIONADO ***
  const [detailsTarget, setDetailsTarget] = useState<Installation | null>(null);


  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/get-installations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setInstallations(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar as instalações.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchInstallations(); }, [fetchInstallations]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  
  // *** FUNÇÃO handleUpdate MODIFICADA ***
  const handleUpdate = async (id: number, options: { 
    action: 'return_to_pending' | 'reschedule_self' | 'complete_installation' | 'complete_maintenance' | 'complete_removal', 
    date?: string; 
    time?: string; 
    nova_observacao_texto?: string; // <-- Adicionado
    nova_observacao_destaque?: boolean; // <-- Adicionado
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const { action, date, time, nova_observacao_texto, nova_observacao_destaque } = options;
      let completionType: string | undefined = undefined;
      
      if(action === 'complete_installation') completionType = 'installation';
      if(action === 'complete_maintenance') completionType = 'maintenance';
      if(action === 'complete_removal') completionType = 'removal';

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, action, date, time, completionType, nova_observacao_texto, nova_observacao_destaque }), // <-- Adicionado
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha na operação.');
      }
      setMessage({type: 'success', text: `Operação realizada com sucesso!`});
      setRescheduleTarget(null); // Fecha modal de reagendamento (se estiver aberto)
      setReturnTarget(null); // Fecha modal de devolução (se estiver aberto)
      await fetchInstallations();
    } catch (error: any) {
        setMessage({type: 'danger', text: error.message || 'Erro ao processar a solicitação.'});
    }
  };

  // *** NOVA FUNÇÃO PARA SUBMETER O MOTIVO DA DEVOLUÇÃO ***
  const handleReturnSubmit = () => {
    if (!returnTarget || !returnReason.trim()) {
      setMessage({ type: 'danger', text: 'Por favor, informe o motivo da devolução.' });
      return;
    }
    
    handleUpdate(returnTarget.id, { 
      action: 'return_to_pending', 
      nova_observacao_texto: returnReason,
      nova_observacao_destaque: true // Destaca a observação da devolução
    });
    
    setReturnTarget(null);
    setReturnReason('');
  };


  const filteredInstallations = useMemo(() =>
    installations.filter(inst =>
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [installations, searchTerm]);

  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');

  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
        case 'Instalação': return 'bg-green-900/50 text-green-300';
        case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
        case 'Remoção': return 'bg-red-900/50 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
  };

  const renderTable = (installationsList: Installation[]) => {
    if (installationsList.length === 0) {
        return <p className="text-slate-500 p-4 text-center italic">Nenhum registro encontrado.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-800">
                    <tr>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Veículo</th>
                        <th scope="col" className="px-6 py-3">Agendamento</th>
                        <th scope="col" className="px-6 py-3">Serviço</th>
                        <th scope="col" className="px-6 py-3">Base</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {installationsList.map((inst) => {
                        const hasHighlight = inst.observacoes?.some(o => o.destaque);
                        return (
                            <tr key={inst.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                
                                {/* *** LINHAS MODIFICADAS *** */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span
                                          onClick={() => setDetailsTarget(inst)}
                                          className="font-medium text-white hover:text-blue-400 transition-colors cursor-pointer"
                                        >
                                          {inst.nome_completo}
                                        </span>
                                        {hasHighlight && <span className="ml-2 text-yellow-400" title="Possui observação em destaque">⚠️</span>}
                                    </div>
                                </td>
                                {/* *** FIM DA MODIFICAÇÃO *** */}

                                <td className="px-6 py-4">{`${inst.modelo} (${inst.placa})`}</td>
                                <td className="px-6 py-4">{inst.data_instalacao && inst.horario ? `${new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às ${inst.horario}`: 'N/A'}</td>
                                <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(inst.tipo_servico)}`}>
                                    {inst.tipo_servico}
                                </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${inst.base === 'Atena' ? 'bg-gray-700 text-gray-300' : 'bg-purple-900/50 text-purple-300'}`}>
                                        {inst.base}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => handleUpdate(inst.id, { action: `complete_${inst.tipo_servico.toLowerCase()}` as any })}
                                            className="font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                        >
                                            Concluir
                                        </button>
                                        <button onClick={() => setRescheduleTarget(inst)}
                                            className="font-medium text-yellow-300 bg-yellow-900/50 hover:bg-yellow-900/80 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                        >
                                            Reagendar
                                        </button>
                                        
                                        {/* *** BOTÃO "DEVOLVER" ATUALIZADO *** */}
                                        <button onClick={() => setReturnTarget(inst)}
                                            className="font-medium text-red-300 bg-red-900/50 hover:bg-red-900/80 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                        >
                                            Devolver
                                        </button>
                                        
                                        <button onClick={() => setHistoryTarget(inst)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors duration-300">
                                            <i className="bi bi-clock-history"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
  };
  
  if (loading) return <div className="text-center p-5"> <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>;
  if (error) return <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4"><i className="bi bi-calendar-week mr-3"></i>Minha Agenda</h1>
        <div className="relative">
            <i className="bi bi-search text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input 
                type="text" 
                className="w-full p-2.5 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por cliente, placa ou modelo..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>
      </div>

      {message && <div onClick={() => setMessage(null)} className={`cursor-pointer p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-800/50 text-green-300 border border-green-700' : 'bg-red-800/50 text-red-300 border border-red-700'}`} role="alert">{message.text}</div>}
      
      <div>
            <AccordionItem 
                isOpen={openAccordions.includes('scheduled')} 
                onToggle={() => toggleAccordion('scheduled')}
                title={`Agendadas (${scheduled.length})`}
            >
                {renderTable(scheduled)}
            </AccordionItem>
      </div>
      
      {rescheduleTarget && (
        <RescheduleModal 
            isOpen={!!rescheduleTarget} 
            onClose={() => setRescheduleTarget(null)} 
            installation={rescheduleTarget}
            onReschedule={(id, date, time) => {
                handleUpdate(id, { action: 'reschedule_self', date, time });
            }}
        />
      )}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
      
      {/* *** RENDERIZAÇÃO DO NOVO MODAL DE MOTIVO *** */}
      <ReturnReasonModal 
        isOpen={!!returnTarget}
        onClose={() => { setReturnTarget(null); setReturnReason(''); setMessage(null); }}
        reason={returnReason}
        setReason={setReturnReason}
        onSubmit={handleReturnSubmit}
      />

      {/* *** BLOCO ADICIONADO *** */}
      {detailsTarget && (
        <DetailsModal
          installation={detailsTarget}
          onClose={() => setDetailsTarget(null)}
          onViewHistory={(inst) => {
            setDetailsTarget(null);
            setHistoryTarget(inst);
          }}
          setMessage={setMessage}
        />
      )}
      {/* *** FIM DO BLOCO ADICIONADO *** */}
    </div>
  );
}