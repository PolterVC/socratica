import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    console.log('Received consulting request:', formData);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a detailed prompt based on the form data
    const prompt = `You are an academic course design consultant specializing in AI-resilient curriculum development.

Course Information:
- Title: ${formData.courseTitle}
- Discipline: ${formData.discipline}
- Class Size: ${formData.classSize || 'Not specified'}
- Delivery: ${formData.delivery || 'Not specified'}
- Current Assessments: ${formData.currentAssessments.join(', ')}
- AI Impact: ${formData.aiImpact || 'Not specified'}
- Meeting Frequency: ${formData.meetingFrequency || 'Not specified'}
- Time to Grade: ${formData.timeToGrade || 'Not specified'}
- Comfort with Oral Exams: ${formData.comfortWithOral || 'Not specified'}
- LMS: ${formData.lms || 'Not specified'}
- Desired Difficulty: ${formData.difficulty || 'Not specified'}
- Goals: ${formData.goals.join(', ') || 'Not specified'}

Generate a concrete, actionable course restructuring plan that:
1. Reduces AI vulnerability in assessments
2. Maintains or increases academic rigor
3. Adds authentic assessment methods (oral exams, in-class work, reflections tied to discussions)
4. Includes at least 2-3 specific in-class engagement activities
5. Provides a clear AI policy paragraph for the syllabus
6. Gives practical LMS integration advice

${formData.discipline === 'Business' ? 'Include business-specific recommendations like case cold calls or business simulations.' : ''}
${formData.discipline === 'Humanities' ? 'Include humanities-specific recommendations like source analysis oral checks or close reading exercises.' : ''}
${formData.discipline === 'Social Science' ? 'Include social science-specific recommendations like data interpretation discussions or field observation reflections.' : ''}

Return your response as a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the plan",
  "assessmentChanges": ["change 1", "change 2", "change 3"],
  "inClassActivities": ["activity 1", "activity 2", "activity 3"],
  "aiPolicy": "A paragraph for the syllabus explaining AI use policy",
  "lmsIntegration": "Practical advice for implementing these changes in their LMS"
}

Be specific, practical, and action-oriented. Each item should be concrete enough that an instructor could implement it immediately.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert academic consultant. Always respond with valid JSON only, no markdown or other formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    const content = data.choices[0].message.content;
    
    // Try to parse the JSON from the response
    let plan;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      // Fallback plan
      plan = {
        summary: "Unable to generate a complete plan. Please try again with different parameters.",
        assessmentChanges: [
          "Replace one traditional assessment with an oral component",
          "Add in-class writing or problem-solving activities",
          "Rotate quiz question banks regularly"
        ],
        inClassActivities: [
          "5-minute warm-up quiz from readings",
          "Think-pair-share discussions",
          "Quick reflection writing tied to class discussion"
        ],
        aiPolicy: "AI tools may be used for brainstorming and outlining only. All submitted work must be written in your own words. Any use of AI must be disclosed and documented. Undisclosed AI use will be treated as academic dishonesty.",
        lmsIntegration: "Create assignment rubrics in your LMS that explicitly address AI use. Use the LMS quiz bank feature for randomized questions."
      };
    }

    return new Response(
      JSON.stringify(plan),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in consulting-plan function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    );
  }
});
