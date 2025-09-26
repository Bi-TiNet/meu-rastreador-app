// src/components/BottomNavBar.tsx
import { NavLink } from 'react-router-dom';

interface BottomNavBarProps {
  theme: string;
  toggleTheme: () => void;
  handleLogout: () => void;
}

export function BottomNavBar({ theme, toggleTheme, handleLogout }: BottomNavBarProps) {
  // Define as classes para os links de navegação, aplicando um estilo diferente se estiver ativo
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
      isActive
        ? 'text-blue-500' // Cor do link ativo
        : 'text-slate-500 dark:text-slate-400 hover:text-blue-500' // Cor padrão e ao passar o mouse
    }`;

  // Define as classes para os botões que não são links (Tema e Sair)
  const buttonClasses =
    'flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors duration-200';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white shadow-t-lg dark:border-slate-700 dark:bg-slate-900">
      
      <NavLink to="/agenda" className={navLinkClasses}>
        <i className="bi bi-calendar-week text-2xl"></i>
        <span className="text-xs">Agenda</span>
      </NavLink>

      <NavLink to="/consulta" className={navLinkClasses}>
        <i className="bi bi-search text-2xl"></i>
        <span className="text-xs">Consulta</span>
      </NavLink>

      <NavLink to="/tarefas" className={navLinkClasses}>
        <i className="bi bi-check2-square text-2xl"></i>
        <span className="text-xs">Tarefas</span>
      </NavLink>

      <button onClick={toggleTheme} className={buttonClasses}>
        <i className={`bi bi-${theme === 'light' ? 'moon-stars-fill' : 'sun-fill'} text-2xl`}></i>
        <span className="text-xs">Tema</span>
      </button>
      
      <button onClick={handleLogout} className={buttonClasses}>
          <i className="bi bi-box-arrow-right text-2xl"></i>
          <span className="text-xs">Sair</span>
      </button>
    </nav>
  );
}