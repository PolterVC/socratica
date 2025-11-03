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
    const { fileName, fileType } = await req.json();
    console.log('Received quiz generation request for file:', fileName);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // For MVP, we'll simulate document analysis and generate relevant questions
    // In production, you would parse the actual document here
    const prompt = `Generate 5 multiple choice questions for a college-level course based on a document titled "${fileName}".

The questions should be:
- Conceptual and test understanding, not just memorization
- Appropriate for in-class engagement and discussion
- Clear and unambiguous
- Have 4 options each with only one correct answer

Return your response as a JSON object with this exact structure:
{
  "title": "Quiz title based on the document name",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

The correctAnswer should be the index (0-3) of the correct option.`;

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
            content: "You are an expert educator creating engaging quiz questions. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let quizData;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quizData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      // Fallback quiz
      quizData = {
        title: fileName.replace(/\.(pdf|pptx)$/i, ''),
        questions: [
          {
            question: "What is the main concept covered in this material?",
            options: ["Concept A", "Concept B", "Concept C", "Concept D"],
            correctAnswer: 0
          },
          {
            question: "Which of the following best describes the key principle?",
            options: ["Principle A", "Principle B", "Principle C", "Principle D"],
            correctAnswer: 1
          },
          {
            question: "How does this concept apply in practice?",
            options: ["Application A", "Application B", "Application C", "Application D"],
            correctAnswer: 2
          },
          {
            question: "What is the significance of this topic?",
            options: ["Significance A", "Significance B", "Significance C", "Significance D"],
            correctAnswer: 0
          },
          {
            question: "Which statement is most accurate?",
            options: ["Statement A", "Statement B", "Statement C", "Statement D"],
            correctAnswer: 3
          }
        ]
      };
    }

    // Generate a random 6-character join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = {
      ...quizData,
      joinCode
    };

    console.log('Generated quiz:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-quiz function:', error);
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
