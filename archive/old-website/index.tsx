import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/base.css';
import './styles/bazi-shell.css';
import './styles/bazi-input.css';
import './styles/bazi-output.css';
import './styles/bazi-desktop.css';
import './styles/bazi-tablet.css';
import './styles/bazi-mobile.css';
import './styles/app-effects.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
