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

async function getValidAccessToken(supabase: any, studentId: string): Promise<string> {
  const { data: driveData, error } = await supabase
    .from('student_google_drive')
    .select('access_token, refresh_token, token_expires_at')
    .eq('student_id', studentId)
    .single();

  if (error || !driveData) {
    throw new Error('No Google Drive authorization found');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const expiresAt = new Date(driveData.token_expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() > fiveMinutes) {
    return driveData.access_token;
  }

  // Refresh the token
  console.log('Refreshing Google access token for student:', studentId);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: driveData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error('Token refresh failed:', tokenData);
    throw new Error('Failed to refresh access token');
  }

  // Update token in database
  await supabase
    .from('student_google_drive')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })
    .eq('student_id', studentId);

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, studentId, folderId, fileId } = await req.json();
    console.log('Google Drive Files action:', action, 'studentId:', studentId);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const accessToken = await getValidAccessToken(supabase, studentId);

    if (action === 'list-files') {
      // List files in a specific folder
      let query = `'${folderId}' in parents and trashed = false`;
      
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

    if (action === 'list-folders') {
      // List all folders accessible to the user (for folder selection)
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=${encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed = false")}` +
        `&fields=files(id,name,modifiedTime)` +
        `&orderBy=name`,
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
      // Get content of a Google Doc
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

    if (action === 'set-folder') {
      // Update the folder ID for the student
      await supabase
        .from('student_google_drive')
        .update({ folder_id: folderId })
        .eq('student_id', studentId);

      return new Response(JSON.stringify({ success: true }), {
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
