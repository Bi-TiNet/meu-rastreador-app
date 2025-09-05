// src/components/BottomNavBar.tsx
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

// Estilo para os ícones e texto da barra de navegação
const navLinkStyle = {
    color: 'var(--bs-secondary-color)',
    transition: 'color 0.2s',
};

const activeNavLinkStyle = {
    color: 'var(--bs-primary)',
};

export function BottomNavBar() {
  return (
    <Nav className="justify-content-around fixed-bottom bg-light border-top py-1">
      <Nav.Link 
        as={NavLink} 
        to="/agenda" 
        className="text-center d-flex flex-column"
        // CORREÇÃO: Adicionada a tipagem { isActive: boolean }
        style={({ isActive }: { isActive: boolean }) => (isActive ? {...navLinkStyle, ...activeNavLinkStyle} : navLinkStyle)}
      >
        <i className="bi bi-calendar-week d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Agenda</span>
      </Nav.Link>
      <Nav.Link 
        as={NavLink} 
        to="/consulta" 
        className="text-center d-flex flex-column"
        // CORREÇÃO: Adicionada a tipagem { isActive: boolean }
        style={({ isActive }: { isActive: boolean }) => (isActive ? {...navLinkStyle, ...activeNavLinkStyle} : navLinkStyle)}
       >
        <i className="bi bi-search d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Consulta</span>
      </Nav.Link>
      <Nav.Link 
        as={NavLink} 
        to="/painel" 
        className="text-center d-flex flex-column"
        // CORREÇÃO: Adicionada a tipagem { isActive: boolean }
        style={({ isActive }: { isActive: boolean }) => (isActive ? {...navLinkStyle, ...activeNavLinkStyle} : navLinkStyle)}
      >
        <i className="bi bi-clipboard-data d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Painel</span>
      </Nav.Link>
      <Nav.Link 
        as={NavLink} 
        to="/tarefas" 
        className="text-center d-flex flex-column"
        // CORREÇÃO: Adicionada a tipagem { isActive: boolean }
        style={({ isActive }: { isActive: boolean }) => (isActive ? {...navLinkStyle, ...activeNavLinkStyle} : navLinkStyle)}
      >
        <i className="bi bi-check2-square d-block fs-4"></i>
        <span style={{ fontSize: '0.7rem' }}>Tarefas</span>
      </Nav.Link>
    </Nav>
  );
}