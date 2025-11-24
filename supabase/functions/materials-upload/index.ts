import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    const uid = u?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { courseId, assignmentId, filename, title, kind, fileSize } = await req.json();

    if (!courseId || !filename || !title || !kind) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (!filename.toLowerCase().endsWith(".pdf")) {
      return new Response(JSON.stringify({ error: "Only PDF files are allowed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // teacher owns course
    const { data: course } = await admin.from("courses").select("id, teacher_id").eq("id", courseId).maybeSingle();
    if (!course || course.teacher_id !== uid) {
      return new Response(JSON.stringify({ error: "Not authorized for this course" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const id = crypto.randomUUID();
    const segment = assignmentId ?? "course";
    const storagePath = `${courseId}/${segment}/${id}.pdf`;

    const { data: signed, error: signErr } = await admin.storage.from("materials").createSignedUploadUrl(storagePath, { upsert: true });
    if (signErr || !signed?.signedUrl) {
      console.error("Upload URL error:", signErr);
      return new Response(JSON.stringify({ error: "Could not create upload URL" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { error: insErr } = await admin.from("materials").insert({
      id, course_id: courseId, assignment_id: assignmentId ?? null, title, kind,
      storage_path: storagePath, file_size: fileSize ?? null, created_by: uid, text_extracted: false
    });
    if (insErr) {
      console.error("DB insert error:", insErr);
      return new Response(JSON.stringify({ error: "Could not create DB row" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ materialId: id, uploadUrl: signed.signedUrl, storagePath }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("materials-upload error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
