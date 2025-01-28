import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './integrations/supabase/client'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Initialize Supabase auth state
const initializeAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return
    }
    console.log('Initial session state:', session ? 'Logged in' : 'No session')
  } catch (error) {
    console.error('Error initializing auth:', error)
  }
}

// Initialize auth before rendering
initializeAuth().then(() => {
  const rootElement = document.getElementById("root")
  if (!rootElement) throw new Error('Failed to find the root element')

  const root = createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
})