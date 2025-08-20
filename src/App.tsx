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
      <Navbar bg="light" variant="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/" className="fw-bold">
            <i className="bi bi-geo-alt-fill me-2"></i>
            Agenda de Instalações
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/" end> <i className="bi bi-plus-circle me-1"></i> Cadastrar</Nav.Link>
              <Nav.Link as={NavLink} to="/painel"> <i className="bi bi-clipboard-data me-1"></i> Painel</Nav.Link>
              <Nav.Link as={NavLink} to="/agenda"> <i className="bi bi-calendar-week me-1"></i> Agenda</Nav.Link>
              <Nav.Link as={NavLink} to="/consulta"> <i className="bi bi-search me-1"></i> Consulta</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <main className="py-4">
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