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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    if (req.method === "POST") {
      const { materialId, chunks } = await req.json();

      if (!materialId || !chunks || !Array.isArray(chunks)) {
        return new Response(
          JSON.stringify({ error: "materialId and chunks array required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify user owns the material
      const { data: material } = await supabase
        .from("materials")
        .select("created_by")
        .eq("id", materialId)
        .maybeSingle();

      if (!material || material.created_by !== userId) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert chunks
      const chunkRecords = chunks.map((content, index) => ({
        material_id: materialId,
        chunk_index: index,
        content,
      }));

      const { error: insertError } = await supabase
        .from("material_text")
        .insert(chunkRecords);

      if (insertError) {
        console.error("Insert chunks error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to insert chunks" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update tsv column for full text search
      const { error: updateError } = await supabase.rpc("update_material_text_tsv", {
        mat_id: materialId,
      });

      if (updateError) {
        console.error("Update tsv error:", updateError);
      }

      // Mark material as extracted
      await supabase
        .from("materials")
        .update({ text_extracted: true })
        .eq("id", materialId);

      return new Response(
        JSON.stringify({ success: true, chunksInserted: chunks.length }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("materials-text error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
