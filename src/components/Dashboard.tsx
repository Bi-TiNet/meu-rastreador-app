// src/components/Dashboard.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

// --- Interfaces ---
interface History {
  id: number;
  evento: string;
  data_evento: string;
  realizado_por: string;
}

// NOVA INTERFACE
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
  // CAMPO ATUALIZADO
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
function ScheduleModal({ isOpen, onClose, installation, onSchedule, scheduleType }: { isOpen: boolean; onClose: () => void; installation: Installation; onSchedule: (id: number, date: string, time: string, tecnico_id: string) => void; scheduleType: 'installation' | 'maintenance' | 'removal'; }) {
  const [dateTime, setDateTime] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [technicians, setTechnicians] = useState<User[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'tecnico');
      if (!error && data) {
        setTechnicians(data.map((t: any) => ({ id: t.id, user_metadata: { full_name: t.full_name }, ...t } as User)));
      }
    };
    if (isOpen) {
      fetchTechnicians();
      setDateTime(installation.data_instalacao && installation.horario ? `${installation.data_instalacao}T${installation.horario}` : '');
      setSelectedTechnician(installation.tecnico_id || '');
    }
  }, [isOpen, installation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime || !selectedTechnician) return;
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time, selectedTechnician);
  };

  const getTitle = () => {
    switch(scheduleType) {
        case 'maintenance': return 'Agendar Manutenção';
        case 'removal': return 'Agendar Remoção';
        default: return 'Agendar Instalação';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">{getTitle()}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6">
            <p className="text-slate-400 mb-2"><strong>Cliente:</strong> {installation.nome_completo}</p>
            <p className="text-slate-400 mb-4"><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Data e Hora</label>
                    <input type="datetime-local" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Técnico Responsável</label>
                    <select value={selectedTechnician} onChange={e => setSelectedTechnician(e.target.value)} required className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white">
                        <option value="">Selecione um técnico...</option>
                        {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>{tech.user_metadata?.full_name || tech.email}</option>
                        ))}
                    </select>
                </div>
                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">Salvar Agendamento</button>
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

