import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, questionNumber, allowDirectAnswers } = await req.json();
    
    console.log('Socratic tutor request:', { conversationId, questionNumber, allowDirectAnswers });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get conversation history
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    console.log('Retrieved conversation history:', messages?.length || 0, 'messages');

    // Build conversation history for AI
    const conversationHistory = (messages || []).map(msg => ({
      role: msg.sender === 'student' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Create system prompt based on allowDirectAnswers
    const systemPrompt = `You are Socratica, a Socratic tutoring assistant for students.

Your primary goal is to help the student learn through guided questioning and scaffolding, NOT by providing direct answers.

CORE BEHAVIORAL RULES:
${allowDirectAnswers 
  ? '- This assignment allows direct answers WITH EXPLANATION. You may provide fuller help, but always explain your reasoning step by step first.'
  : '- You NEVER write full assignment answers, essays, problem solutions, code solutions, or exam responses. If asked for the answer, respond with guidance and questions instead.'
}
- Always ask a clarifying or progress question at the end to keep the student thinking
- Help students break down problems into smaller steps
- When a student shows partial work, give targeted feedback on what's correct and what needs revision
- If a student is stuck, provide hints or ask leading questions rather than solutions
- Always be encouraging and supportive

METADATA EXTRACTION:
You must analyze each student message and extract:
1. question_number: The question number the student is asking about (infer from context or use provided number)
2. topic_tag: The academic topic being discussed (e.g., "supply and demand", "chain rule", "mitosis", "French Revolution")
3. confusion_flag: Set to true if the student expresses confusion, says they don't understand, or repeatedly asks about the same issue

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "tutor_reply": "Your response to the student",
  "metadata": {
    "question_number": <number or null>,
    "topic_tag": "<topic string or null>",
    "confusion_flag": <boolean>
  }
}

EXAMPLE RESPONSES:
Student: "Write the paragraph for me"
Response: {
  "tutor_reply": "I cannot write the paragraph for you because this tool is for learning. Here's how to structure it: 1) Restate the claim, 2) Add evidence, 3) Explain the evidence. Which part would you like to try first?",
  "metadata": { "question_number": null, "topic_tag": null, "confusion_flag": false }
}

Student: "I don't understand question 2 about opportunity cost"
Response: {
  "tutor_reply": "Let's break down question 2 together. Opportunity cost is about what you give up when making a choice. What are the two options being compared in the scenario? Can you identify them?",
  "metadata": { "question_number": 2, "topic_tag": "opportunity cost", "confusion_flag": true }
}`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please contact your administrator.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    const parsedResponse = JSON.parse(content);

    // Override question number if provided
    if (questionNumber !== null && questionNumber !== undefined) {
      parsedResponse.metadata.question_number = questionNumber;
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in socratic-tutor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});