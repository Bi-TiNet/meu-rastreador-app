// Arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';

function App() {
  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/">Meu Rastreador</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/" end>Cadastrar Instalação</Nav.Link>
              <Nav.Link as={NavLink} to="/painel">Painel de Agendamentos</Nav.Link>
              <Nav.Link as={NavLink} to="/agenda">Agenda do Técnico</Nav.Link>
              <Nav.Link as={NavLink} to="/consulta">Consulta</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <main>
        <Container>
          <Routes>
            <Route path="/" element={<InstallationForm />} />
            <Route path="/painel" element={<Dashboard />} />
            <Route path="/agenda" element={<TechnicianAgenda />} />
            <Route path="/consulta" element={<InsuranceView />} />
          </Routes>
        </Container>
      </main>
    </BrowserRouter>
  );
}

export default App;