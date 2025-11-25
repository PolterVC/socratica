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
    const { courseId, assignmentId, from, to } = await req.json();
    
    console.log('Analytics request:', { courseId, assignmentId, from, to });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all conversations for this assignment
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, student_id')
      .eq('course_id', courseId)
      .eq('assignment_id', assignmentId);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw convError;
    }

    if (!conversations || conversations.length === 0) {
      return new Response(
        JSON.stringify({
          kpis: {
            confused_pct: 0,
            students_needing_help: 0,
            top_question: null,
            top_topic: null,
            grounded_rate: 100
          },
          by_question: [],
          topics: [],
          students: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const conversationIds = conversations.map(c => c.id);

    // Get all messages for these conversations
    let messagesQuery = supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Apply date filters if provided
    if (from) {
      messagesQuery = messagesQuery.gte('created_at', from);
    }
    if (to) {
      messagesQuery = messagesQuery.lte('created_at', to);
    }

    const { data: messages, error: msgError } = await messagesQuery;

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    // Get unique student IDs
    const studentIds = [...new Set(conversations.map(c => c.student_id))];
    
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

    // Create conversation to student map
    const convToStudent = new Map(
      conversations.map(c => [c.id, c.student_id])
    );

    console.log('Retrieved messages:', messages?.length || 0);

    // Calculate KPIs and aggregations
    const studentMessages = (messages || []).filter(m => m.sender === 'student');
    const tutorMessages = (messages || []).filter(m => m.sender === 'tutor');
    
    const confusedCount = studentMessages.filter(m => m.confusion_flag).length;
    const groundedCount = tutorMessages.filter(m => m.grounded !== false).length;
    
    const confused_pct = studentMessages.length > 0 
      ? Math.round((confusedCount / studentMessages.length) * 100) 
      : 0;
    
    const grounded_rate = tutorMessages.length > 0
      ? Math.round((groundedCount / tutorMessages.length) * 100)
      : 100;

    // Aggregate by question number (confused only)
    const questionCounts: Record<number, number> = {};
    studentMessages.forEach(msg => {
      if (msg.question_number !== null && msg.confusion_flag) {
        questionCounts[msg.question_number] = (questionCounts[msg.question_number] || 0) + 1;
      }
    });

    // Aggregate by topic (confused only)
    const topicCounts: Record<string, number> = {};
    studentMessages.forEach(msg => {
      if (msg.topic_tag && msg.confusion_flag) {
        topicCounts[msg.topic_tag] = (topicCounts[msg.topic_tag] || 0) + 1;
      }
    });

    // Format for charts
    const by_question = Object.entries(questionCounts)
      .map(([question, count]) => ({ question: parseInt(question), confused: count }))
      .sort((a, b) => b.confused - a.confused);

    const topics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, confused: count }))
      .sort((a, b) => b.confused - a.confused)
      .slice(0, 5); // Top 5

    // Get top question and topic
    const top_question = by_question.length > 0 ? by_question[0].question : null;
    const top_topic = topics.length > 0 ? topics[0].topic : null;

    // Get students needing help (those with confused messages)
    const confusedStudentIds = new Set<string>();
    const studentLastConfused = new Map<string, { 
      question: number | null, 
      topic: string | null, 
      last_ts: string,
      conversation_id: string,
      text: string 
    }>();

    studentMessages.forEach(msg => {
      if (msg.confusion_flag) {
        const studentId = convToStudent.get(msg.conversation_id);
        if (studentId) {
          confusedStudentIds.add(studentId);
          
          // Track most recent confused message per student
          const existing = studentLastConfused.get(studentId);
          if (!existing || new Date(msg.created_at) > new Date(existing.last_ts)) {
            studentLastConfused.set(studentId, {
              question: msg.question_number,
              topic: msg.topic_tag,
              last_ts: msg.created_at,
              conversation_id: msg.conversation_id,
              text: msg.text
            });
          }
        }
      }
    });

    const students = Array.from(confusedStudentIds).map(studentId => {
      const lastConfused = studentLastConfused.get(studentId)!;
      return {
        student_id: studentId,
        student_name: studentNames.get(studentId) || 'Unknown',
        question: lastConfused.question,
        topic: lastConfused.topic,
        last_ts: lastConfused.last_ts,
        conversation_id: lastConfused.conversation_id,
        confused: true,
        last_message: lastConfused.text.substring(0, 100)
      };
    }).sort((a, b) => new Date(b.last_ts).getTime() - new Date(a.last_ts).getTime());

    const kpis = {
      confused_pct,
      students_needing_help: confusedStudentIds.size,
      top_question,
      top_topic,
      grounded_rate
    };

    return new Response(
      JSON.stringify({
        kpis,
        by_question,
        topics,
        students
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
