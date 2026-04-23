import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import ToastHost from './components/ToastHost.tsx'
import { notify } from './services/notifier.ts'

/** Catch unhandled Promise rejections so Firestore/network errors surface as toasts. */
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'An unexpected error occurred.';
  console.error('Unhandled promise rejection:', reason);
  notify.error('Something went wrong', message);
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
      <ToastHost />
    </AppErrorBoundary>
  </StrictMode>,
)
