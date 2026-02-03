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

// Get admin's valid access token (refresh if needed)
async function getAdminAccessToken(supabase: any): Promise<string> {
  const { data: credentials, error } = await supabase
    .from('admin_google_drive_credentials')
    .select('id, access_token, refresh_token, token_expires_at')
    .limit(1)
    .single();

  if (error || !credentials) {
    console.error('Admin credentials not found:', error);
    throw new Error('Admin Google Drive not connected. Please connect the admin account first.');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const expiresAt = new Date(credentials.token_expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() > fiveMinutes) {
    return credentials.access_token;
  }

  // Refresh the token
  console.log('Refreshing admin Google access token');
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

  // Update token in database
  await supabase
    .from('admin_google_drive_credentials')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })
    .eq('id', credentials.id);

  return tokenData.access_token;
}

// Get student's folder ID
async function getStudentFolderId(supabase: any, studentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('student_google_drive')
    .select('folder_id')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data.folder_id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, studentId, folderId, fileId } = await req.json();
    console.log('Google Drive Files action:', action, 'studentId:', studentId);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get admin access token (centralized auth)
    const accessToken = await getAdminAccessToken(supabase);

    if (action === 'list-files') {
      // Use provided folderId or get student's assigned folder
      const targetFolderId = folderId || await getStudentFolderId(supabase, studentId);
      
      if (!targetFolderId) {
        return new Response(JSON.stringify({ 
          files: [],
          error: 'No folder assigned for this student'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const query = `'${targetFolderId}' in parents and trashed = false`;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=${encodeURIComponent(query)}` +
        `&fields=files(id,name,mimeType,modifiedTime,webViewLink)` +
        `&orderBy=modifiedTime desc`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Drive API error:', data);
        throw new Error(data.error?.message || 'Failed to list files');
      }

      return new Response(JSON.stringify({ files: data.files || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list-all-folders') {
      // List all folders in admin's Drive (for assigning to students)
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=${encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed = false")}` +
        `&fields=files(id,name,modifiedTime)` +
        `&orderBy=name` +
        `&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Drive API error:', data);
        throw new Error(data.error?.message || 'Failed to list folders');
      }

      return new Response(JSON.stringify({ folders: data.files || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-doc-content') {
      // Get content of a Google Doc using admin token
      const response = await fetch(
        `https://docs.googleapis.com/v1/documents/${fileId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const doc = await response.json();

      if (!response.ok) {
        console.error('Docs API error:', doc);
        throw new Error(doc.error?.message || 'Failed to get document');
      }

      // Extract text content from document
      let textContent = '';
      if (doc.body?.content) {
        for (const element of doc.body.content) {
          if (element.paragraph?.elements) {
            for (const textElement of element.paragraph.elements) {
              if (textElement.textRun?.content) {
                textContent += textElement.textRun.content;
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        title: doc.title,
        content: textContent,
        documentId: doc.documentId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Google Drive files error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
