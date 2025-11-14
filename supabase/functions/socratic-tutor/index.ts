import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, questionNumber, allowDirectAnswers } = await req.json();

    if (!message || !conversationId) {
      return new Response(
        JSON.stringify({ error: "message and conversationId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY env var is missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // get caller (optional)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }

    // get conversation, assignment, course
    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .select(
        "id, student_id, course_id, assignment_id, assignments ( title, description, allow_direct_answers ), courses ( code, title )",
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (convoError || !convo) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (userId && convo.student_id && userId !== convo.student_id) {
      return new Response(
        JSON.stringify({ error: "Not allowed to post to this conversation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // fetch history
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("sender, text")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (historyError) {
      console.error("messages fetch error", historyError);
    }

    const assignment = Array.isArray(convo.assignments) ? convo.assignments[0] : convo.assignments;
    const assignmentTitle = assignment?.title ?? "";
    const assignmentDescription = assignment?.description ?? "";
    const assignmentAllows =
      typeof allowDirectAnswers === "boolean"
        ? allowDirectAnswers
        : (assignment?.allow_direct_answers ?? false);

    const conversationHistory = (history ?? []).map((m) => ({
      role: m.sender === "student" ? "user" : "assistant",
      content: m.text,
    }));

    // Retrieve relevant material chunks
    let contextBlock = "";
    const searchString = `${message} ${assignmentTitle} ${assignmentDescription}`.trim();

    if (searchString) {
      const { data: relevantChunks } = await supabase
        .from("material_text")
        .select(`
          content,
          materials!inner(title, kind, assignment_id)
        `)
        .eq("materials.course_id", convo.course_id)
        .or(
          convo.assignment_id
            ? `materials.assignment_id.eq.${convo.assignment_id},materials.assignment_id.is.null`
            : "materials.assignment_id.is.null"
        )
        .textSearch("tsv", searchString.replace(/[^\w\s]/g, ""), {
          type: "websearch",
          config: "english",
        })
        .limit(8);

      if (relevantChunks && relevantChunks.length > 0) {
        const chunks = relevantChunks.slice(0, 5);
        const contextParts = chunks.map((chunk: any) => {
          const mat = chunk.materials;
          return `[Material: ${mat.title} (${mat.kind})]\n${chunk.content}`;
        });
        contextBlock = contextParts.join("\n\n");
        
        // Limit to 6000 chars
        if (contextBlock.length > 6000) {
          contextBlock = contextBlock.substring(0, 6000) + "...";
        }
      } else if (convo.assignment_id) {
        // Fallback: get first 4 chunks from assignment materials
        const { data: fallbackChunks } = await supabase
          .from("material_text")
          .select(`
            content,
            materials!inner(title, kind)
          `)
          .eq("materials.assignment_id", convo.assignment_id)
          .order("chunk_index", { ascending: true })
          .limit(4);

        if (fallbackChunks && fallbackChunks.length > 0) {
          const contextParts = fallbackChunks.map((chunk: any) => {
            const mat = chunk.materials;
            return `[Material: ${mat.title} (${mat.kind})]\n${chunk.content}`;
          });
          contextBlock = contextParts.join("\n\n");
          
          if (contextBlock.length > 6000) {
            contextBlock = contextBlock.substring(0, 6000) + "...";
          }
        }
      }
    }

    const systemPrompt = `
You are Socratica, a Socratic tutor for students.
Use the assignment context.
Assignment title: ${assignmentTitle}
Assignment description: ${assignmentDescription}

${contextBlock ? `
Context from teacher PDFs follows. Use it to ground your guidance. If something is not in the context, you may still reason, but prefer the provided material text.
<<CONTEXT>>
${contextBlock}
<<END CONTEXT>>
` : ""}

Your job is to guide, not to write the assignment.
If the assignment is graded and direct answers are not allowed, refuse to give the full answer. Explain steps instead.
Always end with a follow up question.

Output JSON only in this exact shape:
{
  "tutor_reply": "string",
  "metadata": {
    "question_number": number | null,
    "topic_tag": string | null,
    "confusion_flag": boolean
  }
}
If you cannot infer a field, set it to null or false.
If the student asks "what should I write about", propose 2 to 4 options tied to the description.
If assignmentAllows is true, you may be more explicit, but still explain.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LLM error", response.status, text);
      return new Response(
        JSON.stringify({ error: "LLM call failed", detail: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await response.json();
    const content = aiJson?.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        tutor_reply:
          content ||
          "Let us start from the description. What part of the assignment do you want to focus on first?",
        metadata: {
          question_number: questionNumber ?? null,
          topic_tag: assignmentTitle || null,
          confusion_flag: false,
        },
      };
    }

    if (!parsed.metadata) {
      parsed.metadata = {
        question_number: questionNumber ?? null,
        topic_tag: assignmentTitle || null,
        confusion_flag: false,
      };
    } else {
      if (parsed.metadata.question_number == null && questionNumber != null) {
        parsed.metadata.question_number = questionNumber;
      }
      if (parsed.metadata.topic_tag == null) {
        parsed.metadata.topic_tag = assignmentTitle || null;
      }
      if (typeof parsed.metadata.confusion_flag !== "boolean") {
        parsed.metadata.confusion_flag = false;
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("socratic-tutor error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
