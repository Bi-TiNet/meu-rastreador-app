// src/App.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Spinner } from 'react-bootstrap';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';
import { Login } from './components/Login';
import { ResetPassword } from './components/ResetPassword';
import { UserManagement } from './components/UserManagement';
import { TaskList } from './components/TaskList'; // <-- IMPORTAR NOVO COMPONENTE
import { BottomNavBar } from './components/BottomNavBar'; // <-- IMPORTAR NOVO COMPONENTE
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Hook customizado para gerenciar o estado da sessão e do usuário
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


// Componente para proteger rotas que TODOS os usuários logados podem ver
function ProtectedRoute({ session, loading, children }: { session: Session | null, loading: boolean, children: ReactNode }) {
  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }
  return session ? children : <Navigate to="/login" />;
}

// Componente para proteger rotas que APENAS administradores podem ver
function AdminProtectedRoute({ session, userRole, loading, children }: { session: Session | null, userRole: string | null, loading: boolean, children: ReactNode }) {
  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }
  if (!session) {
    return <Navigate to="/login" />;
  }
  return userRole === 'admin' ? children : <Navigate to="/" />;
}

// Protege rotas para administradores e técnicos
function AdminOrTechnicianRoute({ session, userRole, loading, children }: { session: Session | null, userRole: string | null, loading: boolean, children: ReactNode }) {
  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }
  if (!session) {
    return <Navigate to="/login" />;
  }
  // Permite o acesso se o usuário for 'admin' OU 'tecnico'
  return (userRole === 'admin' || userRole === 'tecnico') ? children : <Navigate to="/" />;
}


// Componente do Navbar superior
function AppNavbar({ session, userRole }: { session: Session | null, userRole: string | null }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="mb-4 shadow-sm">
            <Container>
                <Navbar.Brand as={NavLink} to={session ? "/" : "/login"} className="d-flex align-items-center">
                    <img
                      src="/logo-icon.png"
                      height="40"
                      className="d-inline-block align-top me-2"
                      alt="Logo Autocontrol"
                    />
                    <div className="d-flex flex-column lh-1">
                        <span className="fw-bold fs-6">AUTOCONTROL</span>
                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>Rastreamento Veicular</small>
                    </div>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {session && (
                        <Nav className="me-auto">
                            <Nav.Link as={NavLink} to="/"><i className="bi bi-plus-circle me-1"></i> Cadastrar</Nav.Link>
                            <Nav.Link as={NavLink} to="/consulta"><i className="bi bi-search me-1"></i> Consulta</Nav.Link>
                            
                            {(userRole === 'admin' || userRole === 'tecnico') && (
                                <Nav.Link as={NavLink} to="/painel"><i className="bi bi-clipboard-data me-1"></i> Painel</Nav.Link>
                            )}
                            
                            {userRole === 'admin' && (
                                <>
                                    <Nav.Link as={NavLink} to="/agenda"><i className="bi bi-calendar-week me-1"></i> Agenda</Nav.Link>
                                    <Nav.Link as={NavLink} to="/usuarios"><i className="bi bi-people-fill me-1"></i> Usuários</Nav.Link>
                                </>
                            )}
                            
                             {userRole === 'tecnico' && (
                                <Nav.Link as={NavLink} to="/agenda"><i className="bi bi-calendar-week me-1"></i> Minha Agenda</Nav.Link>
                             )}
                        </Nav>
                    )}
                    <Nav className="ms-auto">
                        {session && (
                            <Button variant="outline-danger" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i>Sair
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

// Botão de troca de tema
function ThemeToggleButton({ theme, toggleTheme }: { theme: string, toggleTheme: () => void }) {
  return (
    <Button variant="primary" onClick={toggleTheme} className="theme-toggle">
      <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'}`}></i>
    </Button>
  );
}


function App() {
  const { session, userRole, loading } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Renderiza o layout correto baseado no perfil do usuário
  const renderLayout = () => {
    if (loading) {
      return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    if (!session) {
      return (
        <Routes>
          <Route path="*" element={<Login />} />
          <Route path="/update-password" element={<ResetPassword />} />
        </Routes>
      );
    }
    
    // LAYOUT DO TÉCNICO COM NAVEGAÇÃO INFERIOR
    if (userRole === 'tecnico') {
      return (
        <>
          <main className="py-4 pb-5 mb-5"> {/* Padding no final para não cobrir o conteúdo */}
            <Container>
              <Routes>
                <Route path="/agenda" element={<TechnicianAgenda />} />
                <Route path="/consulta" element={<InsuranceView />} />
                <Route path="/painel" element={<Dashboard />} />
                <Route path="/tarefas" element={<TaskList />} />
                {/* Redireciona qualquer outra rota para a agenda */}
                <Route path="*" element={<Navigate to="/agenda" />} />
              </Routes>
            </Container>
          </main>
          <BottomNavBar />
        </>
      );
    }

    // LAYOUT PADRÃO (ADMIN / SEGURADORA) COM NAVEGAÇÃO SUPERIOR
    return (
      <>
        <AppNavbar session={session} userRole={userRole} />
        <main className="py-4">
          <Container>
             <Routes>
              <Route path="/" element={<ProtectedRoute session={session} loading={loading}><InstallationForm /></ProtectedRoute>} />
              <Route path="/consulta" element={<ProtectedRoute session={session} loading={loading}><InsuranceView /></ProtectedRoute>} />
              <Route path="/painel" element={<AdminOrTechnicianRoute session={session} userRole={userRole} loading={loading}><Dashboard /></AdminOrTechnicianRoute>} />
              <Route path="/usuarios" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><UserManagement /></AdminProtectedRoute>} />
              <Route path="/agenda" element={<AdminOrTechnicianRoute session={session} userRole={userRole} loading={loading}><TechnicianAgenda /></AdminOrTechnicianRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </main>
      </>
    );
  };


  return (
    <BrowserRouter>
      <div className={`app-container theme-${theme}`}>
        {renderLayout()}
        {session && <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />}
      </div>
    </BrowserRouter>
  );
}

export default App;