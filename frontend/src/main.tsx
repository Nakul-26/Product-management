import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Disable mouse wheel scrolling on number inputs to prevent accidental value changes
document.addEventListener('wheel', function (e) {
  if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
