// src/App.tsx
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

// --- HOOKS E COMPONENTES DE PROTEÇÃO DE ROTA ---
function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.app_metadata?.role || null);
      setLoading(false);
    };
    getSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.app_metadata?.role || null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return { session, user, userRole, loading };
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-screen w-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}

function ProtectedRoute({ session, loading, children }: { session: Session | null, loading: boolean, children: ReactNode }) {
  if (loading) return <LoadingSpinner />;
  return session ? children : <Navigate to="/login" />;
}
function AdminProtectedRoute({ session, userRole, loading, children }: { session: Session | null, userRole: string | null, loading: boolean, children: ReactNode }) {
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/login" />;
  return userRole === 'admin' ? children : <Navigate to="/" />;
}

// --- NAVBAR SUPERIOR (PARA ADMIN E SEGURADORA) ---
function AppHeader({ userRole }: { userRole: string | null }) {
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

    return (
        <header className="bg-slate-900/70 backdrop-blur-md shadow-lg sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <NavLink to="/" className="flex-shrink-0 flex items-center space-x-2">
                            <img src="/logo-icon.png" height="40" width="40" alt="Logo Autocontrol" />
                            <span className="text-white font-bold text-xl">AUTOCONTROL</span>
                        </NavLink>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/" className={navLinkClasses}><i className="bi bi-plus-circle mr-2"></i>Cadastrar</NavLink>
                            <NavLink to="/consulta" className={navLinkClasses}><i className="bi bi-search mr-2"></i>Consulta</NavLink>
                            {userRole === 'admin' && (
                                <>
                                    <NavLink to="/painel" className={navLinkClasses}><i className="bi bi-clipboard-data mr-2"></i>Painel</NavLink>
                                    <NavLink to="/agenda" className={navLinkClasses}><i className="bi bi-calendar-week mr-2"></i>Agenda</NavLink>
                                    <NavLink to="/usuarios" className={navLinkClasses}><i className="bi bi-people-fill mr-2"></i>Usuários</NavLink>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <button onClick={handleLogout} className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-300">
                            <i className="bi bi-box-arrow-right mr-2"></i>Sair
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}

// --- BOTÃO DE TEMA ---
function ThemeToggleButton({ theme, toggleTheme }: { theme: string, toggleTheme: () => void }) {
  return (
    <button onClick={toggleTheme} className="theme-toggle h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors duration-300">
        <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'} text-xl`}></i>
    </button>
  );
}

// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const { session, userRole, loading } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const renderLayout = () => {
    if (loading) return <LoadingSpinner />;
    if (!session) return (<Routes><Route path="*" element={<Login />} /><Route path="/update-password" element={<ResetPassword />} /></Routes>);
    
    // LAYOUT DO TÉCNICO
    if (userRole === 'tecnico') {
      return (
        <>
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
            <Routes>
              <Route path="/agenda" element={<TechnicianAgenda />} />
              <Route path="/consulta" element={<InsuranceView />} />
              <Route path="/tarefas" element={<TaskList />} />
              <Route path="*" element={<Navigate to="/agenda" />} />
            </Routes>
          </main>
          <BottomNavBar />
        </>
      );
    }
    // LAYOUT PADRÃO (ADMIN E SEGURADORA)
    return (
      <>
        <AppHeader userRole={userRole} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <Routes>
            <Route path="/" element={<ProtectedRoute session={session} loading={loading}><InstallationForm /></ProtectedRoute>} />
            <Route path="/consulta" element={<ProtectedRoute session={session} loading={loading}><InsuranceView /></ProtectedRoute>} />
            <Route path="/painel" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><Dashboard /></AdminProtectedRoute>} />
            <Route path="/usuarios" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><UserManagement /></AdminProtectedRoute>} />
            <Route path="/agenda" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><TechnicianAgenda /></AdminProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </>
    );
  };

  return (
    <BrowserRouter>
      <div className="app-container min-h-screen">
        {renderLayout()}
        {session && <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />}
      </div>
    </BrowserRouter>
  );
}
export default App;