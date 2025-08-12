// Arquivo: src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App.tsx';
import theme from './theme'; // Importe o novo tema

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}> {/* Aplique o tema aqui */}
      <App />
    </ChakraProvider>
  </StrictMode>,
);