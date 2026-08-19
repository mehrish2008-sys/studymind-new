
import { useMemo, useState } from 'react';
import { useApp } from '@/store';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import type {
  PracticeQuestion,
  Quiz,
  QuizQuestion,
} from '@/types';

export function AIHelper() {
  const {
    subjects,
    notes,
    addPracticeQuestions,
    addGeneratedQuiz,
  } = useApp();

  const [subjectId, setSubjectId] = useState('');
  const [question, setQuestion] = useState('');

  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);

  /*
   * Get the current logged-in user's Supabase access token.
   * The token is sent to /api/ai so the server can verify
   * which StudyMind user is making the request.
   */
  const getAIHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        'You are not logged in. Please log in again.'
      );
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const subject = subjects.find(
    (s) => s.id === subjectId
  );

  /*
   * Give the AI the student's saved notes.
   * Maximum context is kept at 12,000 characters.
   */
  const context = useMemo(
    () =>
      notes
        .filter(
          (n) =>
            !subjectId ||
            n.subjectId === subjectId
        )
        .map(
          (n) =>
            `${n.title}: ${n.content}`
        )
        .join('\n\n')
        .slice(0, 12000),
    [notes, subjectId]
  );

  /*
   * Remove common Markdown formatting from AI answers
   * so the helper looks clean inside the app.
   */
  const cleanAIText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/\$\$(.*?)\$\$/gs, '$1')
      .replace(/\$(.*?)\$/gs, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

  /*
   * NORMAL AI CHAT
   */
  const ask = async () => {
    if (!question.trim() || loading) return;

    const q = question.trim();

    setQuestion('');

    setMessages((m) => [
      ...m,
      {
        role: 'user',
        content: q,
      },
    ]);

    setLoading(true);

    try {
      const headers = await getAIHeaders();

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'chat',
          subject:
            subject?.name || 'General study',
          context,
          question: q,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `AI request failed (${res.status})`
        );
      }

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: cleanAIText(
            data.answer ||
              'I could not generate an answer.'
          ),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'I could not generate an answer.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * GENERATE PRACTICE QUESTIONS + QUIZ
   *
   * This makes TWO AI requests:
   *
   * 1. 5 written practice questions
   * 2. 5 multiple-choice quiz questions
   */
  const generatePractice = async () => {
    if (!subject || practiceLoading) return;

    setPracticeLoading(true);

    try {
      const headers = await getAIHeaders();

      /*
       * First generate the practice questions.
       */
      const practiceRes = await fetch('/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'practice',
          subject: subject.name,
          topic: 'all',
          context,
        }),
      });

      const practiceData =
        await practiceRes.json();

      if (!practiceRes.ok) {
        throw new Error(
          practiceData?.error ||
            `Practice generation failed (${practiceRes.status})`
        );
      }

      /*
       * Get the generated practice questions.
       */
      const raw = Array.isArray(
        practiceData.questions
      )
        ? practiceData.questions
        : [];

      const questions: PracticeQuestion[] =
        raw
          .map((q: any, i: number) => ({
            id: `aiq-${Date.now()}-${i}`,
            subjectId: subject.id,
            topicId:
              subject.topics[0]?.id || '',
            question: String(
              q?.question || ''
            ),
            answer: String(
              q?.answer || ''
            ),
            difficulty: [
              'easy',
              'medium',
              'hard',
            ].includes(q?.difficulty)
              ? q.difficulty
              : 'medium',
          }))
          .filter(
            (q: PracticeQuestion) =>
              q.question.trim() &&
              q.answer.trim()
          );

      if (!questions.length) {
        throw new Error(
          'The AI did not return usable practice questions. Please try again.'
        );
      }

      /*
       * Save practice questions immediately.
       */
      addPracticeQuestions(questions);

      /*
       * Now generate the separate quiz.
       *
       * We send the practice questions to the AI so
       * it knows what NOT to repeat.
       */
      const practiceQuestionTexts =
        questions
          .map((q) => q.question)
          .join('\n- ');

      const quizRes = await fetch('/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'quiz',
          subject: subject.name,
          topic: 'all',
          context,
          excludeQuestions:
            questions.map(
              (q) => q.question
            ),
        }),
      });

      const quizData =
        await quizRes.json();

      if (!quizRes.ok) {
        /*
         * Practice questions were already saved,
         * so don't pretend everything failed.
         */
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `I created ${questions.length} practice questions successfully, but the separate quiz could not be generated. ${quizData?.error || 'Please try again.'}`,
          },
        ]);

        return;
      }

      const quizRaw = Array.isArray(
        quizData.questions
      )
        ? quizData.questions
        : [];

      /*
       * Validate every quiz question carefully.
       */
      const quizQuestions: QuizQuestion[] =
        quizRaw
          .map((q: any, i: number) => {
            const options =
              Array.isArray(q?.options)
                ? q.options.map(
                    (x: any) =>
                      String(x)
                  )
                : [];

            const correctIndex =
              Number(q?.correctIndex);

            if (
              !q?.question ||
              options.length !== 4 ||
              !Number.isInteger(
                correctIndex
              ) ||
              correctIndex < 0 ||
              correctIndex > 3
            ) {
              return null;
            }

            /*
             * The answer must exactly match
             * the option at correctIndex.
             */
            if (
              !options[correctIndex] ||
              String(
                q?.answer || ''
              ).trim() !==
                options[
                  correctIndex
                ].trim()
            ) {
              return null;
            }

            return {
              id: `aiquizq-${Date.now()}-${i}`,
              question: String(
                q.question
              ),
              options,
              correctIndex,
              explanation: String(
                q.explanation ||
                  `The correct answer is ${options[correctIndex]}.`
              ),
            } as QuizQuestion;
          })
          .filter(
            Boolean
          ) as QuizQuestion[];

      /*
       * If quiz generation failed validation,
       * keep the practice questions.
       */
      if (!quizQuestions.length) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: `I created ${questions.length} practice questions, but the quiz data was not usable. You can try generating the quiz again.`,
          },
        ]);

        return;
      }

      /*
       * Determine quiz difficulty from the practice set.
       */
      const difficulties =
        questions.map(
          (q) => q.difficulty
        );

      const difficulty =
        difficulties.includes('hard')
          ? 'hard'
          : difficulties.includes(
                'medium'
              )
            ? 'medium'
            : 'easy';

      /*
       * Create the quiz.
       */
      const quiz: Quiz = {
        id: `aiquiz-${Date.now()}`,
        subjectId: subject.id,
        title: `${subject.name} AI Quiz`,
        description:
          `A separate ${quizQuestions.length}-question multiple-choice quiz generated from your saved ${subject.name} notes.`,
        difficulty,
        questions:
          quizQuestions,
      };

      /*
       * Save the generated quiz.
       */
      addGeneratedQuiz(quiz);

      /*
       * Tell the student everything succeeded.
       */
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            `Done! I created ${questions.length} practice questions and a separate ${quizQuestions.length}-question quiz for ${subject.name}.`,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `I couldn't generate the questions. ${err.message}`
              : 'I could not generate the questions. Please try again.',
        },
      ]);
    } finally {
      setPracticeLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title="AI Study Helper"
        subtitle="Ask questions, get explanations and generate practice questions"
      />

      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Bot size={22} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900">
              Your study assistant
            </h3>

            <p className="text-sm text-gray-500">
              The assistant can use your saved notes when answering.
            </p>
          </div>
        </div>

        <select
          value={subjectId}
          onChange={(e) =>
            setSubjectId(e.target.value)
          }
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-3"
        >
          <option value="">
            All subjects / general help
          </option>

          {subjects.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2 mb-4">
          <Button
            variant="secondary"
            onClick={generatePractice}
            disabled={
              !subject ||
              practiceLoading
            }
            icon={
              practiceLoading ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <HelpCircle
                  size={15}
                />
              )
            }
          >
            {practiceLoading
              ? 'Generating…'
              : 'Generate 5 Practice Questions + Quiz'}
          </Button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto mb-3">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              <Sparkles
                size={16}
                className="inline mr-2 text-brand-500"
              />

              Try: “Explain photosynthesis simply” or “Give me an example of a quadratic equation.”
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2
                size={15}
                className="animate-spin"
              />
              Thinking…
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                ask();
              }
            }}
            placeholder="Ask your study question…"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm"
          />

          <Button
            onClick={ask}
            disabled={
              !question.trim() ||
              loading
            }
            icon={
              <Send size={15} />
            }
          >
            Ask
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <BookOpen size={12} />
          Save notes first for answers grounded in your own class material.
        </p>
      </Card>
    </div>
  );
}

