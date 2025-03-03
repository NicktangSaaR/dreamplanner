
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

// Define the headers with CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupWeeklyTodoReminderCron() {
  // First, check if the pg_cron and pg_net extensions are available
  const { data: cron, error: cronError } = await supabase.rpc('pg_catalog.pg_extension_config_dump', { 
    p_extension: 'pg_cron'
  }).catch(() => ({ data: null, error: new Error('pg_cron extension not available') }))

  const { data: net, error: netError } = await supabase.rpc('pg_catalog.pg_extension_config_dump', { 
    p_extension: 'pg_net'
  }).catch(() => ({ data: null, error: new Error('pg_net extension not available') }))

  if (cronError || netError) {
    console.error('Extensions not available:', cronError, netError)
    return { 
      success: false, 
      message: 'Required extensions are not available. Contact Supabase support to enable pg_cron and pg_net.'
    }
  }

  try {
    // Run SQL to create the cron job
    const { data, error } = await supabase.rpc('setup_todo_reminder_cron', {
      job_name: 'weekly_todo_reminders',
      schedule: '0 9 * * MON', // Run at 9:00 AM every Monday
      function_name: 'weekly-todo-reminders'
    })

    if (error) {
      console.error('Error setting up cron job:', error)
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      message: 'Weekly todo reminder cron job has been set up successfully!', 
      data 
    }
  } catch (error) {
    console.error('Error in cron setup:', error)
    return { success: false, error: error.message }
  }
}

// Handle the request
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const result = await setupWeeklyTodoReminderCron()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (error) {
    console.error('Error in cron setup function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
