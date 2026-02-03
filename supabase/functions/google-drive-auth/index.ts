import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    const { action, code, studentId, redirectUri } = await req.json();
    console.log('Google Drive Auth action:', action, 'studentId:', studentId);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === 'get-auth-url') {
      // Generate OAuth URL for Google Drive authorization
      const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(studentId)}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange-code') {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Token exchange response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData);
        throw new Error(tokenData.error_description || 'Failed to exchange authorization code');
      }

      // Store tokens in database
      const { error: upsertError } = await supabase
        .from('student_google_drive')
        .upsert({
          student_id: studentId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        }, {
          onConflict: 'student_id',
        });

      if (upsertError) {
        console.error('Failed to store tokens:', upsertError);
        throw new Error('Failed to store authorization tokens');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh-token') {
      // Get existing refresh token
      const { data: driveData, error: fetchError } = await supabase
        .from('student_google_drive')
        .select('refresh_token')
        .eq('student_id', studentId)
        .single();

      if (fetchError || !driveData) {
        throw new Error('No Google Drive authorization found');
      }

      // Refresh the access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: driveData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Token refresh failed:', tokenData);
        throw new Error('Failed to refresh access token');
      }

      // Update access token
      await supabase
        .from('student_google_drive')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('student_id', studentId);

      return new Response(JSON.stringify({ 
        success: true,
        access_token: tokenData.access_token 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check-status') {
      // Check if student has Google Drive connected
      const { data: driveData, error } = await supabase
        .from('student_google_drive')
        .select('id, folder_id, token_expires_at')
        .eq('student_id', studentId)
        .single();

      return new Response(JSON.stringify({
        connected: !!driveData && !error,
        folderId: driveData?.folder_id,
        tokenExpired: driveData?.token_expires_at ? new Date(driveData.token_expires_at) < new Date() : true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      await supabase
        .from('student_google_drive')
        .delete()
        .eq('student_id', studentId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Google Drive auth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
