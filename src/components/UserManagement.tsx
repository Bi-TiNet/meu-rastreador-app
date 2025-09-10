// src/components/UserManagement.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Profile extends User {
    full_name: string;
    role: 'admin' | 'tecnico' | 'seguradora';
}

export function UserManagement() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seguradora');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('new-user');

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (data) setUsers(data as Profile[]);
    if (error) setMessage({ type: 'danger', text: 'Não foi possível carregar os usuários.' });
    setLoadingUsers(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const { admins, technicians, insurances } = useMemo(() => ({
    admins: users.filter(u => u.role === 'admin'),
    technicians: users.filter(u => u.role === 'tecnico'),
    insurances: users.filter(u => u.role === 'seguradora')
  }), [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        const response = await fetch('/.netlify/functions/create-user', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, fullName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Falha ao criar usuário.');

        setMessage({ type: 'success', text: result.message });
        setFullName('');
        setEmail('');
        setPassword('');
        fetchUsers();
    } catch (err: any) {
        setMessage({ type: 'danger', text: err.message });
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (userEmail: string | null) => {
    if (!userEmail || !window.confirm(`Tem certeza que deseja enviar um link de recuperação de senha para ${userEmail}?`)) return;
    setMessage(null);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        const response = await fetch('/.netlify/functions/reset-password', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        setMessage({ type: 'success', text: `Email de recuperação enviado para ${userEmail}.` });
    } catch (err: any) {
        setMessage({ type: 'danger', text: err.message });
    }
  };

  const renderUserList = (userList: Profile[]) => {
    if (loadingUsers) return <div className="text-center p-5"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>;
    if (userList.length === 0) return <p className="text-slate-500 p-4 text-center italic">Nenhum usuário encontrado.</p>;

    return (
        <div className="divide-y divide-slate-700">
            {userList.map(user => (
                <div key={user.id} className="p-3 flex justify-between items-center">
                    <div>
                        <p className="font-medium text-white">{user.full_name || 'Nome não definido'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <button onClick={() => handleResetPassword(user.email || null)} className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors text-xs">
                        <i className="bi bi-key-fill mr-1"></i> Redefinir Senha
                    </button>
                </div>
            ))}
        </div>
    );
  };
  
  const TabButton = ({ eventKey, title }: { eventKey: string, title: React.ReactNode }) => (
     <button 
        onClick={() => setActiveTab(eventKey)}
        className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg -mb-px border-b-2
            ${activeTab === eventKey 
                ? 'text-blue-400 border-blue-400 bg-slate-800' 
                : 'text-slate-400 hover:text-white border-transparent hover:border-slate-500'}`
        }
    >
        {title}
    </button>
  );

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white"><i className="bi bi-people-fill mr-3"></i>Gerenciamento de Usuários</h1>
        </div>
        
        <div className="px-6">
          {message && <div onClick={() => setMessage(null)} className={`cursor-pointer p-4 my-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-800/50 text-green-300 border border-green-700' : 'bg-red-800/50 text-red-300 border border-red-700'}`} role="alert">{message.text}</div>}
        </div>
        
        <div className="border-b border-slate-700 px-4">
             <TabButton eventKey="new-user" title="Cadastrar Novo" />
             <TabButton eventKey="admins" title={<>Admins <span className="text-xs bg-slate-600 text-white rounded-full px-2 py-0.5">{admins.length}</span></>} />
             <TabButton eventKey="technicians" title={<>Técnicos <span className="text-xs bg-slate-600 text-white rounded-full px-2 py-0.5">{technicians.length}</span></>} />
             <TabButton eventKey="insurances" title={<>Seguradoras <span className="text-xs bg-slate-600 text-white rounded-full px-2 py-0.5">{insurances.length}</span></>} />
        </div>
        
        <div className="p-6">
            {activeTab === 'new-user' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block mb-2 text-sm text-slate-400">Nome Completo</label>
                           <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                         <div>
                           <label className="block mb-2 text-sm text-slate-400">Email</label>
                           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block mb-2 text-sm text-slate-400">Senha</label>
                           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                        </div>
                         <div>
                           <label className="block mb-2 text-sm text-slate-400">Nível de Acesso</label>
                           <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white">
                                <option value="seguradora">Seguradora</option>
                                <option value="tecnico">Técnico</option>
                                <option value="admin">Administrador</option>
                           </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                    </button>
                </form>
            )}
            {activeTab === 'admins' && renderUserList(admins)}
            {activeTab === 'technicians' && renderUserList(technicians)}
            {activeTab === 'insurances' && renderUserList(insurances)}
        </div>
    </div>
  );
}