import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// Silenciar errores de WebSocket de Vite HMR en desarrollo
import './utils/websocketErrorHandler'
import './i18n/config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
