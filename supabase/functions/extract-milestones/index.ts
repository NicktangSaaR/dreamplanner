import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const { documentContent, documentId, studentId, reminderEmails } = await req.json();
    console.log('Extracting milestones for student:', studentId, 'document:', documentId);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Call Deepseek API to extract milestones
    const prompt = `你是一个留学规划专家。请从以下规划方案文档中提取所有重要的时间节点和截止日期。

对于每个节点，请提供：
1. 标题（简短描述任务）
2. 描述（详细说明）
3. 截止日期（格式：YYYY-MM-DD）

请以JSON格式返回，格式如下：
{
  "milestones": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "due_date": "2025-03-15"
    }
  ]
}

如果文档中没有明确的日期，请根据上下文推断合理的日期。
如果完全无法确定日期，请使用 null 作为 due_date。

文档内容：
${documentContent}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的留学规划顾问，擅长从规划文档中提取关键时间节点。请始终返回有效的JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const aiResponse = await response.json();
    console.log('Deepseek response status:', response.status);

    if (!response.ok) {
      console.error('Deepseek API error:', aiResponse);
      throw new Error(aiResponse.error?.message || 'Failed to call Deepseek API');
    }

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let parsedMilestones;
    try {
      parsedMilestones = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    const milestones = parsedMilestones.milestones || [];
    console.log('Extracted milestones:', milestones.length);

    // Delete existing milestones for this document
    if (documentId) {
      await supabase
        .from('planning_milestones')
        .delete()
        .eq('document_id', documentId);
    }

    // Insert new milestones
    const milestonesToInsert = milestones
      .filter((m: any) => m.due_date)
      .map((m: any) => ({
        student_id: studentId,
        document_id: documentId,
        title: m.title,
        description: m.description,
        due_date: m.due_date,
        reminder_emails: reminderEmails || [],
        reminder_sent: false,
      }));

    if (milestonesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('planning_milestones')
        .insert(milestonesToInsert);

      if (insertError) {
        console.error('Failed to insert milestones:', insertError);
        throw new Error('Failed to save milestones');
      }

      // Also create todos for calendar sync
      // First, delete existing milestone-related todos for this student
      // (todos that match milestone titles to avoid duplicates)
      const milestoneTitles = milestonesToInsert.map((m: any) => m.title);
      
      // Create todos from milestones
      const todosToInsert = milestonesToInsert.map((m: any) => ({
        author_id: studentId,
        title: `📌 ${m.title}`,
        due_date: m.due_date,
        completed: false,
        starred: true,
      }));

      const { error: todoError } = await supabase
        .from('todos')
        .insert(todosToInsert);

      if (todoError) {
        console.error('Failed to create todos from milestones:', todoError);
        // Don't throw - milestones were saved, just log the error
      } else {
        console.log('Created', todosToInsert.length, 'todos from milestones');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      milestonesCount: milestonesToInsert.length,
      milestones: milestonesToInsert,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Extract milestones error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
