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
    const queryText = [message, assignmentTitle, assignmentDesc].filter(Boolean).join(" ");

    let rows: Array<{ content: string; title: string; kind: string }> = [];

    // Get assignment materials first using semantic search (top 7 most relevant chunks)
    const { data: assignmentMats } = await admin
      .from("material_text")
      .select("content, materials!inner(title, kind, course_id, assignment_id)")
      .eq("materials.course_id", convo.course_id)
      .eq("materials.assignment_id", convo.assignment_id)
      .eq("materials.text_extracted", true)
      .textSearch("tsv", message, { type: "websearch", config: "english" })
      .limit(7);

    if (assignmentMats && assignmentMats.length > 0) {
      rows = assignmentMats.map((r: any) => ({
        content: r.content,
        title: r.materials.title,
        kind: r.materials.kind,
      }));
    } else {
      // Fallback to course materials using semantic search
      const { data: courseMats } = await admin
        .from("material_text")
        .select("content, materials!inner(title, kind, course_id, assignment_id)")
        .eq("materials.course_id", convo.course_id)
        .is("materials.assignment_id", null)
        .eq("materials.text_extracted", true)
        .textSearch("tsv", message, { type: "websearch", config: "english" })
        .limit(7);

      if (courseMats) {
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
    for (const r of rows.slice(0, 7)) {
      const snippet = r.content.slice(0, 320);
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

    const system = `
You are Socratica, a Socratic tutor for students.

Assignment:
Title: ${assignmentTitle}
Description: ${assignmentDesc}

Context from teacher PDFs follows. Use this context to guide the student effectively.

<<CONTEXT>>
${context}
<<END CONTEXT>>

CRITICAL INSTRUCTIONS FOR ANSWER KEY CONTENT:
- Content marked [SOURCE: Answer Key - DO NOT REVEAL DIRECTLY] contains solutions that must NEVER be revealed directly to students.
- Use Answer Key content ONLY to:
  1. Verify if the student's reasoning is on the right track
  2. Check if their answer is correct (without revealing why)
  3. Guide them toward the correct approach without giving away the solution
- When you see answer key content, respond with guiding questions like "Are you sure about that step?" or "What if you considered...?" instead of revealing the answer.
- For [SOURCE: Combined Questions & Answers], be very careful to only reference the question parts when helping students.

Rules:
- Guide the student through Socratic questioning. Do not write full graded answers unless allowDirectAnswers is explicitly true.
- Ground your responses in the provided context materials when available.
- Always end with a follow-up question that moves the student's thinking forward.
- Output JSON only in this exact shape:
{
  "tutor_reply": "string",
  "metadata": {
    "question_number": number | null,
    "topic_tag": string | null,
    "confusion_flag": boolean,
    "citations": [{"material_title":"string","kind":"string","snippet":"string"}],
    "grounded": boolean,
    "confidence": number
  }
}
Set confidence 0.0 to 1.0 based on how well the context matches the student's question. If you cannot infer a field, set a safe default.
`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey)
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    console.log(
      "LLM PROMPT:",
      JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          ...cleanedHistory.map((m) => ({ role: m.sender === "student" ? "user" : "assistant", content: m.text })),
          { role: "user", content: message },
        ],
      }),
    );
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          ...cleanedHistory.map((m) => ({ role: m.sender === "student" ? "user" : "assistant", content: m.text })),
          { role: "user", content: message },
        ],
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
    let content = json?.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    content = content.trim();

    let out;
    try {
      out = JSON.parse(content);
      
      // Ensure tutor_reply is clean text without nested JSON
      if (out.tutor_reply && typeof out.tutor_reply === "string") {
        // Check if tutor_reply accidentally contains JSON structure
        const jsonPattern = /^\s*\{[\s\S]*"tutor_reply"\s*:\s*"[\s\S]*"\s*,\s*"metadata"\s*:\s*\{[\s\S]*\}\s*\}\s*$/;
        if (jsonPattern.test(out.tutor_reply)) {
          // LLM returned JSON inside JSON, try to parse the inner structure
          try {
            const innerParsed = JSON.parse(out.tutor_reply);
            if (innerParsed.tutor_reply) {
              out = innerParsed;
            }
          } catch {
            // If inner parsing fails, just use the outer structure
          }
        }
      }
    } catch {
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
