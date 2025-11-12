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
    const { joinCode } = await req.json();

    if (!joinCode || typeof joinCode !== "string") {
      return new Response(JSON.stringify({ error: "Join code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from the bearer token
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    // Normalize to uppercase so it matches DB default
    const normalized = joinCode.trim().toUpperCase();

    // Find course by join code
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, code, title")
      .eq("join_code", normalized)
      .maybeSingle();

    if (courseError || !course) {
      console.error("Course lookup error:", courseError);
      return new Response(JSON.stringify({ error: "Invalid join code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing enrollment
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (!existing) {
      const { error: enrollError } = await supabase.from("enrollments").insert({
        student_id: user.id,
        course_id: course.id,
      });

      if (enrollError) {
        console.error("Enrollment error:", enrollError);
        return new Response(JSON.stringify({ error: "Could not enroll" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, course }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("join-course error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
