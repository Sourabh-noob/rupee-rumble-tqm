import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global polyfill for process.env to prevent crashes on startup
if (typeof window !== 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: (window as any).process?.env?.API_KEY || '',
      SUPABASE_URL: (window as any).process?.env?.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: (window as any).process?.env?.SUPABASE_ANON_KEY || ''
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);