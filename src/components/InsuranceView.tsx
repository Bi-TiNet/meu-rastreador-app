// src/components/InsuranceView.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
  ano?: string;
  cor?: string;
  endereco: string;
  usuario: string;
  senha?: string;
  base: string;
  bloqueio: string;
  data_instalacao?: string;
  horario?: string;
  status: string;
  historico: History[];
  observacoes: Observacao[];
  tipo_servico: string;
}

// --- MODAIS ---

function HistoryModal({ isOpen, installation, onClose }: { isOpen: boolean; installation: Installation; onClose: () => void; }) {
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
              {sortedHistory.length > 0 ? sortedHistory.map((h) => (
                <tr key={h.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-4">{new Date(h.data_evento).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4">{h.evento}</td>
                  <td className="px-6 py-4">{h.realizado_por || 'N/A'}</td>
                </tr>
              )) : <tr><td colSpan={3} className="text-center py-8 text-slate-500">Nenhum histórico encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditModal({ installation, onClose, onSave }: { installation: Installation; onClose: () => void; onSave: (updatedData: Partial<Installation> & { nova_observacao_texto?: string, nova_observacao_destaque?: boolean }) => void; }) {
  const [formData, setFormData] = useState<Partial<Installation>>(installation);
  const [isLoading, setIsLoading] = useState(false);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [destacarObservacao, setDestacarObservacao] = useState(false);

  useEffect(() => { setFormData(installation); }, [installation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: id === 'placa' ? value.toUpperCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const dataToSend = { ...formData, nova_observacao_texto: novaObservacao, nova_observacao_destaque: destacarObservacao };
      await onSave(dataToSend);
      setNovaObservacao('');
      setDestacarObservacao(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!installation) return null;
  const sortedObservacoes = [...(installation.observacoes || [])].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Editar Solicitação</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <div>
            <h4 className="text-blue-400 font-semibold mb-3">Dados do Cliente e Veículo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="nome_completo" className="block mb-1 text-sm text-slate-400">Nome</label><input id="nome_completo" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.nome_completo || ''} onChange={handleChange} required /></div>
              <div><label htmlFor="contato" className="block mb-1 text-sm text-slate-400">Contato</label><input id="contato" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.contato || ''} onChange={handleChange} required /></div>
              <div><label htmlFor="placa" className="block mb-1 text-sm text-slate-400">Placa</label><input id="placa" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.placa || ''} onChange={handleChange} required /></div>
              <div><label htmlFor="modelo" className="block mb-1 text-sm text-slate-400">Modelo</label><input id="modelo" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.modelo || ''} onChange={handleChange} /></div>
              <div><label htmlFor="ano" className="block mb-1 text-sm text-slate-400">Ano</label><input id="ano" type="number" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.ano || ''} onChange={handleChange} /></div>
              <div><label htmlFor="cor" className="block mb-1 text-sm text-slate-400">Cor</label><input id="cor" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.cor || ''} onChange={handleChange} /></div>
              <div className="md:col-span-2"><label htmlFor="endereco" className="block mb-1 text-sm text-slate-400">Endereço</label><textarea id="endereco" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white h-24" value={formData.endereco || ''} onChange={handleChange} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-blue-400 font-semibold mb-3">Detalhes do Serviço e Acesso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="tipo_servico" className="block mb-1 text-sm text-slate-400">Tipo de Serviço</label><select id="tipo_servico" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.tipo_servico} onChange={handleChange}><option>Instalação</option><option>Manutenção</option><option>Remoção</option></select></div>
              <div><label htmlFor="base" className="block mb-1 text-sm text-slate-400">Base</label><select id="base" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.base} onChange={handleChange}><option>Atena</option><option>Autocontrol</option></select></div>
              <div><label htmlFor="usuario" className="block mb-1 text-sm text-slate-400">Usuário</label><input id="usuario" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.usuario || ''} onChange={handleChange} /></div>
              <div><label htmlFor="senha" className="block mb-1 text-sm text-slate-400">Senha</label><input type="text" id="senha" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.senha || ''} onChange={handleChange} /></div>
              <div className="md:col-span-2"><label htmlFor="bloqueio" className="block mb-1 text-sm text-slate-400">Bloqueio</label><select id="bloqueio" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" value={formData.bloqueio} onChange={handleChange}><option>Sim</option><option>Nao</option></select></div>
            </div>
          </div>
          <div>
            <h4 className="text-blue-400 font-semibold mb-3">Observações</h4>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto bg-slate-900/50 p-3 rounded-lg">
                {sortedObservacoes.length > 0 ? (
                    sortedObservacoes.map(obs => (
                        <div key={obs.id} className={`p-2 rounded ${obs.destaque ? 'bg-yellow-900/50 border border-yellow-700' : 'bg-slate-700/50'}`}>
                            <p className="text-sm text-slate-300">{obs.texto}</p>
                            <p className="text-xs text-slate-500 text-right mt-1">{obs.criado_por} em {new Date(obs.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    ))
                ) : (<p className="text-sm text-slate-500 italic">Nenhuma observação registrada.</p>)}
            </div>
            <div className="space-y-2">
                <label htmlFor="nova_observacao" className="block mb-1 text-sm text-slate-400">Adicionar Nova Observação</label>
                <textarea id="nova_observacao" className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white h-24" value={novaObservacao} onChange={(e) => setNovaObservacao(e.target.value)} />
                <div className="flex items-center"><input id="destacar_observacao" type="checkbox" checked={destacarObservacao} onChange={(e) => setDestacarObservacao(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600" /><label htmlFor="destacar_observacao" className="ml-2 text-sm font-medium text-slate-400">Destacar para o técnico</label></div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end space-x-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">{isLoading ? 'Salvando...' : 'Salvar Alterações'}</button>
        </div>
      </form>
    </div>
  );
}

function DetailsModal({ installation, onClose, onViewHistory, onEdit, setMessage }: { installation: Installation; onClose: () => void; onViewHistory: (installation: Installation) => void; onEdit: (installation: Installation) => void; setMessage: (message: { type: 'success' | 'danger'; text: string } | null) => void; }) {
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
      await navigator.clipboard.writeText(textToCopy);
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

  // *** FUNÇÃO ATUALIZADA PARA LIDAR COM O NOVO STATUS 'REAGENDAR' ***
  const getStatusBadgeColor = (status: string) => {
     switch (status) {
        case 'Agendado': return 'bg-blue-900/50 text-blue-300';
        case 'Concluído': return 'bg-green-900/50 text-green-300';
        case 'Reagendar': return 'bg-red-900/50 text-red-300'; // Vermelho para 'Reagendar'
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
                    <button onClick={() => onEdit(installation)} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors text-sm">Editar</button>
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

function AccordionItem({ title, children, isOpen, onToggle }: { title: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
    return ( <div className="border border-slate-700 rounded-lg overflow-hidden mb-3"><button onClick={onToggle} className="w-full flex justify-between items-center p-4 bg-slate-800 hover:bg-slate-700/50 transition-colors duration-300"><span className="font-medium text-white">{title}</span><i className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}></i></button><div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[10000px]' : 'max-h-0'} overflow-hidden`}><div className="bg-slate-900">{children}</div></div></div>);
}

// --- COMPONENTE PRINCIPAL ---
export function InsuranceView() {
  const [allInstallations, setAllInstallations] = useState<Installation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingTarget, setEditingTarget] = useState<Installation | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]); // Começa fechado por padrão

  const selectedInstallation = useMemo(() => allInstallations.find(inst => inst.id === selectedId), [allInstallations, selectedId]);

  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/get-installations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setAllInstallations(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstallations(); }, [fetchInstallations]);

  const toggleAccordion = (id: string) => setOpenAccordions(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const handleEditClick = (installation: Installation | undefined) => { if (!installation) return; setSelectedId(null); setEditingTarget(installation); };

  const handleSaveEdit = async (updatedData: Partial<Installation> & { nova_observacao_texto?: string, nova_observacao_destaque?: boolean }) => {
    if (!updatedData.id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/update-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha na operação.');
      }
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      setEditingTarget(null);
      await fetchInstallations();
    } catch (error: any) { setMessage({ type: 'danger', text: error.message || "Falha ao atualizar." }); }
  };

  const filteredInstallations = useMemo(() => allInstallations.filter((inst) => inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || inst.placa.toLowerCase().includes(searchTerm.toLowerCase())), [allInstallations, searchTerm]);
  
  // *** LISTAS ATUALIZADAS ***
  const scheduled = filteredInstallations.filter((inst) => inst.status === 'Agendado');
  const completed = filteredInstallations.filter((inst) => inst.status === 'Concluído');
  const pending = filteredInstallations.filter((inst) => inst.status === 'A agendar');
  const reschedule = filteredInstallations.filter((inst) => inst.status === 'Reagendar'); // <-- NOVA LISTA

  if (loading) return <div className="text-center p-5"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>;
  if (error) return <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">{error}</div>;

  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
        case 'Instalação': return 'bg-green-900/50 text-green-300';
        case 'Manutenção': return 'bg-yellow-900/50 text-yellow-300';
        case 'Remoção': return 'bg-red-900/50 text-red-300';
        default: return 'bg-slate-700 text-slate-300';
    }
  };

  // *** FUNÇÃO ATUALIZADA PARA LIDAR COM O NOVO STATUS 'REAGENDAR' ***
   const getStatusBadgeColor = (status: string) => {
     switch (status) {
        case 'Agendado': return 'bg-blue-900/50 text-blue-300';
        case 'Concluído': return 'bg-green-900/50 text-green-300';
        case 'Reagendar': return 'bg-red-900/50 text-red-300'; // Vermelho para 'Reagendar'
        case 'A agendar': 
        default:
            return 'bg-yellow-900/50 text-yellow-300';
    }
  }


  const renderInstallationsList = (installations: Installation[]) => {
    if (installations.length === 0) return <p className="text-slate-500 p-4 text-center italic">Nenhum registro encontrado.</p>;
    return (
      <div className="divide-y divide-slate-700">
        {installations.map(inst => {
            const hasHighlight = inst.observacoes?.some(o => o.destaque);
            return (
              <div key={inst.id} className="p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-800/50">
                <div className="flex-grow">
                  <p className="font-bold text-white flex items-center">{inst.nome_completo} {hasHighlight && <span className="ml-2 text-yellow-400" title="Possui observação em destaque">⚠️</span>}</p>
                  <p className="text-sm text-slate-400">{inst.modelo} ({inst.placa})</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(inst.status)}`}>
                      {inst.status === 'Agendado' && inst.data_instalacao ? new Date(inst.data_instalacao + 'T00:00:00').toLocaleDateString('pt-BR') : inst.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getServiceBadgeColor(inst.tipo_servico)}`}>{inst.tipo_servico}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-900/50 text-purple-300">{inst.base}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(inst.id)} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors text-sm"><i className="bi bi-eye-fill mr-2"></i>Detalhes</button>
              </div>
            )
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4"><i className="bi bi-search mr-3"></i>Consulta de Solicitações</h1>
        {message && <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-800/50 text-green-300 border border-green-700' : 'bg-red-800/50 text-red-300 border border-red-700'}`} role="alert">{message.text}</div>}
        <div className="relative">
            <i className="bi bi-search text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input 
                type="text" 
                className="w-full p-2.5 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por nome ou placa..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>
      </div>
      <div>
          {/* *** ABAS ATUALIZADAS *** */}
          <AccordionItem isOpen={openAccordions.includes('pending')} onToggle={() => toggleAccordion('pending')} title={<><i className="bi bi-clock-history mr-2"></i>Pendentes ({pending.length})</>}>{renderInstallationsList(pending)}</AccordionItem>
          <AccordionItem isOpen={openAccordions.includes('reschedule')} onToggle={() => toggleAccordion('reschedule')} title={<><i className="bi bi-exclamation-triangle-fill mr-2 text-red-500"></i>Necessário Reagendar ({reschedule.length})</>}>{renderInstallationsList(reschedule)}</AccordionItem>
          <AccordionItem isOpen={openAccordions.includes('scheduled')} onToggle={() => toggleAccordion('scheduled')} title={<><i className="bi bi-calendar-check mr-2"></i>Agendadas ({scheduled.length})</>}>{renderInstallationsList(scheduled)}</AccordionItem>
          <AccordionItem isOpen={openAccordions.includes('completed')} onToggle={() => toggleAccordion('completed')} title={<><i className="bi bi-check-circle-fill mr-2"></i>Concluídas ({completed.length})</>}>{renderInstallationsList(completed)}</AccordionItem>
      </div>
      {selectedInstallation && <DetailsModal installation={selectedInstallation} onClose={() => setSelectedId(null)} onViewHistory={(inst) => setHistoryTarget(inst)} onEdit={() => handleEditClick(selectedInstallation)} setMessage={setMessage} />}
      {editingTarget && <EditModal installation={editingTarget} onClose={() => setEditingTarget(null)} onSave={handleSaveEdit} />}
      {historyTarget && <HistoryModal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} installation={historyTarget} />}
    </div>
  );
}