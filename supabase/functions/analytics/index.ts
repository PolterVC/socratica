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
    const confusedQuestionCounts: Record<number, number> = {};
    const topicCounts: Record<string, number> = {};
    const confusedTopicCounts: Record<string, number> = {};
    let confusedCount = 0;
    let groundedCount = 0;

    // Track students and their confusion
    const studentActivity = new Map<string, { 
      name: string; 
      confusedMessages: number; 
      lastConfusedTopic: string | null;
      lastConfusedAt: string | null;
    }>();

    (messages || []).forEach(msg => {
      const studentId = (msg.conversations as any)?.student_id;
      
      // Question number tracking
      if (msg.question_number !== null) {
        questionCounts[msg.question_number] = (questionCounts[msg.question_number] || 0) + 1;
        if (msg.confusion_flag) {
          confusedQuestionCounts[msg.question_number] = (confusedQuestionCounts[msg.question_number] || 0) + 1;
        }
      }
      
      // Topic tracking
      if (msg.topic_tag) {
        topicCounts[msg.topic_tag] = (topicCounts[msg.topic_tag] || 0) + 1;
        if (msg.confusion_flag) {
          confusedTopicCounts[msg.topic_tag] = (confusedTopicCounts[msg.topic_tag] || 0) + 1;
        }
      }
      
      // Confusion tracking
      if (msg.confusion_flag) {
        confusedCount++;
        
        // Track per student
        if (studentId) {
          const existing = studentActivity.get(studentId);
          if (!existing) {
            studentActivity.set(studentId, {
              name: studentNames.get(studentId) || 'Unknown',
              confusedMessages: 1,
              lastConfusedTopic: msg.topic_tag,
              lastConfusedAt: msg.created_at
            });
          } else {
            existing.confusedMessages++;
            if (!existing.lastConfusedAt || msg.created_at > existing.lastConfusedAt) {
              existing.lastConfusedTopic = msg.topic_tag;
              existing.lastConfusedAt = msg.created_at;
            }
          }
        }
      }
      
      // Grounded tracking (only count tutor messages)
      if (msg.sender === 'tutor' && msg.grounded !== null) {
        groundedCount += msg.grounded ? 1 : 0;
      }
    });

    const tutorMessages = (messages || []).filter(m => m.sender === 'tutor').length;

    // Format confused questions for chart (top 10)
    const confusedByQuestion = Object.entries(confusedQuestionCounts)
      .map(([question, count]) => ({ 
        question: parseInt(question), 
        count,
        total: questionCounts[parseInt(question)] || count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Format topics with impact (top 5)
    const topicsByImpact = Object.entries(topicCounts)
      .map(([topic, count]) => ({ 
        topic, 
        count,
        confusedCount: confusedTopicCounts[topic] || 0,
        impactPercent: Math.round(((confusedTopicCounts[topic] || 0) / count) * 100)
      }))
      .sort((a, b) => b.confusedCount - a.confusedCount)
      .slice(0, 5);

    // Students needing help (sorted by confusion)
    const studentsNeedingHelp = Array.from(studentActivity.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        confusedMessages: data.confusedMessages,
        lastStuckOn: data.lastConfusedTopic || 'Unknown',
        lastConfusedAt: data.lastConfusedAt
      }))
      .sort((a, b) => b.confusedMessages - a.confusedMessages);

    // Top question with most confusion
    const topConfusedQuestion = confusedByQuestion[0]?.question || null;
    
    // Top topic with most confusion
    const topConfusedTopic = topicsByImpact[0]?.topic || null;

    // Calculate confusion rate
    const confusionRate = messages && messages.length > 0 
      ? Math.round((confusedCount / messages.length) * 100) 
      : 0;

    // Calculate grounded rate
    const groundedRate = tutorMessages > 0
      ? Math.round((groundedCount / tutorMessages) * 100)
      : 100;

    // Recent messages with student names (for detail view)
    const recentMessages = (messages || [])
      .filter(m => m.sender === 'student')
      .slice(0, 50)
      .map(msg => {
        const studentId = (msg.conversations as any)?.student_id;
        return {
          id: msg.id,
          studentName: studentNames.get(studentId) || 'Unknown',
          text: msg.text.substring(0, 200),
          questionNumber: msg.question_number,
          topicTag: msg.topic_tag,
          confusionFlag: msg.confusion_flag,
          createdAt: msg.created_at,
          conversationId: msg.conversation_id
        };
      });

    return new Response(
      JSON.stringify({
        // KPIs
        confusionRate,
        studentsNeedingHelpCount: studentsNeedingHelp.length,
        topConfusedQuestion,
        topConfusedTopic,
        groundedRate,
        totalMessages: (messages || []).length,
        confusedMessages: confusedCount,
        
        // Charts data
        confusedByQuestion,
        topicsByImpact,
        
        // Details
        studentsNeedingHelp,
        recentMessages
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