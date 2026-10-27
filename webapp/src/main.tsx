import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';
import { initTelegramWebApp } from './lib/telegram';

const showError = (msg: string) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:20px;color:#fff;background:#c0392b;min-height:100vh;font-family:monospace;font-size:13px;word-break:break-all"><b>ERROR:</b><br>${msg}</div>`;
  }
};

window.onerror = (_msg, _src, _line, _col, err) => {
  showError((err?.stack || _msg) as string);
};

window.addEventListener('unhandledrejection', (e) => {
  showError(String(e.reason?.stack || e.reason || 'Unhandled rejection'));
});

try {
  initTelegramWebApp();
} catch (e: unknown) {
  showError('initTelegramWebApp failed: ' + String(e));
}

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
          <App />
        </MemoryRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (e: unknown) {
  showError('ReactDOM.render failed: ' + String(e));
}
