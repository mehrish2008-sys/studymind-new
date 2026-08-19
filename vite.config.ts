
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function aiMiddleware(env: Record<string, string>): Plugin {
  return {
    name: 'studymind-ai',

    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];

          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }

          const body = JSON.parse(
            Buffer.concat(chunks).toString('utf8') || '{}'
          );

          const apiKey = env.GEMINI_API_KEY?.trim();

          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error:
                  'GEMINI_API_KEY is not configured. Put your Gemini key in .env and restart the dev server.',
              })
            );
            return;
          }

          const instructions =
            'You are StudyMind, a supportive educational tutor. ' +
            'Explain clearly at student level, show steps when useful, ' +
            'encourage learning, and help students learn rather than cheat.';

          let prompt = '';

          // -------------------------
          // PRACTICE QUESTIONS
          // -------------------------
          if (body.mode === 'practice') {
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

Subject: ${body.subject || 'General'}

Topic: ${body.topic || 'all'}

Notes:
${body.context || '(no notes)'}`;
          }

          // -------------------------
          // QUIZ QUESTIONS
          // -------------------------
          else if (body.mode === 'quiz') {
            const excluded = Array.isArray(body.excludeQuestions)
              ? body.excludeQuestions
                  .map((q: unknown) => String(q))
                  .join('\n- ')
              : '';

            prompt = `${instructions}

Create EXACTLY 5 NEW multiple-choice quiz questions.

IMPORTANT:
These quiz questions MUST be different from the practice questions listed below.

DO NOT copy, repeat, or simply reword any of them.

Practice questions to avoid:
- ${excluded || '(none)'}

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

Subject: ${body.subject || 'General'}

Topic: ${body.topic || 'all'}

Notes:
${body.context || '(no notes)'}`;
          }

          // -------------------------
          // NORMAL AI CHAT
          // -------------------------
          else {
            prompt = `${instructions}

Subject:
${body.subject || 'General study'}

Student notes:
${body.context || '(no saved notes)'}

Student question:
${body.question || ''}`;
          }

          const model =
            env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: instructions }],
                },

                contents: [
                  {
                    role: 'user',
                    parts: [{ text: prompt }],
                  },
                ],

                ...(body.mode === 'practice' || body.mode === 'quiz'
                  ? {
                      generationConfig: {
                        responseMimeType: 'application/json',
                      },
                    }
                  : {}),
              }),
            }
          );

          const data = await geminiResponse.json();

          if (!geminiResponse.ok) {
            res.statusCode = geminiResponse.status;
            res.setHeader('Content-Type', 'application/json');

            res.end(
              JSON.stringify({
                error:
                  data?.error?.message ||
                  'Gemini API request failed.',
              })
            );

            return;
          }

          const text =
            data?.candidates?.[0]?.content?.parts
              ?.map((part: any) => part?.text || '')
              .join('') || '';

          if (!text) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');

            res.end(
              JSON.stringify({
                error: 'Gemini returned an empty response.',
              })
            );

            return;
          }

          res.setHeader('Content-Type', 'application/json');

          // JSON responses
          if (body.mode === 'practice' || body.mode === 'quiz') {
            try {
              const cleaned = text
                .replace(/^```json\s*/i, '')
                .replace(/```$/i, '')
                .trim();

              res.end(JSON.stringify(JSON.parse(cleaned)));
            } catch {
              res.statusCode = 502;

              res.end(
                JSON.stringify({
                  error: 'Gemini returned invalid question data.',
                })
              );
            }

            return;
          }

          // Normal AI answer
          res.end(
            JSON.stringify({
              answer: text,
            })
          );
        } catch (error) {
          console.error('StudyMind AI error:', error);

          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');

          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'AI server error',
            })
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      aiMiddleware(env),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(
          new URL('./src', import.meta.url)
        ),
      },
    },

    optimizeDeps: {
      exclude: ['lucide-react'],
    },

    server: {
      port: 5173,
      strictPort: true,
    },
  };
});

