import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'react-calendar/dist/Calendar.css';
import { AztecProvider } from './contexts/AztecContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AztecProvider>
      <App />
    </AztecProvider>
  </StrictMode>
);
