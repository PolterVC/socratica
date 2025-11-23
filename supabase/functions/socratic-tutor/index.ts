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
    let referencedMaterials: Array<{ title: string; kind: string }> = [];
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
        
        // Track unique materials referenced
        const uniqueMats = new Map();
        chunks.forEach((chunk: any) => {
          const mat = chunk.materials;
          if (!uniqueMats.has(mat.title)) {
            uniqueMats.set(mat.title, { title: mat.title, kind: mat.kind });
          }
        });
        referencedMaterials = Array.from(uniqueMats.values());
        
        console.log(`Retrieved ${chunks.length} relevant material chunks`);
        
        // Limit to 6000 chars
        if (contextBlock.length > 6000) {
          contextBlock = contextBlock.substring(0, 6000) + "...";
        }
      } else if (convo.assignment_id) {
        console.log("No relevant chunks found via search, trying fallback");
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
          
          console.log(`Retrieved ${fallbackChunks.length} chunks via fallback`);
          
          if (contextBlock.length > 6000) {
            contextBlock = contextBlock.substring(0, 6000) + "...";
          }
        } else {
          console.log("No materials found for this assignment");
        }
      }
    }
    
    console.log(`Context block length: ${contextBlock.length} chars`);

    const systemPrompt = `
You are Socratica, an expert Socratic tutor. Your purpose is to help students learn through guided questioning and deep thinking.

ASSIGNMENT CONTEXT:
Title: ${assignmentTitle}
Description: ${assignmentDescription}
Direct answers allowed: ${assignmentAllows ? "YES" : "NO"}

${contextBlock ? `
CRITICAL - COURSE MATERIALS PROVIDED:
The teacher has uploaded materials that you MUST reference and use to guide this conversation. Always cite and refer to specific concepts, definitions, examples, or frameworks from these materials. When the student asks about a topic, check if it's covered in the materials below and direct them to those sections.

Materials context:
---
${contextBlock}
---

When responding:
- If the student's question relates to material above, reference it explicitly ("According to the course materials on X..." or "The reading discusses...")
- Guide students to specific sections or concepts from the materials
- Ask questions that help them connect ideas from the materials to their problem
- If materials don't cover the topic, acknowledge this and work from first principles
` : "No course materials provided. Work from assignment description and first principles."}

YOUR SOCRATIC METHOD:
1. ALWAYS reference course materials when they're provided and relevant
2. Never give complete answers - guide students to discover solutions themselves
3. Ask probing questions that reveal gaps in understanding
4. Break complex problems into manageable steps
5. Acknowledge correct reasoning, then push deeper
6. When students are stuck, point them to relevant material sections through questions
7. If direct answers are not allowed, absolutely refuse to provide final solutions
8. Always end with a question that advances their thinking

OUTPUT FORMAT - Return ONLY valid JSON with no markdown:
{
  "tutor_reply": "Your Socratic response ending with a guiding question",
  "metadata": {
    "question_number": <number or null>,
    "topic_tag": "<main concept discussed>",
    "confusion_flag": <true if student shows confusion/frustration>,
    "materials_referenced": ${JSON.stringify(referencedMaterials)}
  }
}

Do not wrap your response in code fences or markdown. Return raw JSON only.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.7,
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
    let content = aiJson?.choices?.[0]?.message?.content || "";

    // Strip markdown code fences aggressively
    content = content.trim();
    if (content.startsWith("```")) {
      // Remove opening fence (```json or just ```)
      content = content.replace(/^```[a-z]*\n?/, "");
      // Remove closing fence
      content = content.replace(/\n?```$/, "");
      content = content.trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      console.error("Content was:", content);
      // Fallback: try to extract tutor_reply if it's plain text
      parsed = {
        tutor_reply:
          content ||
          "Let's explore this together. What aspect of the assignment would you like to focus on?",
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
        materials_referenced: referencedMaterials,
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
      if (!parsed.metadata.materials_referenced) {
        parsed.metadata.materials_referenced = referencedMaterials;
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
