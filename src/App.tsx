// Arquivo: src/App.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';
import { Login } from './components/Login';
import { ResetPassword } from './components/ResetPassword';
import { UserManagement } from './components/UserManagement';
import { TaskList } from './components/TaskList';
import { BottomNavBar } from './components/BottomNavBar';
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// --- HOOKS E COMPONENTES AUXILIARES ---
function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUserRole(session?.user?.app_metadata?.role || null);
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.app_metadata?.role || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, userRole, loading };
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-screen w-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}

// --- NAVBAR SUPERIOR ---
function AppHeader({ userRole, theme, toggleTheme }: { userRole: string | null, theme: string, toggleTheme: () => void }) {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
        isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`;
    
    const insuranceLinks = (
      <>
        <NavLink to="/" className={navLinkClasses}><i className="bi bi-plus-circle mr-2"></i>Cadastrar</NavLink>
        <NavLink to="/consulta" className={navLinkClasses}><i className="bi bi-search mr-2"></i>Consulta</NavLink>
      </>
    );

    const adminLinks = (
      <>
        <NavLink to="/painel" className={navLinkClasses}><i className="bi bi-clipboard-data mr-2"></i>Painel</NavLink>
        <NavLink to="/agenda" className={navLinkClasses}><i className="bi bi-calendar-week mr-2"></i>Agenda</NavLink>
        <NavLink to="/usuarios" className={navLinkClasses}><i className="bi bi-people-fill mr-2"></i>Usuários</NavLink>
        <NavLink to="/" className={navLinkClasses}><i className="bi bi-plus-circle mr-2"></i>Cadastrar</NavLink>
        <NavLink to="/consulta" className={navLinkClasses}><i className="bi bi-search mr-2"></i>Consulta</NavLink>
      </>
    );

    return (
        <header className="bg-slate-900/70 backdrop-blur-md shadow-lg sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <NavLink to="/" className="flex-shrink-0 flex items-center space-x-2">
                            <img src={theme === 'dark' ? "/logo-icon.png" : "/logo-icon-claro.png"} height="40" width="40" alt="Logo Autocontrol" />
                            <span className="text-white font-bold text-xl">AUTOCONTROL</span>
                        </NavLink>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {userRole === 'admin' ? adminLinks : insuranceLinks}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <button onClick={toggleTheme} className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-300">
                            <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'} text-xl`}></i>
                        </button>
                        <button onClick={handleLogout} className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-300">
                            <i className="bi bi-box-arrow-right mr-2"></i>Sair
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}

// --- LAYOUT AUTENTICADO ---
function AuthenticatedLayout() {
  const { userRole } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getRoutesForRole = (role: string | null) => {
    switch(role) {
      case 'admin':
        return (
          <Routes>
            <Route path="/painel" element={<Dashboard />} />
            <Route path="/agenda" element={<TechnicianAgenda />} />
            <Route path="/usuarios" element={<UserManagement />} />
            <Route path="/" element={<InstallationForm />} />
            <Route path="/consulta" element={<InsuranceView />} />
            <Route path="*" element={<Navigate to="/painel" />} />
          </Routes>
        );
      case 'tecnico':
        return (
          <Routes>
            <Route path="/agenda" element={<TechnicianAgenda />} />
            <Route path="/consulta" element={<InsuranceView />} />
            <Route path="/tarefas" element={<TaskList />} />
            <Route path="*" element={<Navigate to="/agenda" />} />
          </Routes>
        );
      case 'seguradora':
      default:
        return (
          <Routes>
            <Route path="/" element={<InstallationForm />} />
            <Route path="/consulta" element={<InsuranceView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        );
    }
  };

  return (
    <>
      {userRole !== 'tecnico' && <AppHeader userRole={userRole} theme={theme} toggleTheme={toggleTheme} />}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {getRoutesForRole(userRole)}
      </main>
      <BottomNavBar theme={theme} toggleTheme={toggleTheme} handleLogout={handleLogout} userRole={userRole} />
    </>
  );
}

// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <div className="app-container min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<ResetPassword />} />
          <Route 
            path="/*"
            element={
              session 
                ? <AuthenticatedLayout /> 
                : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;