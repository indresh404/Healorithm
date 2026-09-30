import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Automatically register PWA service worker with reload prompt
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of Healorithm is available. Reload now to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Healorithm PWA is ready for offline operation.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
