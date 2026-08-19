import { useState } from 'react';
import { useApp } from '@/store';
import type { Quiz } from '@/types';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { getSubjectColor, difficultyConfig, formatDate } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Trophy, RotateCcw, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function Quizzes() {
  const { subjects, quizAttempts, addQuizAttempt, generatedQuizzes } = useApp();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<'list' | 'taking' | 'results'>('list');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const getSubject = (id: string) => subjects.find((s) => s.id === id);
  const availableQuizzes = generatedQuizzes;

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setPhase('taking');
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQ < activeQuiz!.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz done
      const score = newAnswers.filter((a, i) => a === activeQuiz!.questions[i].correctIndex).length;
      addQuizAttempt({
        quizId: activeQuiz!.id,
        score,
        total: activeQuiz!.questions.length,
        date: new Date().toISOString().split('T')[0],
        answers: newAnswers,
      });
      setPhase('results');
    }
  };

  const getScore = () => {
    if (!activeQuiz) return 0;
    return answers.filter((a, i) => a === activeQuiz.questions[i].correctIndex).length;
  };

  // Quiz taking view
  if (phase === 'taking' && activeQuiz) {
    const question = activeQuiz.questions[currentQ];
    const progress = ((currentQ + (showFeedback ? 1 : 0)) / activeQuiz.questions.length) * 100;
    const isCorrect = selectedAnswer === question.correctIndex;

    return (
      <div className="space-y-5 lg:mt-0 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { if (confirm('Leave this quiz? Your progress will be lost.')) { setPhase('list'); setActiveQuiz(null); } }}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} /> Exit
          </button>
          <span className="text-sm font-semibold text-gray-500">{currentQ + 1} / {activeQuiz.questions.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Badge className={difficultyConfig[activeQuiz.difficulty].className}>{difficultyConfig[activeQuiz.difficulty].label}</Badge>
            <span className="text-xs text-gray-500">{activeQuiz.title}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-5">{question.question}</h3>
          <div className="space-y-2.5">
            {question.options.map((option, i) => {
              let style = 'border-gray-200 hover:border-brand-300 hover:bg-brand-50';
              if (showFeedback) {
                if (i === question.correctIndex) {
                  style = 'border-green-500 bg-green-50';
                } else if (i === selectedAnswer) {
                  style = 'border-red-500 bg-red-50';
                } else {
                  style = 'border-gray-200 opacity-50';
                }
              } else if (selectedAnswer === i) {
                style = 'border-brand-500 bg-brand-50';
              }
              return (
                <button
                  key={i}
                  onClick={() => !showFeedback && setSelectedAnswer(i)}
                  disabled={showFeedback}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${style}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    showFeedback && i === question.correctIndex ? 'bg-green-500 text-white' :
                    showFeedback && i === selectedAnswer ? 'bg-red-500 text-white' :
                    selectedAnswer === i ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{option}</span>
                  {showFeedback && i === question.correctIndex && <CheckCircle2 size={18} className="text-green-500 ml-auto" />}
                  {showFeedback && i === selectedAnswer && i !== question.correctIndex && <XCircle size={18} className="text-red-500 ml-auto" />}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`mt-4 p-3.5 rounded-xl animate-fade-in ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {isCorrect ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                <span className={`text-sm font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{question.explanation}</p>
            </div>
          )}

          <div className="mt-5">
            {!showFeedback ? (
              <Button className="w-full" onClick={handleAnswer} disabled={selectedAnswer === null} size="lg">
                Check Answer
              </Button>
            ) : (
              <Button className="w-full" onClick={nextQuestion} size="lg" icon={currentQ < activeQuiz.questions.length - 1 ? <ArrowRight size={16} /> : undefined}>
                {currentQ < activeQuiz.questions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Quiz results view
  if (phase === 'results' && activeQuiz) {
    const score = getScore();
    const total = activeQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);
    const subject = getSubject(activeQuiz.subjectId);
    const colors = subject ? getSubjectColor(subject.color) : null;
    const prevAttempts = quizAttempts.filter((a) => a.quizId === activeQuiz.id && a.date !== new Date().toISOString().split('T')[0]);
    const bestPrev = prevAttempts.length > 0 ? Math.max(...prevAttempts.map((a) => (a.score / a.total) * 100)) : null;
    const improved = bestPrev !== null && percentage > bestPrev;

    return (
      <div className="space-y-5 lg:mt-0 max-w-2xl mx-auto">
        <Card className="text-center py-8">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 ${percentage >= 80 ? 'bg-green-100' : percentage >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
            <Trophy size={36} className={percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-amber-600' : 'text-red-600'} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{score} / {total}</h2>
          <p className="text-lg font-bold text-gray-500">{percentage}%</p>
          {improved && (
            <Badge className="bg-green-100 text-green-700 mt-3">
              <TrendingUp size={12} /> Improved from {bestPrev?.toFixed(0)}%
            </Badge>
          )}
          <p className="text-sm text-gray-500 mt-3">
            {percentage >= 80 ? 'Excellent work! You\'ve mastered this topic.' :
             percentage >= 60 ? 'Good effort! Keep practising to improve.' :
             'Keep going! Review the notes and try again.'}
          </p>
        </Card>

        {/* Question review */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-500 px-1">Review</h3>
          {activeQuiz.questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <Card key={q.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${correct ? 'bg-green-100' : 'bg-red-100'}`}>
                    {correct ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                    {!correct && (
                      <p className="text-xs text-green-600 mt-1">Correct: {q.options[q.correctIndex]}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" icon={<RotateCcw size={16} />} onClick={() => startQuiz(activeQuiz)}>
            Retry
          </Button>
          <Button className="flex-1" onClick={() => { setPhase('list'); setActiveQuiz(null); }}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // Quiz list view
  return (
    <div className="space-y-5 lg:mt-0">
      <PageHeader title="Quizzes" subtitle="Test your knowledge and track scores" />

      {availableQuizzes.length === 0 ? (
        <Card>
          <EmptyState icon={<HelpCircle size={28} />} title="No quizzes yet" description="Quizzes will appear here once available." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 stagger">
          {availableQuizzes.map((quiz) => {
            const subject = getSubject(quiz.subjectId);
            if (!subject) return null;
            const colors = getSubjectColor(subject.color);
            const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;
            const attempts = quizAttempts.filter((a) => a.quizId === quiz.id);
            const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => Math.round((a.score / a.total) * 100))) : null;
            return (
              <Card key={quiz.id} onClick={() => startQuiz(quiz)}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{quiz.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{quiz.description}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <Badge className={difficultyConfig[quiz.difficulty].className}>{difficultyConfig[quiz.difficulty].label}</Badge>
                      <span className="text-xs text-gray-400">{quiz.questions.length} questions</span>
                      {bestScore !== null && (
                        <Badge className="bg-brand-50 text-brand-700">Best: {bestScore}%</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent attempts */}
      {quizAttempts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2 px-1">Recent Attempts</h3>
          <Card className="p-0">
            <div className="divide-y divide-gray-50">
              {quizAttempts.slice().reverse().slice(0, 5).map((attempt) => {
                const quiz = availableQuizzes.find((q) => q.id === attempt.quizId);
                const subject = quiz ? getSubject(quiz.subjectId) : null;
                const pct = Math.round((attempt.score / attempt.total) * 100);
                return (
                  <div key={attempt.id} className="flex items-center gap-3 p-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pct >= 80 ? 'bg-green-100' : pct >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
                      <span className={`text-sm font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{quiz?.title ?? 'Unknown quiz'}</p>
                      <p className="text-xs text-gray-500">{subject?.name} • {formatDate(attempt.date)}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{attempt.score}/{attempt.total}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
