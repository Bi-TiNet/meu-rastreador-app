// src/App.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Spinner } from 'react-bootstrap';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';
import { Login } from './components/Login';
import { ResetPassword } from './components/ResetPassword'; // Importe o novo componente
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
      setUserRole(session?.user?.app_metadata?.role || 'admin');
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.app_metadata?.role || 'admin');
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
  return userRole === 'admin' ? children : <Navigate to="/" />; // Redireciona seguradora para a página inicial
}


// Componente do Navbar
function AppNavbar({ session, userRole }: { session: Session | null, userRole: string | null }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Navbar bg="light" variant="light" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={NavLink} to={session ? (userRole === 'admin' ? '/painel' : '/') : '/login'} className="fw-bold">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Agenda de Instalações
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {session && (
                        <Nav className="me-auto">
                            {/* Links para Seguradora e Admin */}
                            <Nav.Link as={NavLink} to="/"> <i className="bi bi-plus-circle me-1"></i> Cadastrar</Nav.Link>
                            <Nav.Link as={NavLink} to="/consulta"> <i className="bi bi-search me-1"></i> Consulta</Nav.Link>
                            
                            {/* Links apenas para Admin */}
                            {userRole === 'admin' && (
                                <>
                                    <Nav.Link as={NavLink} to="/painel"> <i className="bi bi-clipboard-data me-1"></i> Painel</Nav.Link>
                                    <Nav.Link as={NavLink} to="/agenda"> <i className="bi bi-calendar-week me-1"></i> Agenda</Nav.Link>
                                </>
                            )}
                        </Nav>
                    )}
                    <Nav className="ms-auto">
                        {session ? (
                            <Button variant="outline-primary" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i>Sair
                            </Button>
                        ) : (
                            <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

function App() {
  const { session, userRole, loading } = useAuth();

  return (
    <BrowserRouter>
      <AppNavbar session={session} userRole={userRole} />
      <main className="py-4">
        <Container>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Adicione a nova rota aqui */}
            <Route path="/update-password" element={<ResetPassword />} />
            
            {/* Rotas Acessíveis para Seguradora e Admin */}
            <Route path="/" element={<ProtectedRoute session={session} loading={loading}><InstallationForm /></ProtectedRoute>} />
            <Route path="/consulta" element={<ProtectedRoute session={session} loading={loading}><InsuranceView /></ProtectedRoute>} />
            
            {/* Rotas Acessíveis apenas para Admin */}
            <Route path="/painel" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><Dashboard /></AdminProtectedRoute>} />
            <Route path="/agenda" element={<AdminProtectedRoute session={session} userRole={userRole} loading={loading}><TechnicianAgenda /></AdminProtectedRoute>} />
          
          </Routes>
        </Container>
      </main>
    </BrowserRouter>
  );
}

export default App;