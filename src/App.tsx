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

// *** NOVO COMPONENTE DE ROTA ***
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


// Componente do Navbar
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
                            {/* Links visíveis para todos os perfis logados */}
                            <Nav.Link as={NavLink} to="/"><i className="bi bi-plus-circle me-1"></i> Cadastrar</Nav.Link>
                            <Nav.Link as={NavLink} to="/consulta"><i className="bi bi-search me-1"></i> Consulta</Nav.Link>
                            
                            {/* Links para Admin e Técnico */}
                            {(userRole === 'admin' || userRole === 'tecnico') && (
                                <Nav.Link as={NavLink} to="/painel"><i className="bi bi-clipboard-data me-1"></i> Painel</Nav.Link>
                            )}
                            
                            {/* Links apenas para Admin */}
                            {userRole === 'admin' && (
                                <>
                                    <Nav.Link as={NavLink} to="/agenda"><i className="bi bi-calendar-week me-1"></i> Agenda</Nav.Link>
                                    <Nav.Link as={NavLink} to="/usuarios"><i className="bi bi-people-fill me-1"></i> Usuários</Nav.Link>
                                </>
                            )}
                            
                            {/* Link da Agenda para Técnicos */}
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <div className={`app-container theme-${theme}`}>
        {session && <AppNavbar session={session} userRole={userRole} />}
        <main className="py-4">
          <Container>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/update-password" element={<ResetPassword />} />
              
              {/* Rotas Protegidas para todos os usuários logados */}
              <Route path="/" element={<ProtectedRoute session={session} loading={loading}><InstallationForm /></ProtectedRoute>} />
              <Route path="/consulta" element={<ProtectedRoute session={session} loading={loading}><InsuranceView /></ProtectedRoute>} />
              
              {/* Rota do Painel para ADMIN e TÉCNICO */}
              <Route path="/painel" element={<AdminOrTechnicianRoute session={session} userRole={userRole} loading={loading}><Dashboard /></AdminOrTechnicianRoute>} />
              
              {/* Rota de Usuários apenas para ADMIN */}
              <Route path="/usuarios" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><UserManagement /></AdminProtectedRoute>} />
              
              {/* Rota da Agenda para ADMIN e TÉCNICO */}
              <Route path="/agenda" element={
                <ProtectedRoute session={session} loading={loading}>
                  {(userRole === 'admin' || userRole === 'tecnico') ? <TechnicianAgenda /> : <Navigate to="/" />}
                </ProtectedRoute>
              } />
            
            </Routes>
          </Container>
        </main>
        {session && <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />}
      </div>
    </BrowserRouter>
  );
}

export default App;