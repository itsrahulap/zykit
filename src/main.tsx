import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './styles/index.css'
import { router } from './app/router'
import { applyTheme, getStoredTheme } from './shared/utils/theme'
import { applyDesign, getStoredDesign } from './shared/utils/design'

applyTheme(getStoredTheme(), false)
applyDesign(getStoredDesign(), false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
