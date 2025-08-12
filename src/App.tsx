// Arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { InstallationForm } from './components/InstallationForm';
import { Dashboard } from './components/Dashboard';
import { TechnicianAgenda } from './components/TechnicianAgenda';
import { InsuranceView } from './components/InsuranceView';

function App() {
  const activeLinkStyle = {
    color: 'var(--chakra-colors-brand-400)',
    backgroundColor: 'rgba(56, 178, 172, 0.1)',
  };

  return (
    <BrowserRouter>
      <Flex
        as="nav"
        justify="center"
        p={4}
        bg="gray.800"
        borderBottom="1px"
        borderColor="gray.700"
        mb={8}
      >
        <Box
          as={NavLink}
          to="/"
          style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
          px={4} py={2} mx={2} borderRadius="md" textDecoration="none" fontWeight="500"
        >
          Cadastrar Instalação
        </Box>
        <Box
          as={NavLink}
          to="/painel"
          style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
          px={4} py={2} mx={2} borderRadius="md" textDecoration="none" fontWeight="500"
        >
          Painel de Agendamentos
        </Box>
        {/* Outros links seguem o mesmo padrão */}
      </Flex>
      
      <main>
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