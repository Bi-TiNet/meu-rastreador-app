// Arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';

function App() {
  return (
    <BrowserRouter>
      {/* O menu de navegação foi atualizado para as novas páginas */}
      <nav className="main-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Cadastrar Instalação</NavLink>
        <NavLink to="/painel" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Painel de Agendamentos</NavLink>
        <NavLink to="/agenda" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Agenda do Técnico</NavLink>
        <NavLink to="/consulta" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Consulta Seguradora</NavLink>
      </nav>
      
      <main>
        {/* As rotas foram separadas */}
        <Routes>
          <Route path="/" element={<InstallationForm />} />
          <Route path="/painel" element={<Dashboard />} />
          <Route path="/agenda" element={<TechnicianAgenda />} />
          <Route path="/consulta" element={<InsuranceView />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;