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
      const { courseId, assignmentId, filename } = await req.json();

      if (!courseId || !filename) {
        return new Response(JSON.stringify({ error: "courseId and filename required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      // Generate unique filename
      const fileId = crypto.randomUUID();
      const storagePath = assignmentId
        ? `${courseId}/${assignmentId}/${fileId}.pdf`
        : `${courseId}/course/${fileId}.pdf`;

      // Create signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("materials")
        .createSignedUploadUrl(storagePath);

      if (uploadError) {
        console.error("Upload URL error:", uploadError);
        return new Response(JSON.stringify({ error: "Failed to create upload URL" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          uploadUrl: uploadData.signedUrl,
          storagePath,
          token: uploadData.token,
        }),
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
    console.error("materials-upload error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
