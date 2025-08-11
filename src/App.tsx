// Arquivo: src/App.tsx
import './App.css'; // Importa o nosso novo estilo global
import { InstallationForm } from './components/InstallationForm'
import { Dashboard } from './components/Dashboard'

function App() {
  return (
    <main>
      <InstallationForm />
      <Dashboard />
    </main>
  )
}

export default App