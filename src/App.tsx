// Arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import './App.css';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView'; // 1. Importa a nova página

// Página do Administrador
function AdminPage() {
  return (
    <>
      <InstallationForm />
      <Dashboard />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* 2. Adiciona o novo link no menu de navegação */}
      <nav className="main-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Painel Administrador</NavLink>
        <NavLink to="/agenda" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Agenda do Técnico</NavLink>
        <NavLink to="/consulta" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Consulta Seguradora</NavLink>
      </nav>
      
      <main>
        <Routes>
          {/* 3. Cria a nova rota para a página */}
          <Route path="/" element={<AdminPage />} />
          <Route path="/agenda" element={<TechnicianAgenda />} />
          <Route path="/consulta" element={<InsuranceView />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;