import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global polyfill for process.env to prevent crashes on startup
if (typeof window !== 'undefined') {
  const win = window as any;
  win.process = win.process || {};
  win.process.env = {
    ...win.process.env,
    API_KEY: win.process.env?.API_KEY || '',
    SUPABASE_URL: win.process.env?.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: win.process.env?.SUPABASE_ANON_KEY || ''
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