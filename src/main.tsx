import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'

const staticAssets = document.createElement('link')
staticAssets.rel = 'stylesheet'
staticAssets.href = '/site-assets.css'
document.head.append(staticAssets)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
