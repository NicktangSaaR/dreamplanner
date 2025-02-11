
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './integrations/supabase/client'
import App from './App'
import './index.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    },
  },
})

// Initialize Supabase auth state
const initializeAuth = async () => {
  try {
    // First check for an existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return
    }
    console.log('Initial session state:', session ? 'Logged in' : 'No session')

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
      
      if (event === 'SIGNED_OUT') {
        // Clear any auth-related cache on sign out
        queryClient.clear()
      } else if (event === 'SIGNED_IN' && session) {
        // Refresh relevant queries on sign in
        queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      }
    })

    // Return cleanup function
    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
  }
}

// Initialize auth before rendering
initializeAuth().then(() => {
  const rootElement = document.getElementById("root")
  if (!rootElement) throw new Error('Failed to find the root element')

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
})
