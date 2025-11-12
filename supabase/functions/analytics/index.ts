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
    const { courseId, assignmentId } = await req.json();
    
    console.log('Analytics request:', { courseId, assignmentId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all conversations for this assignment
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('course_id', courseId)
      .eq('assignment_id', assignmentId);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw convError;
    }

    if (!conversations || conversations.length === 0) {
      return new Response(
        JSON.stringify({
          messagesByQuestion: [],
          messagesByTopic: [],
          recentMessages: [],
          confusedMessages: 0,
          totalMessages: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const conversationIds = conversations.map(c => c.id);

    // Get all messages for these conversations with student info
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        conversations!inner(
          student_id
        )
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    // Get unique student IDs
    const studentIds = [...new Set((messages || []).map(m => (m.conversations as any).student_id))];
    
    // Fetch profiles for these students
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', studentIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of student IDs to names
    const studentNames = new Map(
      (profiles || []).map(p => [p.id, p.name])
    );

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    console.log('Retrieved messages:', messages?.length || 0);

    // Aggregate by question number
    const questionCounts: Record<number, number> = {};
    const topicCounts: Record<string, number> = {};
    let confusedCount = 0;

    (messages || []).forEach(msg => {
      if (msg.question_number !== null) {
        questionCounts[msg.question_number] = (questionCounts[msg.question_number] || 0) + 1;
      }
      if (msg.topic_tag) {
        topicCounts[msg.topic_tag] = (topicCounts[msg.topic_tag] || 0) + 1;
      }
      if (msg.confusion_flag) {
        confusedCount++;
      }
    });

    // Format for charts
    const messagesByQuestion = Object.entries(questionCounts)
      .map(([question, count]) => ({ question: parseInt(question), count }))
      .sort((a, b) => b.count - a.count);

    const messagesByTopic = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 topics

    // Recent messages with student names
    const recentMessages = (messages || []).slice(0, 50).map(msg => {
      const studentId = (msg.conversations as any)?.student_id;
      return {
        id: msg.id,
        studentName: studentNames.get(studentId) || 'Unknown',
        text: msg.text.substring(0, 200), // First 200 chars
        questionNumber: msg.question_number,
        topicTag: msg.topic_tag,
        confusionFlag: msg.confusion_flag,
        createdAt: msg.created_at,
        conversationId: msg.conversation_id
      };
    });

    return new Response(
      JSON.stringify({
        messagesByQuestion,
        messagesByTopic,
        recentMessages,
        confusedMessages: confusedCount,
        totalMessages: (messages || []).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});