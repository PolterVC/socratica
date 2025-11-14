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
    const url = new URL(req.url);

    // GET - List materials
    if (req.method === "GET") {
      const courseId = url.searchParams.get("courseId");
      const assignmentId = url.searchParams.get("assignmentId");

      if (!courseId) {
        return new Response(JSON.stringify({ error: "courseId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabase.from("materials").select("*").eq("course_id", courseId);

      if (assignmentId) {
        query = query.eq("assignment_id", assignmentId);
      }

      const { data: materials, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("List materials error:", error);
        return new Response(JSON.stringify({ error: "Failed to list materials" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate signed URLs for each material
      const materialsWithUrls = await Promise.all(
        (materials || []).map(async (material) => {
          const { data: urlData } = await supabase.storage
            .from("materials")
            .createSignedUrl(material.storage_path, 600); // 10 minutes

          return {
            ...material,
            downloadUrl: urlData?.signedUrl || null,
          };
        })
      );

      return new Response(JSON.stringify(materialsWithUrls), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create material record
    if (req.method === "POST") {
      const { courseId, assignmentId, title, kind, storagePath } = await req.json();

      if (!courseId || !title || !kind || !storagePath) {
        return new Response(
          JSON.stringify({ error: "courseId, title, kind, and storagePath required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify teacher owns the course
      const { data: course } = await supabase
        .from("courses")
        .select("teacher_id")
        .eq("id", courseId)
        .maybeSingle();

      if (!course || course.teacher_id !== userId) {
        return new Response(JSON.stringify({ error: "Not authorized for this course" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("materials")
        .insert({
          course_id: courseId,
          assignment_id: assignmentId || null,
          title,
          kind,
          storage_path: storagePath,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.error("Create material error:", error);
        return new Response(JSON.stringify({ error: "Failed to create material" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - Remove material
    if (req.method === "DELETE") {
      const materialId = url.searchParams.get("id");

      if (!materialId) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get material and verify ownership
      const { data: material } = await supabase
        .from("materials")
        .select("*, courses!inner(teacher_id)")
        .eq("id", materialId)
        .maybeSingle();

      if (!material || (material.courses as any).teacher_id !== userId) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete from storage
      await supabase.storage.from("materials").remove([material.storage_path]);

      // Delete from database (cascades to material_text)
      const { error } = await supabase.from("materials").delete().eq("id", materialId);

      if (error) {
        console.error("Delete material error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete material" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("materials error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
