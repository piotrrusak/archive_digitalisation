import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/montserrat/400.css'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider.tsx'
import { FlashProvider } from './providers/FlashProvider.tsx'

// ✅ DODAJ TO:
import { registerLicense } from '@syncfusion/ej2-base'

// ✅ I TO (najlepiej z env, fallback na pusty):
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY?.trim() || '')

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <FlashProvider>
        <App />
      </FlashProvider>
    </AuthProvider>
  </StrictMode>,
)
