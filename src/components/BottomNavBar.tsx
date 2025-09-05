// src/components/BottomNavBar.tsx
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

export function BottomNavBar() {
  // Função para gerar as classes dinamicamente
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `text-center d-flex flex-column nav-link-custom ${isActive ? 'active' : ''}`;
  };

  return (
    <Nav className="justify-content-around fixed-bottom bg-light border-top py-1">
      <Nav.Link as={NavLink} to="/agenda" className={getNavLinkClass}>
        <i className="bi bi-calendar-week d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Agenda</span>
      </Nav.Link>

      <Nav.Link as={NavLink} to="/consulta" className={getNavLinkClass}>
        <i className="bi bi-search d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Consulta</span>
      </Nav.Link>

      <Nav.Link as={NavLink} to="/painel" className={getNavLinkClass}>
        <i className="bi bi-clipboard-data d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Painel</span>
      </Nav.Link>

      <Nav.Link as={NavLink} to="/tarefas" className={getNavLinkClass}>
        <i className="bi bi-check2-square d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Tarefas</span>
      </Nav.Link>
    </Nav>
  );
}