
import { createClient } from "@supabase/supabase-js";

declare const process: {
  env: Record<string, string | undefined>;
};

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(503).json({
        error: "AI service is not configured.",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(503).json({
        error: "Supabase is not configured.",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Please log in to use StudyMind AI.",
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        error: "Your session has expired. Please log in again.",
      });
    }

    const body = req.body || {};

    const { data: planData, error: planError } = await supabase
      .from("user_plans")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError) {
      console.error("Plan lookup error:", planError);

      return res.status(500).json({
        error: "Unable to check your StudyMind plan.",
      });
    }

    const plan = planData?.plan || "free";

    const limits: Record<string, number> = {
      free: 10,
      monthly: 100,
      yearly: 150,
    };

    const dailyLimit = limits[plan] ?? limits.free;

    const today = new Date().toISOString().split("T")[0];

    const { data: usageData, error: usageError } = await supabase
      .from("ai_usage")
      .select("chat_count, practice_count, quiz_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();

    if (usageError) {
      console.error("Usage lookup error:", usageError);

      return res.status(500).json({
        error: "Unable to check your AI usage.",
      });
    }

    const chatCount = usageData?.chat_count || 0;
    const practiceCount = usageData?.practice_count || 0;
    const quizCount = usageData?.quiz_count || 0;

    const currentTotal =
      chatCount +
      practiceCount +
      quizCount;

    if (currentTotal + 1 > dailyLimit) {
      return res.status(429).json({
        error:
          plan === "free"
            ? `You've reached today's free AI limit of ${dailyLimit} requests. Upgrade to Premium for more AI generation.`
            : `You've reached today's AI limit of ${dailyLimit} requests. Please try again tomorrow.`,
        plan,
        limit: dailyLimit,
        used: currentTotal,
      });
    }

    const { error: usageCreateError } = await supabase
      .from("ai_usage")
      .upsert(
        {
          user_id: user.id,
          usage_date: today,
          chat_count: chatCount,
          practice_count: practiceCount,
          quiz_count: quizCount,
        },
        {
          onConflict: "user_id,usage_date",
        }
      );

    if (usageCreateError) {
      console.error("Usage create error:", usageCreateError);

      return res.status(500).json({
        error: "Unable to record AI usage.",
      });
    }

    const instructions =
      "You are StudyMind, a supportive educational tutor. " +
      "Explain clearly at student level, show steps when useful, " +
      "encourage learning, and help students learn rather than cheat.";

    let prompt = "";

    if (body.mode === "practice") {
      prompt = `${instructions}

Create EXACTLY 5 practice questions.

These are study/revision questions, NOT multiple-choice questions.

For every question provide:
- question
- answer
- difficulty

Return ONLY valid JSON:

{
  "questions": [
    {
      "question": "...",
      "answer": "...",
      "difficulty": "easy"
    }
  ]
}

Difficulty must be exactly:
easy
medium
hard

Subject: ${body.subject || "General"}

Topic: ${body.topic || "all"}

Notes:
${body.context || "(no notes)"}`;
    } else if (body.mode === "quiz") {
      const excluded = Array.isArray(body.excludeQuestions)
        ? body.excludeQuestions
            .map((q: unknown) => String(q))
            .join("\n- ")
        : "";

      prompt = `${instructions}

Create EXACTLY 5 NEW multiple-choice quiz questions.

IMPORTANT:
These quiz questions MUST be different from the practice questions listed below.

DO NOT copy, repeat, or simply reword any of them.

Practice questions to avoid:
- ${excluded || "(none)"}

Each quiz question MUST have:
- question
- exactly 4 options
- answer
- correctIndex
- explanation

correctIndex must be:
0, 1, 2, or 3

The answer MUST exactly match the option at correctIndex.

Return ONLY valid JSON:

{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "...",
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}

Subject: ${body.subject || "General"}

Topic: ${body.topic || "all"}

Notes:
${body.context || "(no notes)"}`;
    } else {
      prompt = `${instructions}

Subject:
${body.subject || "General study"}

Student notes:
${body.context || "(no saved notes)"}

Student question:
${body.question || ""}`;
    }

    const model =
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-3.6-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instructions }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          ...(body.mode === "practice" || body.mode === "quiz"
            ? {
                generationConfig: {
                  responseMimeType: "application/json",
                },
              }
            : {}),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed.",
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || "")
        .join("") || "";

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned an empty response.",
      });
    }

    const updateField =
      body.mode === "practice"
        ? "practice_count"
        : body.mode === "quiz"
          ? "quiz_count"
          : "chat_count";

    const currentValue =
      body.mode === "practice"
        ? practiceCount
        : body.mode === "quiz"
          ? quizCount
          : chatCount;

    const { error: usageUpdateError } = await supabase
      .from("ai_usage")
      .update({
        [updateField]: currentValue + 1,
      })
      .eq("user_id", user.id)
      .eq("usage_date", today);

    if (usageUpdateError) {
      console.error("Usage update error:", usageUpdateError);
    }

    if (
      body.mode === "practice" ||
      body.mode === "quiz"
    ) {
      try {
        const cleaned = text
          .replace(/^```json\s*/i, "")
          .replace(/```$/i, "")
          .trim();

        return res.json({
          ...JSON.parse(cleaned),
          plan,
          remaining:
            dailyLimit - currentTotal - 1,
        });
      } catch {
        return res.status(502).json({
          error: "Gemini returned invalid question data.",
        });
      }
    }

    return res.json({
      answer: text,
      plan,
      remaining:
        dailyLimit - currentTotal - 1,
    });
  } catch (error) {
    console.error("StudyMind AI error:", error);

    return res.status(500).json({
      error: "AI service temporarily unavailable.",
    });
  }
}

