import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';
import { initTelegramWebApp } from './lib/telegram';

// Initialize Telegram WebApp SDK
initTelegramWebApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MemoryRouter initialEntries={['/']} initialIndex={0}>
        <App />
      </MemoryRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
