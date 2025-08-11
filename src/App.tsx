// Arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';

// Criamos um componente para a sua página de administrador
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
      <nav style={{ padding: '1rem', backgroundColor: '#343a40', textAlign: 'center' }}>
        <Link to="/" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Painel Administrador</Link>
        <Link to="/agenda" style={{ color: 'white', margin: '0 1rem', textDecoration: 'none' }}>Agenda do Técnico</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/agenda" element={<TechnicianAgenda />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;