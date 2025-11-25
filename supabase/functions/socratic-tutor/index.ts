import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { message, conversationId, questionNumber, allowDirectAnswers } = await req.json();
    if (!message || !conversationId)
      return new Response(JSON.stringify({ error: "message and conversationId required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    // Identity optional
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    const uid = u?.user?.id ?? null;

    // Conversation, course, assignment
    const { data: convo, error: ce } = await admin
      .from("conversations")
      .select(
        "id, student_id, course_id, assignment_id, assignments(title, description, allow_direct_answers), courses(code, title)",
      )
      .eq("id", conversationId)
      .maybeSingle();
    if (ce || !convo)
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    if (uid && convo.student_id && uid !== convo.student_id)
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    // Recent history
    const { data: hist } = await admin
      .from("messages")
      .select("sender, text")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Clean up any malformed messages in history that contain JSON metadata
    const cleanedHistory = (hist || []).map((msg) => {
      let cleanText = msg.text;
      // Remove any trailing JSON structure that might have been accidentally stored
      const jsonPattern = /\s*\{"tutor_reply"[\s\S]*"metadata"[\s\S]*\}\s*$/;
      cleanText = cleanText.replace(jsonPattern, "");
      return { sender: msg.sender, text: cleanText };
    });

    // Retrieval query - prefer assignment materials, then course materials
    const assignment = Array.isArray(convo.assignments) ? convo.assignments[0] : convo.assignments;
    const assignmentTitle = assignment?.title ?? "";
    const assignmentDesc = assignment?.description ?? "";

    let rows: Array<{ content: string; title: string; kind: string }> = [];

    // STEP 1: Get ALL chunks from this assignment (all materials, all kinds, ordered by chunk_index)
    // This ensures the tutor has COMPLETE access to the entire assignment document
    const { data: allAssignmentMats, error: allErr } = await admin
      .from("material_text")
      .select("content, chunk_index, materials!inner(title, kind, course_id, assignment_id, text_extracted)")
      .eq("materials.course_id", convo.course_id)
      .eq("materials.assignment_id", convo.assignment_id)
      .eq("materials.text_extracted", true)
      .order("chunk_index", { ascending: true })
      .limit(50);

    console.log("Assignment materials query:", {
      course_id: convo.course_id,
      assignment_id: convo.assignment_id,
      chunks_found: allAssignmentMats?.length || 0,
      error: allErr,
    });

    if (allAssignmentMats && allAssignmentMats.length > 0) {
      rows = allAssignmentMats.map((r: any) => ({
        content: r.content,
        title: r.materials.title,
        kind: r.materials.kind,
      }));
    }

    // STEP 2: If no assignment materials found, check what materials exist
    if (rows.length === 0) {
      const { data: matCheck } = await admin
        .from("materials")
        .select("id, title, kind, text_extracted, assignment_id")
        .eq("course_id", convo.course_id)
        .eq("assignment_id", convo.assignment_id);

      console.log("Materials check:", {
        materials_found: matCheck?.length || 0,
        materials: matCheck,
      });

      // Fallback to course materials using semantic search
      const { data: courseMats } = await admin
        .from("material_text")
        .select("content, materials!inner(title, kind, course_id, assignment_id)")
        .eq("materials.course_id", convo.course_id)
        .is("materials.assignment_id", null)
        .eq("materials.text_extracted", true)
        .textSearch("tsv", message, { type: "websearch", config: "english" })
        .limit(15);

      if (courseMats && courseMats.length > 0) {
        rows = courseMats.map((r: any) => ({
          content: r.content,
          title: r.materials.title,
          kind: r.materials.kind,
        }));
      }
    }

    // Build context with explicit source labels and citations
    let context = "";
    const citations: Array<{ material_title: string; kind: string; snippet: string }> = [];
    for (const r of rows.slice(0, 20)) {
      const snippet = r.content.slice(0, 850); // Increased from 320 to 850 for complete question context
      // Label sources clearly for AI to understand content type
      let sourceLabel = "";
      if (r.kind === "answers") {
        sourceLabel = "[SOURCE: Answer Key - DO NOT REVEAL DIRECTLY]";
      } else if (r.kind === "questions_with_answers") {
        sourceLabel = "[SOURCE: Combined Questions & Answers - USE CAREFULLY]";
      } else if (r.kind === "questions") {
        sourceLabel = "[SOURCE: Assignment Questions]";
      } else {
        sourceLabel = `[SOURCE: ${r.kind}]`;
      }
      context += `${sourceLabel}\n[Material: ${r.title}]\n${snippet}\n\n`;
      citations.push({ material_title: r.title, kind: r.kind, snippet });
    }
    const grounded = citations.length > 0;

    const system = `You are Socratica, an expert Socratic tutor helping students learn through guided questioning.

ASSIGNMENT CONTEXT:
Title: ${assignmentTitle}
Description: ${assignmentDesc}

COMPLETE COURSE MATERIALS:
${context}

YOUR ROLE AS A SOCRATIC TUTOR:
You help students think deeply and arrive at understanding through guided discovery, NOT by giving away answers.

RESPONSE QUALITY GUIDELINES:

1. **Keep Responses CONCISE**
   - Aim for 2-3 SHORT paragraphs maximum
   - Be direct and focused, not exhaustive
   - Don't list multiple scenarios - pick the most likely interpretation

2. **Be Specific and Grounded**
   - Reference the exact question or concept being asked
   - Cite specific concepts, formulas, or principles from the materials
   - Use concrete terms from the assignment, not generic advice

3. **Provide Strategic Hints Without Solutions**
   - Give ONE focused hint or question per response
   - Point to relevant concepts without solving the problem
   - Example: "What does the marginal cost formula tell us about how costs change?"

4. **Maintain Socratic Dialogue**
   - ALWAYS end with ONE clear follow-up question
   - Guide the student toward the next logical step
   
5. **Handle Answer Keys Carefully**
   - Materials marked [SOURCE: Answer Key - DO NOT REVEAL DIRECTLY] contain solutions
   - Use these ONLY to verify student reasoning, never to provide direct answers

6. **Understand Complete Questions**
   - You have access to full assignment questions in the context above
   - When students mention "question 2" or "part 4", you should KNOW what it asks

RESPONSE FORMAT:
- 2-3 short paragraphs maximum
- One focused hint or clarification
- End with ONE follow-up question`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey)
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    const tools = [
      {
        type: "function",
        function: {
          name: "provide_tutoring_response",
          description: "Provide a Socratic tutoring response to help the student learn",
          parameters: {
            type: "object",
            properties: {
              tutor_reply: {
                type: "string",
                description: "Your Socratic guidance response as plain text, ending with a follow-up question"
              },
              question_number: {
                type: ["number", "null"],
                description: "The assignment question number being discussed (1, 2, 3, etc.) or null if unclear"
              },
              topic_tag: {
                type: ["string", "null"],
                description: "Main topic or concept being discussed (e.g., 'elasticity', 'derivatives', 'market equilibrium')"
              },
              confusion_flag: {
                type: "boolean",
                description: "True if the student expresses confusion or is stuck on the same issue repeatedly"
              },
              confidence: {
                type: "number",
                description: "Your confidence that you have relevant context to answer (0.0 to 1.0)"
              }
            },
            required: ["tutor_reply", "confusion_flag", "confidence"],
            additionalProperties: false
          }
        }
      }
    ];

    console.log("Calling LLM with openai/gpt-5-mini, max_completion_tokens: 400, tool calling enabled");
    
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        max_completion_tokens: 400,
        messages: [
          { role: "system", content: system },
          ...cleanedHistory.map((m) => ({ role: m.sender === "student" ? "user" : "assistant", content: m.text })),
          { role: "user", content: message },
        ],
        tools: tools,
        tool_choice: { type: "function", function: { name: "provide_tutoring_response" } }
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("LLM failure", resp.status, text);
      return new Response(
        JSON.stringify({
          tutor_reply: "I could not reach the tutor. Try again in a moment.",
          metadata: {
            question_number: questionNumber ?? null,
            topic_tag: assignmentTitle || null,
            confusion_flag: false,
            citations: [],
            grounded: false,
            confidence: 0.0,
          },
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const json = await resp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    
    let out;
    if (toolCall && toolCall.function?.name === "provide_tutoring_response") {
      // Parse the structured output from tool calling
      try {
        const args = JSON.parse(toolCall.function.arguments);
        out = {
          tutor_reply: args.tutor_reply || "Let us start from the assignment. What part do you want to focus on first?",
          metadata: {
            question_number: args.question_number ?? questionNumber ?? null,
            topic_tag: args.topic_tag || assignmentTitle || null,
            confusion_flag: args.confusion_flag ?? false,
            citations: citations,
            grounded: grounded,
            confidence: args.confidence ?? 0.7,
          }
        };
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        out = {
          tutor_reply: "Let us start from the assignment. What part do you want to focus on first?",
          metadata: {
            question_number: questionNumber ?? null,
            topic_tag: assignmentTitle || null,
            confusion_flag: false,
            citations: [],
            grounded: false,
            confidence: 0.2,
          },
        };
      }
    } else {
      // Fallback if tool calling somehow didn't work
      const content = json?.choices?.[0]?.message?.content || "";
      out = {
        tutor_reply: content || "Let us start from the assignment. What part do you want to focus on first?",
        metadata: {
          question_number: questionNumber ?? null,
          topic_tag: assignmentTitle || null,
          confusion_flag: false,
          citations: [],
          grounded: false,
          confidence: 0.2,
        },
      };
    }

    // Enforce policy
    const allow =
      typeof allowDirectAnswers === "boolean" ? allowDirectAnswers : (assignment?.allow_direct_answers ?? false);
    if (!allow) {
      // Simple guardrail text substitution
      out.tutor_reply = String(out.tutor_reply || "").replace(
        /(?<=^|[\s])(?:(?:the )?final answer|complete solution|here is the answer)[\s:]/gi,
        "a guided next step: ",
      );
    }

    // Add citations if none but we had context
    if (grounded && (!out.metadata || !Array.isArray(out.metadata.citations) || out.metadata.citations.length === 0)) {
      out.metadata = out.metadata || {};
      out.metadata.citations = citations;
      out.metadata.grounded = true;
      out.metadata.confidence = out.metadata.confidence ?? 0.7;
    }

    if (out.metadata && out.metadata.question_number == null && questionNumber != null) {
      out.metadata.question_number = questionNumber;
    }
    if (out.metadata && out.metadata.topic_tag == null) {
      out.metadata.topic_tag = assignmentTitle || null;
    }

    return new Response(JSON.stringify(out), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("socratic-tutor error", e);
    return new Response(
      JSON.stringify({
        tutor_reply: "I hit an error. Ask again and I will try to help.",
        metadata: {
          question_number: null,
          topic_tag: null,
          confusion_flag: false,
          citations: [],
          grounded: false,
          confidence: 0.0,
        },
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
