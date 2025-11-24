import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    const uid = u?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    if (req.method === "GET") {
      const q = new URL(req.url).searchParams;
      const courseId = q.get("courseId");
      const assignmentId = q.get("assignmentId");
      if (!courseId) return new Response(JSON.stringify({ error: "courseId required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      const { data: mats, error } = await admin
        .from("materials")
        .select("id, title, kind, storage_path, file_size, created_at, text_extracted, assignment_id, course_id")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Query error:", error);
        return new Response(JSON.stringify({ error: "DB error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
      }

      const filtered = assignmentId ? mats.filter((m) => m.assignment_id === assignmentId) : mats;
      const withUrls = await Promise.all(filtered.map(async (m) => {
        const { data: s } = await admin.storage.from("materials").createSignedUrl(m.storage_path, 600);
        return { ...m, downloadUrl: s?.signedUrl ?? null };
      }));

      return new Response(JSON.stringify({ items: withUrls }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const q = new URL(req.url).searchParams;
      const id = q.get("id");
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

      const { data: mat } = await admin.from("materials").select("id, created_by, storage_path").eq("id", id).maybeSingle();
      if (!mat || mat.created_by !== uid) return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });

      await admin.storage.from("materials").remove([mat.storage_path]);
      await admin.from("materials").delete().eq("id", id);

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("materials error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
