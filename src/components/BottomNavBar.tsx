// src/components/BottomNavBar.tsx
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

export function BottomNavBar() {
  // Esta função retorna as classes de estilo corretas para o link de navegação.
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `nav-link text-center d-flex flex-column nav-link-custom ${isActive ? 'active' : ''}`;
  };

  return (
    <Nav className="justify-content-around fixed-bottom bg-light border-top py-1">
      
      <NavLink to="/agenda" className={getNavLinkClass}>
        <i className="bi bi-calendar-week d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Agenda</span>
      </NavLink>

      <NavLink to="/consulta" className={getNavLinkClass}>
        <i className="bi bi-search d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Consulta</span>
      </NavLink>

      {/* O link para /painel foi removido daqui */}

      <NavLink to="/tarefas" className={getNavLinkClass}>
        <i className="bi bi-check2-square d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Tarefas</span>
      </NavLink>
    </Nav>
  );
}