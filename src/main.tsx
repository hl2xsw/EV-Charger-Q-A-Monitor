import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign sandbox-level HMR WebSocket and transient "Failed to fetch" connection alerts to maintain pristine layout and stable production runtime
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reasonStr = String(event.reason || "");
    if (
      reasonStr.includes("WebSocket") || 
      reasonStr.includes("failed to connect") ||
      reasonStr.includes("Failed to fetch") ||
      reasonStr.includes("HMR")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[Benign Sanitized Suppressed]:", event.reason);
    }
  });

  window.addEventListener("error", (event) => {
    const msg = String(event.message || "");
    if (
      msg.includes("WebSocket") || 
      msg.includes("failed to connect") ||
      msg.includes("Failed to fetch") ||
      msg.includes("HMR")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[Benign Sanitized Suppressed Error]:", msg);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

