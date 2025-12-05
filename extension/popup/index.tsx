import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Takenoko Wallet - Initializing...');

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);

  console.log('Rendering App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('Takenoko Wallet - Initialized successfully!');
} catch (error) {
  console.error('Failed to initialize Takenoko Wallet:', error);

  // Show error in UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2 style="margin-bottom: 10px;">🎋 Takenoko Wallet</h2>
        <p style="color: #ff6b6b; margin-bottom: 10px;">Failed to load</p>
        <p style="font-size: 12px; opacity: 0.8;">Check console for errors (F12)</p>
        <pre style="font-size: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-top: 10px; text-align: left; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    `;
  }
}
