// Arquivo: src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react' // 1. Importa o Provider
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. Envolve toda a aplicação com o ChakraProvider */}
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </StrictMode>,
)