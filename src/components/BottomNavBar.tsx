// src/components/BottomNavBar.tsx
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

export function BottomNavBar() {
  // Esta função agora retorna todas as classes necessárias, incluindo 'nav-link' do Bootstrap.
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `nav-link text-center d-flex flex-column nav-link-custom ${isActive ? 'active' : ''}`;
  };

  return (
    // O componente <Nav> do React Bootstrap continua sendo usado como um container.
    <Nav className="justify-content-around fixed-bottom bg-light border-top py-1">
      
      {/* CORREÇÃO: Trocamos <Nav.Link as={NavLink}> por apenas <NavLink>.
        Isso resolve o conflito de tipos da propriedade 'className'.
      */}
      <NavLink to="/agenda" className={getNavLinkClass}>
        <i className="bi bi-calendar-week d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Agenda</span>
      </NavLink>

      <NavLink to="/consulta" className={getNavLinkClass}>
        <i className="bi bi-search d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Consulta</span>
      </NavLink>

      <NavLink to="/painel" className={getNavLinkClass}>
        <i className="bi bi-clipboard-data d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Painel</span>
      </NavLink>

      <NavLink to="/tarefas" className={getNavLinkClass}>
        <i className="bi bi-check2-square d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Tarefas</span>
      </NavLink>
    </Nav>
  );
}