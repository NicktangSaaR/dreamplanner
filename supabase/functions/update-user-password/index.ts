
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

    // Check if the user is an admin
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', adminUser.id)
      .single()

    if (profileError || !adminProfile || adminProfile.user_type !== 'admin') {
      throw new Error('Unauthorized: Only admins can update user passwords')
    }

    const { userId, newPassword } = await req.json()
    
    if (!userId || !newPassword) {
      throw new Error('Missing required fields: userId and newPassword')
    }

    console.log("Starting password update process for user:", userId, "by admin:", adminUser.id)

    // Use the admin API to update the user's password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      throw updateError
    }

    console.log("Password update successful")

    return new Response(
      JSON.stringify({ success: true }),
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
