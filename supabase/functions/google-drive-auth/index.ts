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

// Admin credentials storage key
const ADMIN_CREDENTIALS_KEY = 'admin_google_drive_credentials';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    const { action, code, studentId, folderId, redirectUri } = await req.json();
    console.log('Google Drive Auth action:', action);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get admin credentials from a settings table or first admin's credentials
    const getAdminCredentials = async () => {
      // Try to get from student_google_drive where student_id is 'admin'
      const { data, error } = await supabase
        .from('student_google_drive')
        .select('access_token, refresh_token, token_expires_at')
        .eq('student_id', ADMIN_CREDENTIALS_KEY)
        .single();
      
      if (error || !data) {
        return null;
      }
      return data;
    };

    const refreshAdminToken = async () => {
      const credentials = await getAdminCredentials();
      if (!credentials?.refresh_token) {
        throw new Error('Admin Google Drive not connected. Please connect first.');
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Token refresh failed:', tokenData);
        throw new Error('Failed to refresh admin access token');
      }

      // Update admin credentials
      await supabase
        .from('student_google_drive')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq('student_id', ADMIN_CREDENTIALS_KEY);

      return tokenData.access_token;
    };

    // Admin connects their Google Drive (one-time setup)
    if (action === 'admin-get-auth-url') {
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
        `&state=admin`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for admin tokens
    if (action === 'admin-exchange-code') {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Admin token exchange response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error('Admin token exchange failed:', tokenData);
        throw new Error(tokenData.error_description || 'Failed to exchange authorization code');
      }

      // Store admin credentials with special key
      const { error: upsertError } = await supabase
        .from('student_google_drive')
        .upsert({
          student_id: ADMIN_CREDENTIALS_KEY,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        }, {
          onConflict: 'student_id',
        });

      if (upsertError) {
        console.error('Failed to store admin tokens:', upsertError);
        throw new Error('Failed to store admin authorization tokens');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if admin has connected Google Drive
    if (action === 'check-admin-status') {
      const credentials = await getAdminCredentials();
      const connected = !!credentials;
      const tokenExpired = credentials?.token_expires_at 
        ? new Date(credentials.token_expires_at) < new Date() 
        : true;

      return new Response(JSON.stringify({
        connected,
        tokenExpired: connected ? tokenExpired : true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get valid admin access token (refreshes if needed)
    if (action === 'get-access-token') {
      const credentials = await getAdminCredentials();
      if (!credentials) {
        throw new Error('Admin Google Drive not connected');
      }

      let accessToken = credentials.access_token;
      const tokenExpired = credentials.token_expires_at 
        ? new Date(credentials.token_expires_at) < new Date() 
        : true;

      if (tokenExpired) {
        accessToken = await refreshAdminToken();
      }

      return new Response(JSON.stringify({ 
        success: true,
        access_token: accessToken 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set folder ID for a student
    if (action === 'set-student-folder') {
      if (!studentId || !folderId) {
        throw new Error('Student ID and Folder ID are required');
      }

      const { error } = await supabase
        .from('student_google_drive')
        .upsert({
          student_id: studentId,
          folder_id: folderId,
          access_token: 'uses_admin', // Placeholder since we use admin tokens
          refresh_token: 'uses_admin',
        }, {
          onConflict: 'student_id',
        });

      if (error) {
        console.error('Failed to set student folder:', error);
        throw new Error('Failed to set student folder');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get student's folder ID
    if (action === 'get-student-folder') {
      const { data, error } = await supabase
        .from('student_google_drive')
        .select('folder_id')
        .eq('student_id', studentId)
        .single();

      return new Response(JSON.stringify({
        folderId: data?.folder_id || null,
        hasFolder: !!data?.folder_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove student folder mapping
    if (action === 'remove-student-folder') {
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