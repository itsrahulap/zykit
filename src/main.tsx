import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './tools/clean-image/CleanImagePage.tsx'
import { applyTheme, getStoredTheme } from './shared/utils/theme'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
