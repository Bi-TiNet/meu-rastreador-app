// Arquivo: src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa o CSS do Bootstrap
import './App.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);