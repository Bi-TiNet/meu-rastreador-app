// src/App.tsx
import { InstallationForm } from './components/InstallationForm'
import { Dashboard } from './components/Dashboard'

function App() {
  return (
    <main>
      <InstallationForm />
      <hr style={{ maxWidth: '900px', margin: '2rem auto' }} />
      <Dashboard />
    </main>
  )
}

export default App