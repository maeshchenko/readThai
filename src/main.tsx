import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

import '@fontsource/ibm-plex-sans-thai/400.css'
import '@fontsource/ibm-plex-sans-thai/500.css'
import '@fontsource/ibm-plex-sans-thai/600.css'
import '@fontsource/ibm-plex-sans-thai/700.css'

import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/500.css'
import '@fontsource/sarabun/600.css'
import '@fontsource/sarabun/700.css'

import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/700.css'

import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import '@fontsource/noto-serif-thai/400.css'
import '@fontsource/noto-serif-thai/700.css'

import './i18n'
import './index.css'
import App from './App'
import { ToastProvider } from '@/components/ui/Toast'
import { reportWebVitals } from '@/lib/webVitals'
import { registerServiceWorker } from '@/lib/registerSW'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

reportWebVitals()
registerServiceWorker()
