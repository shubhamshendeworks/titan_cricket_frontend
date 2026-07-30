import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          containerStyle={{ zIndex: 700 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A2235',
              color: '#F1F5F9',
              border: '1px solid #2A3550',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              maxWidth: '360px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
            },
            success: {
              style: {
                background: '#1A2235',
                color: '#00D4AA',
                border: '1px solid rgba(0,212,170,0.3)',
              },
              iconTheme: { primary: '#00D4AA', secondary: '#1A2235' },
            },
            error: {
              duration: 5000,
              style: {
                background: '#1A2235',
                color: '#FF3B5C',
                border: '1px solid rgba(255,59,92,0.3)',
              },
              iconTheme: { primary: '#FF3B5C', secondary: '#1A2235' },
            },
          }}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
