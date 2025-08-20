// src/App.tsx
import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';
import { Login } from './components/Login';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Componente para proteger rotas
function ProtectedRoute({ children }: { children: ReactNode }) { // <-- MUDANÇA AQUI
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Carregando...</div>; // Ou um spinner
  }

  return session ? children : <Navigate to="/login" />;
}

// Componente do Navbar que reage ao estado de login
function AppNavbar() {
    const [session, setSession] = useState<Session | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Navbar bg="light" variant="light" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={NavLink} to="/" className="fw-bold">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Agenda de Instalações
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {session && (
                        <Nav className="me-auto">
                            <Nav.Link as={NavLink} to="/painel"> <i className="bi bi-clipboard-data me-1"></i> Painel</Nav.Link>
                            <Nav.Link as={NavLink} to="/"> <i className="bi bi-plus-circle me-1"></i> Cadastrar</Nav.Link>
                            <Nav.Link as={NavLink} to="/agenda"> <i className="bi bi-calendar-week me-1"></i> Agenda</Nav.Link>
                            <Nav.Link as={NavLink} to="/consulta"> <i className="bi bi-search me-1"></i> Consulta</Nav.Link>
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
  return (
    <BrowserRouter>
      <AppNavbar />
      <main className="py-4">
        <Container>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><InstallationForm /></ProtectedRoute>} />
            <Route path="/painel" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><TechnicianAgenda /></ProtectedRoute>} />
            <Route path="/consulta" element={<ProtectedRoute><InsuranceView /></ProtectedRoute>} />
          </Routes>
        </Container>
      </main>
    </BrowserRouter>
  );
}

export default App;