function AccordionItem({ title, children, isOpen, onToggle }: { title: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
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
export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{installation: Installation, type: 'installation' | 'maintenance' | 'removal'} | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

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
  
  const handleUpdate = async (id: number, status: string, options: { date?: string; time?: string; tecnico_id?: string; type?: 'installation' | 'maintenance' | 'removal'; completionType?: 'installation' | 'maintenance' | 'removal' } = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const { date, time, type, completionType, tecnico_id } = options;
      const finalStatus = (type || status === 'Agendado') ? 'Agendado' : status;

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, status: finalStatus, date, time, type, completionType, tecnico_id }),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha na operação.');
      }
      setMessage({type: 'success', text: `Operação realizada com sucesso!`});
      setSelected(null);
      await fetchInstallations();
    } catch (error: any) {
        setMessage({type: 'danger', text: error.message || 'Erro ao processar a solicitação.'});
    }
  };

  const filteredInstallations = useMemo(() =>
    installations.filter(inst =>
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [installations, searchTerm]);

  const pending = filteredInstallations.filter(inst => inst.status === 'A agendar');
  const scheduled = filteredInstallations.filter(inst => inst.status === 'Agendado');
  const completed = filteredInstallations.filter(inst => inst.status === 'Concluído');

  const renderTable = (installationsList: Installation[], listType: 'pending' | 'scheduled' | 'completed') => {
    if (installationsList.length === 0) {
        return <p className="text-slate-500 p-4 text-center italic">Nenhum registro encontrado.</p>;
    }

    const headers = {
      pending: ['Cliente', 'Veículo', 'Serviço', 'Base', 'Ações'],
      scheduled: ['Cliente', 'Veículo', 'Agendamento', 'Técnico', 'Base', 'Ações'],
      completed: ['Cliente', 'Veículo', 'Serviço', 'Base', 'Ações']
    };

    const getServiceBadgeColor = (serviceType: string) => {
        switch (serviceType) {
            case 'Instalação': return 'bg-green-900/50 text-green-300';
            case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
            case 'Remoção': return 'bg-red-900/50 text-red-300';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-300 uppercase bg-slate-800">
                    <tr>
                        {headers[listType].map(h => 
                            <th key={h} scope="col" className={`px-6 py-3 ${h === 'Ações' ? 'text-center' : ''}`}>{h}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {installationsList.map((inst) => {
                        // VERIFICA SE EXISTE OBSERVAÇÃO EM DESTAQUE
                        const hasHighlight = inst.observacoes?.some(o => o.destaque);
                        return (
                            <tr key={inst.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                <td className="px-6 py-4 text-white font-medium">
                                    {/* ADICIONA O ÍCONE DE ALERTA */}
                                    <div className="flex items-center">
                                        <span>{inst.nome_completo}</span>
                                        {hasHighlight && <span className="ml-2 text-yellow-400" title="Possui observação em destaque">⚠️</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{`${inst.modelo} (${inst.placa})`}</td>
                                
                                {listType === 'scheduled' && <td className="px-6 py-4">{inst.data_instalacao && inst.horario ? `${new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR')} às ${inst.horario}`: 'N/A'}</td>}
                                {listType === 'scheduled' && <td className="px-6 py-4">{inst.profiles?.full_name || 'Não definido'}</td>}
                                
                                {(listType === 'pending' || listType === 'completed') && 
                                <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(inst.tipo_servico)}`}>
                                    {inst.tipo_servico}
                                </span>
                                </td>
                                }
                                
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${inst.base === 'Atena' ? 'bg-gray-700 text-gray-300' : 'bg-purple-900/50 text-purple-300'}`}>
                                        {inst.base}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        {listType === 'pending' &&
                                            <button onClick={() => setSelected({ installation: inst, type: inst.tipo_servico.toLowerCase() as any })}
                                                className="font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                            >
                                                Agendar
                                            </button>
                                        }
                                        {listType === 'scheduled' &&
                                            <>
                                                <button onClick={() => handleUpdate(inst.id, 'Concluído', { completionType: inst.tipo_servico.toLowerCase() as any })}
                                                    className="font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                                >
                                                    Concluir
                                                </button>
                                                <button onClick={() => setSelected({ installation: inst, type: inst.tipo_servico.toLowerCase() as any })}
                                                    className="font-medium text-yellow-300 bg-yellow-900/50 hover:bg-yellow-900/80 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                                >
                                                    Reagendar
                                                </button>
                                            </>
                                        }
                                        {listType === 'completed' &&
                                            <>
                                                <button onClick={() => setSelected({ installation: inst, type: 'maintenance' })}
                                                    className="font-medium text-yellow-300 bg-yellow-900/50 hover:bg-yellow-900/80 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                                >
                                                    Manutenção
                                                </button>
                                                <button onClick={() => setSelected({ installation: inst, type: 'removal' })}
                                                    className="font-medium text-red-300 bg-red-900/50 hover:bg-red-900/80 rounded-lg text-xs px-4 py-2 transition-colors duration-300"
                                                >
                                                    Remoção
                                                </button>
                                            </>
                                        }
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
        <h1 className="text-2xl font-bold text-white mb-4"><i className="bi bi-clipboard-data mr-3"></i>Painel de Agendamentos</h1>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="bi bi-search text-slate-400"></i>
            </div>
            <input 
                type="text" 
                className="w-full p-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por cliente, placa ou modelo..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>
      </div>

      {message && <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-800/50 text-green-300 border border-green-700' : 'bg-red-800/50 text-red-300 border border-red-700'}`} role="alert">{message.text}</div>}
      
      <div>
            <AccordionItem 
                isOpen={openAccordions.includes('pending')} 
                onToggle={() => toggleAccordion('pending')}
                title={<><i className="bi bi-clock-history mr-2"></i>Pendentes ({pending.length})</>}
            >
                {renderTable(pending, 'pending')}
            </AccordionItem>
            
            <AccordionItem 
                isOpen={openAccordions.includes('scheduled')} 
                onToggle={() => toggleAccordion('scheduled')}
                title={<><i className="bi bi-calendar-check mr-2"></i>Agendadas ({scheduled.length})</>}
            >
                {renderTable(scheduled, 'scheduled')}
            </AccordionItem>

            <AccordionItem 
                isOpen={openAccordions.includes('completed')} 
                onToggle={() => toggleAccordion('completed')}
                title={<><i className="bi bi-check-circle-fill mr-2"></i>Concluídas ({completed.length})</>}
            >
                {renderTable(completed, 'completed')}
            </AccordionItem>
      </div>
      
      {selected && (
        <ScheduleModal 
            isOpen={!!selected} 
            onClose={() => setSelected(null)} 
            installation={selected.installation}
            onSchedule={(id, date, time, tecnico_id) => handleUpdate(id, 'Agendado', { date, time, tecnico_id, type: selected.type })}
            scheduleType={selected.type}
        />
      )}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </div>
  );
}