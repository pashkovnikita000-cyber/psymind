import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';
import { initTelegramWebApp } from './lib/telegram';

// Initialize Telegram WebApp SDK
initTelegramWebApp();

// Global error fallback
window.onerror = (msg, _src, _line, _col, err) => {
  const root = document.getElementById('root');
  if (root && !root.innerHTML) {
    root.innerHTML = `<div style="padding:20px;color:#ff6b6b;background:#1a1a1a;min-height:100vh;font-family:monospace;font-size:14px"><h3>JS Error</h3><pre>${msg}\n${err?.stack || ''}</pre></div>`;
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MemoryRouter initialEntries={['/']} initialIndex={0}>
        <App />
      </MemoryRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
