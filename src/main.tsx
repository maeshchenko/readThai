import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'

import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/400-italic.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/600-italic.css'

import '@fontsource/ibm-plex-sans-thai-looped/400.css'
import '@fontsource/ibm-plex-sans-thai-looped/500.css'

import './i18n'
import './index.css'
import App from './App'
import { reportWebVitals } from '@/lib/webVitals'
import { registerServiceWorker } from '@/lib/registerSW'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

reportWebVitals()
registerServiceWorker()
