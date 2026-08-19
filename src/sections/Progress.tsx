import { useApp } from '@/store';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { getSubjectColor, formatDate, daysOfWeek } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { TrendingUp, Target, CheckCircle2, HelpCircle, Clock, Award, BookOpen } from 'lucide-react';

export function Progress() {
  const { subjects, studySessions, tasks, quizAttempts } = useApp();

  const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
  const completedTopics = subjects.reduce((sum, s) => sum + s.topics.filter((t) => t.completed).length, 0);
  const topicPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const completedSessions = studySessions.filter((s) => s.completed).length;
  const sessionPct = studySessions.length > 0 ? Math.round((completedSessions / studySessions.length) * 100) : 0;

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const avgScore = quizAttempts.length > 0
    ? Math.round((quizAttempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / quizAttempts.length) * 10) / 10
    : 0;

  // Weekly study sessions by day
  const sessionsByDay = daysOfWeek.map((day) => ({
    day,
    total: studySessions.filter((s) => s.day === day).length,
    completed: studySessions.filter((s) => s.day === day && s.completed).length,
  }));
  const maxSessions = Math.max(...sessionsByDay.map((d) => d.total), 1);

  // Subject progress
  const subjectProgress = subjects.map((s) => {
    const completed = s.topics.filter((t) => t.completed).length;
    const total = s.topics.length;
    return {
      subject: s,
      completed,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Quiz score trend
  const sortedAttempts = [...quizAttempts].sort((a, b) => a.date.localeCompare(b.date));
  const scoreTrend = sortedAttempts.map((a) => Math.round((a.score / a.total) * 100));

  return (
    <div className="space-y-5 lg:mt-0">
      <div className="lg:hidden">
        <h1 className="text-2xl font-extrabold text-gray-900">Progress</h1>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ProgressStat icon={<Target size={20} />} label="Topics Done" value={`${completedTopics}/${totalTopics}`} pct={topicPct} color="brand" />
        <ProgressStat icon={<CheckCircle2 size={20} />} label="Sessions" value={`${completedSessions}/${studySessions.length}`} pct={sessionPct} color="green" />
        <ProgressStat icon={<CheckCircle2 size={20} />} label="Tasks Done" value={`${completedTasks}/${tasks.length}`} pct={taskPct} color="accent" />
        <ProgressStat icon={<Award size={20} />} label="Quiz Avg" value={`${avgScore}%`} pct={avgScore} color="purple" />
      </div>

      {/* Weekly study chart */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-brand-600" />
          <h2 className="font-bold text-gray-900">Weekly Study Sessions</h2>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {sessionsByDay.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-full gap-1">
                <div className="w-full bg-gray-100 rounded-t-lg rounded-b-lg relative overflow-hidden" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t-lg transition-all duration-700"
                    style={{ height: `${(d.total / maxSessions) * 100}%` }}
                  >
                    {d.completed > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700"
                        style={{ height: `${(d.completed / d.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500">{d.total}</span>
              <span className="text-[10px] text-gray-400 font-medium hidden sm:block">{d.day.slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-brand-500" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500" /> Completed
          </span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Subject progress */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">Subject Progress</h2>
          </div>
          <div className="space-y-3">
            {subjectProgress.map(({ subject, completed, total, pct }) => {
              const colors = getSubjectColor(subject.color);
              const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;
              return (
                <div key={subject.id}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg ${colors.soft} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{subject.name}</span>
                    <span className="text-xs text-gray-500 font-medium">{completed}/{total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-9">
                    <div className={`h-full ${colors.bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quiz score trend */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">Quiz Score Trend</h2>
          </div>
          {sortedAttempts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No quiz attempts yet.</div>
          ) : (
            <>
              <div className="flex items-end gap-3 h-32 mb-4">
                {scoreTrend.map((score, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-700">{score}%</span>
                    <div className="w-full bg-gray-100 rounded-lg flex items-end" style={{ height: '80px' }}>
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ height: `${score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{formatDate(sortedAttempts[i].date)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Best</p>
                  <p className="text-lg font-bold text-green-600">{Math.max(...scoreTrend)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Average</p>
                  <p className="text-lg font-bold text-brand-600">{avgScore}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Attempts</p>
                  <p className="text-lg font-bold text-gray-700">{quizAttempts.length}</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent quiz attempts */}
      {quizAttempts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">Recent Quiz Attempts</h2>
          </div>
          <div className="space-y-2">
            {sortedAttempts.slice().reverse().slice(0, 5).map((attempt) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <div key={attempt.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${pct >= 80 ? 'bg-green-100 text-green-600' : pct >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">{attempt.score}/{attempt.total} correct</p>
                    <p className="text-xs text-gray-500">{formatDate(attempt.date)}</p>
                  </div>
                  <Badge className={pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                    {pct >= 80 ? 'Great' : pct >= 60 ? 'Good' : 'Keep going'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function ProgressStat({ icon, label, value, pct, color }: { icon: React.ReactNode; label: string; value: string; pct: number; color: string }) {
  const colorMap: Record<string, { text: string; bg: string; bar: string }> = {
    brand: { text: 'text-brand-600', bg: 'bg-brand-50', bar: 'bg-brand-500' },
    green: { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' },
    accent: { text: 'text-accent-600', bg: 'bg-accent-50', bar: 'bg-accent-500' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' },
  };
  const c = colorMap[color] ?? colorMap.brand;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text} mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
