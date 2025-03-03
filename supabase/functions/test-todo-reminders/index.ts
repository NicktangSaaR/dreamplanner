
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

// Define the headers with CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Call the weekly-todo-reminders function directly
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const response = await fetch(`${supabaseUrl}/functions/v1/weekly-todo-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    return new Response(JSON.stringify({
      message: 'Test email sent successfully',
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (error) {
    console.error('Error testing todo reminders:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
