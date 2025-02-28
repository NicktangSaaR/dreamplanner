
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
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

    // Get request body
    const { userId, newEmail } = await req.json()
    if (!userId || !newEmail) {
      throw new Error('Missing required fields')
    }

    console.log("Updating email for user:", userId, "to:", newEmail, "by admin:", adminUser.id)

    // Call the database function to update user credentials
    const { data, error } = await supabaseClient.rpc('update_user_credentials', {
      admin_id: adminUser.id,
      target_user_id: userId,
      new_email: newEmail
    })

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    // Fetch the updated profile to confirm changes
    const { data: updatedProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error("Error fetching updated profile:", profileError)
      throw profileError
    }

    console.log("Successfully updated user profile:", updatedProfile)

    return new Response(
      JSON.stringify({ data: updatedProfile, error: null }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
