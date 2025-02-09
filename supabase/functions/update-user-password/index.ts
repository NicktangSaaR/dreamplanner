
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the JWT token from the request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the admin user from the JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(jwt)
    
    if (authError || !adminUser) {
      throw new Error('Invalid authentication')
    }

    const { userId, newPassword } = await req.json()
    
    console.log("Updating password for user:", userId, "by admin:", adminUser.id)

    const { data, error } = await supabaseClient.rpc('update_user_credentials', {
      admin_id: adminUser.id,
      target_user_id: userId,
      new_password: newPassword
    })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, error: null }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
