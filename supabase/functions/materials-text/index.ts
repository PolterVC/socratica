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

    const { materialId, chunks } = await req.json();
    if (!materialId || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(JSON.stringify({ error: "materialId and chunks required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: mat } = await admin.from("materials").select("id, created_by").eq("id", materialId).maybeSingle();
    if (!mat || mat.created_by !== uid) {
      return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const rows = chunks.map((c: string, i: number) => ({ material_id: materialId, chunk_index: i, content: c }));
    const { error: insErr } = await admin.from("material_text").insert(rows);
    if (insErr) {
      console.error("Insert chunks error:", insErr);
      return new Response(JSON.stringify({ error: "Could not save chunks" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    await admin.from("materials").update({ text_extracted: true }).eq("id", materialId);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("materials-text error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
