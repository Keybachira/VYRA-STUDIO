import './assets/main.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'

const ua = navigator.userAgent
if (ua.indexOf('Mac') !== -1) {
  document.documentElement.dataset.platform = 'darwin'
} else if (ua.indexOf('Win') !== -1) {
  document.documentElement.dataset.platform = 'win32'
} else {
  document.documentElement.dataset.platform = 'linux'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

declare global {
  interface Window {
    // Shortcut cache for the camera window's local key handler.
    // Populated once on mount; updated via settings-reset events.
    // Not part of the preload bridge on purpose (renderer-local).

    vyraCacheShortcuts?: Record<string, string>
  }
}
