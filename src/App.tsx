// src/App.tsx
import { InstallationForm } from './components/InstallationForm'
import { Dashboard } from './components/Dashboard'

function App() {
  return (
    <main>
      {/* O formulário continua aqui em cima */}
      <InstallationForm />

      {/* Adicionamos uma linha divisória e o novo Dashboard embaixo */}
      <hr style={{ maxWidth: '900px', margin: '2rem auto' }} />
      <Dashboard />
    </main>
  )
}

export default App
