import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Extract text from DOCX file
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
  
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    
    if (!documentXml) {
      throw new Error("Could not find document.xml in DOCX file");
    }
    
    // Parse XML to extract text content
    // Simple regex-based extraction for text between tags
    const textContent: string[] = [];
    
    // Extract text from <w:t> tags (Word text elements)
    const textMatches = documentXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    
    let currentParagraph = "";
    let lastEndTag = 0;
    
    // Process the document to maintain paragraph structure
    const paragraphMatches = documentXml.matchAll(/<w:p[^>]*>([\s\S]*?)<\/w:p>/g);
    
    for (const match of paragraphMatches) {
      const paragraphContent = match[1];
      const texts: string[] = [];
      
      // Extract all text from this paragraph
      const textInPara = paragraphContent.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      for (const textMatch of textInPara) {
        texts.push(textMatch[1]);
      }
      
      if (texts.length > 0) {
        textContent.push(texts.join(""));
      } else {
        // Empty paragraph = line break
        textContent.push("");
      }
    }
    
    return textContent.join("\n");
  } catch (error) {
    console.error("Error extracting DOCX content:", error);
    throw new Error("Failed to parse DOCX file: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

// Extract text from plain text files
function extractTextFromTxt(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(arrayBuffer);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { filePath, studentId } = await req.json();
    console.log("Parsing document for student:", studentId, "path:", filePath);

    if (!filePath || !studentId) {
      throw new Error("filePath and studentId are required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('planning-documents')
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error("Failed to download file: " + downloadError.message);
    }

    console.log("File downloaded, size:", fileData.size);

    const arrayBuffer = await fileData.arrayBuffer();
    const fileName = filePath.split('/').pop()?.toLowerCase() || "";
    
    let textContent: string;
    
    if (fileName.endsWith('.docx')) {
      console.log("Parsing DOCX file");
      textContent = await extractTextFromDocx(arrayBuffer);
    } else if (fileName.endsWith('.doc')) {
      // Old .doc format is more complex, suggest converting to .docx
      throw new Error("不支持旧版 .doc 格式，请将文件另存为 .docx 格式后重新上传");
    } else if (fileName.endsWith('.txt')) {
      console.log("Parsing TXT file");
      textContent = extractTextFromTxt(arrayBuffer);
    } else {
      throw new Error("不支持的文件格式。请上传 .docx 或 .txt 文件");
    }

    console.log("Extracted text length:", textContent.length);

    return new Response(JSON.stringify({ 
      success: true,
      content: textContent,
      contentLength: textContent.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Parse document error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
