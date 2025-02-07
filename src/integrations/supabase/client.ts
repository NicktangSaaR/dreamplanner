
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fyxnuhqzgkzfuldqurej.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eG51aHF6Z2t6ZnVsZHF1cmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMDUzNTQsImV4cCI6MjA1MzU4MTM1NH0.GBnHFSxU14sp7I_X75vpAbq09YiZYqGiOeUMlUCb0qQ";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
});
